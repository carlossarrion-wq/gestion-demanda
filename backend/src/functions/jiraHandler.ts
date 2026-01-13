import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../lib/response';

const prisma = new PrismaClient();

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: any;
    issuetype: {
      name: string;
    };
    status: {
      name: string;
    };
    priority?: {
      name: string;
    };
    created: string;
    updated: string;
    duedate?: string;
    customfield_10016?: number; // Story points
  };
}

interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  style: string;
}

/**
 * Lambda handler para integración con Jira
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Jira Handler - Event:', JSON.stringify(event));

  const method = event.httpMethod;
  const path = event.path;

  try {
    // GET /jira/projects - Listar proyectos de Jira
    if (method === 'GET' && path.includes('/projects')) {
      return await listJiraProjects(event);
    }

    // POST /jira/import - Importar proyectos desde Jira
    if (method === 'POST' && path.includes('/import')) {
      return await importFromJira(event);
    }

    // POST /jira/sync/{projectId} - Sincronizar proyecto específico
    if (method === 'POST' && path.includes('/sync/')) {
      return await syncProject(event);
    }

    return errorResponse('Ruta no encontrada', 404);
  } catch (error) {
    console.error('Error en Jira Handler:', error);
    return errorResponse(error instanceof Error ? error.message : 'Error interno del servidor');
  }
};

/**
 * Listar proyectos disponibles en Jira
 */
async function listJiraProjects(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const jiraUrl = event.queryStringParameters?.jiraUrl;
  const apiToken = event.queryStringParameters?.apiToken;
  const email = event.queryStringParameters?.email;

  if (!jiraUrl || !apiToken || !email) {
    return errorResponse('Se requiere jiraUrl, apiToken y email', 400);
  }

  try {
    // Autenticación básica con Jira
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    // Obtener proyectos de Jira
    const response = await fetch(`${jiraUrl}/rest/api/3/project`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error de Jira: ${response.status} ${response.statusText}`);
    }

    const projects = await response.json() as JiraProject[];

    return successResponse({
      projects: projects.map((p: JiraProject) => ({
        id: p.id,
        key: p.key,
        name: p.name,
        projectTypeKey: p.projectTypeKey,
        style: p.style
      }))
    });
  } catch (error) {
    console.error('Error listando proyectos de Jira:', error);
    return errorResponse(error instanceof Error ? error.message : 'Error conectando con Jira');
  }
}

/**
 * Importar proyectos desde Jira
 */
async function importFromJira(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Body requerido', 400);
  }

  const body = JSON.parse(event.body);
  const { jiraUrl, apiToken, email, projectKeys, jqlQuery, team } = body;

  console.log('[1] Validando campos...');

  // Validar campos requeridos
  if (!jiraUrl || !apiToken || !email || !team) {
    return errorResponse('Campos requeridos: jiraUrl, apiToken, email, team', 400);
  }

  try {
    console.log('[2] Preparando autenticación con Jira...');
    // Autenticación con Jira
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    let issues: JiraIssue[] = [];

    console.log('[3] Iniciando fetch de issues desde Jira...');
    
    // Opción 1: Importar por claves de proyecto específicas
    if (projectKeys && projectKeys.length > 0) {
      console.log(`[3a] Importando por projectKeys: ${projectKeys}`);
      for (const projectKey of projectKeys) {
        const projectIssues = await fetchJiraIssues(jiraUrl, auth, `project = ${projectKey}`);
        issues = issues.concat(projectIssues);
      }
    }
    // Opción 2: Usar JQL personalizado
    else if (jqlQuery) {
      console.log(`[3b] Importando con JQL: ${jqlQuery}`);
      issues = await fetchJiraIssues(jiraUrl, auth, jqlQuery);
    }
    else {
      return errorResponse('Se requiere projectKeys o jqlQuery', 400);
    }

    console.log(`[4] Encontrados ${issues.length} issues en Jira`);

    // Agrupar issues por proyecto
    const projectsMap = new Map<string, JiraIssue[]>();
    issues.forEach(issue => {
      const parts = issue.key.split('-');
      const projectKey = parts[0];
      
      if (!projectKey) {
        console.warn(`Issue ${issue.key} has invalid key format`);
        return;
      }
      
      if (!projectsMap.has(projectKey)) {
        projectsMap.set(projectKey, []);
      }
      projectsMap.get(projectKey)!.push(issue);
    });

    const importedProjects = [];

    // Crear proyectos en la base de datos
    for (const [projectKey, projectIssues] of projectsMap) {
      // Buscar si el proyecto ya existe
      const existingProject = await prisma.project.findFirst({
        where: { code: projectKey, team }
      });

      if (existingProject) {
        console.log(`Proyecto ${projectKey} ya existe, omitiendo...`);
        continue;
      }

      // Crear proyecto
      const firstIssue = projectIssues[0];
      if (!firstIssue) {
        console.log(`No hay issues para proyecto ${projectKey}, omitiendo...`);
        continue;
      }

      const project = await prisma.project.create({
        data: {
          code: projectKey,
          type: mapIssueTypeToProjectType(firstIssue.fields.issuetype.name),
          title: projectKey,
          description: `Proyecto importado desde Jira - ${projectIssues.length} tareas`,
          domain: 0, // Default
          priority: mapJiraPriorityToLocal(firstIssue.fields.priority?.name),
          status: mapJiraStatusToLocal(firstIssue.fields.status.name),
          startDate: new Date(firstIssue.fields.created),
          endDate: firstIssue.fields.duedate ? new Date(firstIssue.fields.duedate) : null,
          team,
          jiraProjectKey: projectKey,
          jiraUrl: jiraUrl
        }
      });

      // Crear assignments (tareas) para este proyecto
      const assignments = [];
      for (const issue of projectIssues) {
        try {
          const estimatedHours = issue.fields.customfield_10016 ? issue.fields.customfield_10016 * 8 : 8;
          const startDate = new Date(issue.fields.created);
          
          const assignment = await prisma.assignment.create({
            data: {
              projectId: project.id,
              title: issue.fields.summary,
              description: extractPlainText(issue.fields.description),
              hours: estimatedHours,
              date: startDate,
              month: startDate.getMonth() + 1,
              year: startDate.getFullYear(),
              team: team,
              jiraIssueKey: issue.key,
              jiraIssueId: issue.id
            }
          });
          assignments.push(assignment);
        } catch (error) {
          console.error(`Error creando assignment ${issue.key}:`, error);
        }
      }

      importedProjects.push({
        project,
        assignmentsCount: assignments.length
      });
    }

    return successResponse({
      message: `Importados ${importedProjects.length} proyectos con éxito`,
      imported: importedProjects.map(p => ({
        code: p.project.code,
        title: p.project.title,
        assignmentsCount: p.assignmentsCount
      })),
      totalIssues: issues.length
    });
  } catch (error) {
    console.error('Error importando desde Jira:', error);
    return errorResponse(error instanceof Error ? error.message : 'Error importando proyectos');
  }
}

/**
 * Sincronizar proyecto específico con Jira
 */
async function syncProject(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const projectId = event.pathParameters?.projectId;

  if (!projectId) {
    return errorResponse('projectId requerido', 400);
  }

  if (!event.body) {
    return errorResponse('Body requerido', 400);
  }

  const body = JSON.parse(event.body);
  const { jiraUrl, apiToken, email } = body;

  if (!jiraUrl || !apiToken || !email) {
    return errorResponse('Campos requeridos: jiraUrl, apiToken, email', 400);
  }

  try {
    // Obtener proyecto de la BD
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { assignments: true }
    });

    if (!project) {
      return errorResponse('Proyecto no encontrado', 404);
    }

    if (!project.jiraProjectKey) {
      return errorResponse('Este proyecto no está vinculado a Jira', 400);
    }

    // Autenticación con Jira
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    // Obtener issues actualizados de Jira
    const jql = `project = ${project.jiraProjectKey}`;
    const issues = await fetchJiraIssues(jiraUrl, auth, jql);

    let updated = 0;
    let created = 0;

    // Sincronizar cada issue
    for (const issue of issues) {
      const existingAssignment = project.assignments.find(a => a.jiraIssueKey === issue.key);
      const estimatedHours = issue.fields.customfield_10016 ? issue.fields.customfield_10016 * 8 : 8;

      if (existingAssignment) {
        // Actualizar assignment existente
        await prisma.assignment.update({
          where: { id: existingAssignment.id },
          data: {
            title: issue.fields.summary,
            description: extractPlainText(issue.fields.description),
            hours: estimatedHours
          }
        });
        updated++;
      } else {
        // Crear nuevo assignment
        const startDate = new Date(issue.fields.created);
        await prisma.assignment.create({
          data: {
            projectId: project.id,
            title: issue.fields.summary,
            description: extractPlainText(issue.fields.description),
            hours: estimatedHours,
            date: startDate,
            month: startDate.getMonth() + 1,
            year: startDate.getFullYear(),
            team: project.team,
            jiraIssueKey: issue.key,
            jiraIssueId: issue.id
          }
        });
        created++;
      }
    }

    // Actualizar fecha de última sincronización
    await prisma.project.update({
      where: { id: project.id },
      data: { updatedAt: new Date() }
    });

    return successResponse({
      message: 'Proyecto sincronizado con éxito',
      projectCode: project.code,
      updated,
      created,
      total: issues.length
    });
  } catch (error) {
    console.error('Error sincronizando proyecto:', error);
    return errorResponse(error instanceof Error ? error.message : 'Error sincronizando proyecto');
  }
}

/**
 * Obtener issues de Jira usando JQL
 */
async function fetchJiraIssues(jiraUrl: string, auth: string, jql: string): Promise<JiraIssue[]> {
  const allIssues: JiraIssue[] = [];
  let startAt = 0;
  const maxResults = 100;
  const timeoutMs = 30000; // 30 segundos timeout

  console.log('[fetchJiraIssues] Iniciando fetch...');

  while (true) {
    const url = `${jiraUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}&fields=summary,description,issuetype,status,priority,created,updated,duedate,customfield_10016`;

    console.log(`[fetchJiraIssues] Fetching página ${startAt / maxResults + 1}...`);

    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[fetchJiraIssues] Error ${response.status}: ${errorText}`);
        throw new Error(`Error de Jira: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      const issuesReceived = data.issues?.length || 0;
      console.log(`[fetchJiraIssues] Recibidos ${issuesReceived} issues. Total reportado: ${data.total || 0}`);
      
      // Si no hay issues en esta página, salir del loop
      if (issuesReceived === 0) {
        console.log(`[fetchJiraIssues] No hay más issues. Total final: ${allIssues.length} issues`);
        break;
      }
      
      allIssues.push(...data.issues);

      // Si llegamos al total, salir
      if (data.startAt + data.maxResults >= data.total) {
        console.log(`[fetchJiraIssues] Completado. Total: ${allIssues.length} issues`);
        break;
      }

      startAt += maxResults;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        throw new Error(`Timeout conectando con Jira después de ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  return allIssues;
}

/**
 * Mapear tipo de issue de Jira a tipo de proyecto local
 */
function mapIssueTypeToProjectType(jiraType: string): string {
  const type = jiraType.toLowerCase();
  if (type.includes('epic') || type.includes('project')) {
    return 'Proyecto';
  }
  return 'Evolutivo';
}

/**
 * Mapear prioridad de Jira a prioridad local
 */
function mapJiraPriorityToLocal(jiraPriority?: string): string {
  if (!jiraPriority) return 'Normal';

  const priority = jiraPriority.toLowerCase();
  if (priority.includes('highest') || priority.includes('critical')) return 'Crítica';
  if (priority.includes('high')) return 'Alta';
  if (priority.includes('low')) return 'Baja';
  if (priority.includes('lowest')) return 'Muy Baja';
  return 'Normal';
}

/**
 * Mapear estado de Jira a estado local
 */
function mapJiraStatusToLocal(jiraStatus: string): number {
  const status = jiraStatus.toLowerCase();
  if (status.includes('done') || status.includes('closed') || status.includes('resolved')) return 3;
  if (status.includes('progress') || status.includes('development')) return 1;
  if (status.includes('blocked')) return 1;
  return 0; // Planificado por defecto
}

/**
 * Extraer texto plano de descripción de Jira (puede venir en formato ADF)
 */
function extractPlainText(description: any): string {
  if (!description) return '';
  
  if (typeof description === 'string') return description;
  
  // Si es formato ADF (Atlassian Document Format)
  if (description.type === 'doc' && description.content) {
    return extractTextFromADF(description.content);
  }
  
  return JSON.stringify(description);
}

/**
 * Extraer texto de formato ADF recursivamente
 */
function extractTextFromADF(content: any[]): string {
  let text = '';
  
  for (const node of content) {
    if (node.type === 'text') {
      text += node.text;
    } else if (node.type === 'paragraph' || node.type === 'heading') {
      if (node.content) {
        text += extractTextFromADF(node.content) + '\n';
      }
    } else if (node.content) {
      text += extractTextFromADF(node.content);
    }
  }
  
  return text.trim();
}
