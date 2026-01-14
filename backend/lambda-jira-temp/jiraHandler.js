"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_1 = require("@prisma/client");
const response_1 = require("./lib/response");
const prisma = new client_1.PrismaClient();
const handler = async (event) => {
    console.log('Jira Handler - Event:', JSON.stringify(event));
    const method = event.httpMethod;
    const path = event.path;
    try {
        if (method === 'GET' && path.includes('/projects')) {
            return await listJiraProjects(event);
        }
        if (method === 'POST' && path.includes('/import')) {
            return await importFromJira(event);
        }
        if (method === 'POST' && path.includes('/sync/')) {
            return await syncProject(event);
        }
        return (0, response_1.errorResponse)('Ruta no encontrada', 404);
    }
    catch (error) {
        console.error('Error en Jira Handler:', error);
        return (0, response_1.errorResponse)(error instanceof Error ? error.message : 'Error interno del servidor');
    }
};
exports.handler = handler;
async function listJiraProjects(event) {
    const jiraUrl = event.queryStringParameters?.jiraUrl;
    const apiToken = event.queryStringParameters?.apiToken;
    const email = event.queryStringParameters?.email;
    if (!jiraUrl || !apiToken || !email) {
        return (0, response_1.errorResponse)('Se requiere jiraUrl, apiToken y email', 400);
    }
    try {
        const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
        const response = await fetch(`${jiraUrl}/rest/api/3/project`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Error de Jira: ${response.status} ${response.statusText}`);
        }
        const projects = await response.json();
        return (0, response_1.successResponse)({
            projects: projects.map((p) => ({
                id: p.id,
                key: p.key,
                name: p.name,
                projectTypeKey: p.projectTypeKey,
                style: p.style
            }))
        });
    }
    catch (error) {
        console.error('Error listando proyectos de Jira:', error);
        return (0, response_1.errorResponse)(error instanceof Error ? error.message : 'Error conectando con Jira');
    }
}
async function importFromJira(event) {
    if (!event.body) {
        return (0, response_1.errorResponse)('Body requerido', 400);
    }
    const body = JSON.parse(event.body);
    const { jiraUrl, apiToken, email, projectKeys, jqlQuery, team } = body;
    console.log('[1] Validando campos...');
    if (!jiraUrl || !apiToken || !email || !team) {
        return (0, response_1.errorResponse)('Campos requeridos: jiraUrl, apiToken, email, team', 400);
    }
    try {
        console.log('[2] Preparando autenticación con Jira...');
        const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
        let issues = [];
        console.log('[3] Iniciando fetch de issues desde Jira...');
        if (projectKeys && projectKeys.length > 0) {
            console.log(`[3a] Importando por projectKeys: ${projectKeys}`);
            for (const projectKey of projectKeys) {
                const projectIssues = await fetchJiraIssues(jiraUrl, auth, `project = ${projectKey}`);
                issues = issues.concat(projectIssues);
            }
        }
        else if (jqlQuery) {
            console.log(`[3b] Importando con JQL: ${jqlQuery}`);
            issues = await fetchJiraIssues(jiraUrl, auth, jqlQuery);
        }
        else {
            return (0, response_1.errorResponse)('Se requiere projectKeys o jqlQuery', 400);
        }
        console.log(`[4] Encontrados ${issues.length} issues en Jira`);
        const projectsMap = new Map();
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
            projectsMap.get(projectKey).push(issue);
        });
        const importedProjects = [];
        for (const [projectKey, projectIssues] of projectsMap) {
            const existingProject = await prisma.project.findFirst({
                where: { code: projectKey, team }
            });
            if (existingProject) {
                console.log(`Proyecto ${projectKey} ya existe, omitiendo...`);
                continue;
            }
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
                    domain: 0,
                    priority: mapJiraPriorityToLocal(firstIssue.fields.priority?.name),
                    status: mapJiraStatusToLocal(firstIssue.fields.status.name),
                    startDate: new Date(firstIssue.fields.created),
                    endDate: firstIssue.fields.duedate ? new Date(firstIssue.fields.duedate) : null,
                    team,
                    jiraProjectKey: projectKey,
                    jiraUrl: jiraUrl
                }
            });
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
                }
                catch (error) {
                    console.error(`Error creando assignment ${issue.key}:`, error);
                }
            }
            importedProjects.push({
                project,
                assignmentsCount: assignments.length
            });
        }
        return (0, response_1.successResponse)({
            message: `Importados ${importedProjects.length} proyectos con éxito`,
            imported: importedProjects.map(p => ({
                code: p.project.code,
                title: p.project.title,
                assignmentsCount: p.assignmentsCount
            })),
            totalIssues: issues.length
        });
    }
    catch (error) {
        console.error('Error importando desde Jira:', error);
        return (0, response_1.errorResponse)(error instanceof Error ? error.message : 'Error importando proyectos');
    }
}
async function syncProject(event) {
    const projectId = event.pathParameters?.projectId;
    if (!projectId) {
        return (0, response_1.errorResponse)('projectId requerido', 400);
    }
    if (!event.body) {
        return (0, response_1.errorResponse)('Body requerido', 400);
    }
    const body = JSON.parse(event.body);
    const { jiraUrl, apiToken, email } = body;
    if (!jiraUrl || !apiToken || !email) {
        return (0, response_1.errorResponse)('Campos requeridos: jiraUrl, apiToken, email', 400);
    }
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { assignments: true }
        });
        if (!project) {
            return (0, response_1.errorResponse)('Proyecto no encontrado', 404);
        }
        if (!project.jiraProjectKey) {
            return (0, response_1.errorResponse)('Este proyecto no está vinculado a Jira', 400);
        }
        const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
        const jql = `project = ${project.jiraProjectKey}`;
        const issues = await fetchJiraIssues(jiraUrl, auth, jql);
        let updated = 0;
        let created = 0;
        for (const issue of issues) {
            const existingAssignment = project.assignments.find(a => a.jiraIssueKey === issue.key);
            const estimatedHours = issue.fields.customfield_10016 ? issue.fields.customfield_10016 * 8 : 8;
            if (existingAssignment) {
                await prisma.assignment.update({
                    where: { id: existingAssignment.id },
                    data: {
                        title: issue.fields.summary,
                        description: extractPlainText(issue.fields.description),
                        hours: estimatedHours
                    }
                });
                updated++;
            }
            else {
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
        await prisma.project.update({
            where: { id: project.id },
            data: { updatedAt: new Date() }
        });
        return (0, response_1.successResponse)({
            message: 'Proyecto sincronizado con éxito',
            projectCode: project.code,
            updated,
            created,
            total: issues.length
        });
    }
    catch (error) {
        console.error('Error sincronizando proyecto:', error);
        return (0, response_1.errorResponse)(error instanceof Error ? error.message : 'Error sincronizando proyecto');
    }
}
async function fetchJiraIssues(jiraUrl, auth, jql) {
    const allIssues = [];
    let startAt = 0;
    const maxResults = 100;
    const timeoutMs = 30000;
    const MAX_PAGES = 50;
    let pageCount = 0;
    console.log('[fetchJiraIssues] Iniciando fetch...');
    while (pageCount < MAX_PAGES) {
        pageCount++;
        const url = `${jiraUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}&fields=summary,description,issuetype,status,priority,created,updated,duedate,customfield_10016`;
        console.log(`[fetchJiraIssues] Fetching página ${startAt / maxResults + 1}...`);
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
            const data = await response.json();
            const issuesReceived = data.issues?.length || 0;
            const totalReported = data.total || 0;
            console.log(`[fetchJiraIssues] Recibidos ${issuesReceived} issues. Total reportado: ${totalReported}`);
            if (issuesReceived === 0) {
                console.log(`[fetchJiraIssues] No hay más issues. Total final: ${allIssues.length} issues`);
                break;
            }
            allIssues.push(...data.issues);
            if (totalReported > 0 && allIssues.length >= totalReported) {
                console.log(`[fetchJiraIssues] Alcanzado el total reportado (${totalReported}). Total: ${allIssues.length} issues`);
                break;
            }
            if (data.startAt + data.maxResults >= totalReported && totalReported > 0) {
                console.log(`[fetchJiraIssues] Completado según paginación. Total: ${allIssues.length} issues`);
                break;
            }
            startAt += maxResults;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error?.name === 'AbortError') {
                throw new Error(`Timeout conectando con Jira después de ${timeoutMs}ms`);
            }
            throw error;
        }
    }
    return allIssues;
}
function mapIssueTypeToProjectType(jiraType) {
    const type = jiraType.toLowerCase();
    if (type.includes('epic') || type.includes('project')) {
        return 'Proyecto';
    }
    return 'Evolutivo';
}
function mapJiraPriorityToLocal(jiraPriority) {
    if (!jiraPriority)
        return 'Normal';
    const priority = jiraPriority.toLowerCase();
    if (priority.includes('highest') || priority.includes('critical'))
        return 'Crítica';
    if (priority.includes('high'))
        return 'Alta';
    if (priority.includes('low'))
        return 'Baja';
    if (priority.includes('lowest'))
        return 'Muy Baja';
    return 'Normal';
}
function mapJiraStatusToLocal(jiraStatus) {
    const status = jiraStatus.toLowerCase();
    if (status.includes('done') || status.includes('closed') || status.includes('resolved'))
        return 3;
    if (status.includes('progress') || status.includes('development'))
        return 1;
    if (status.includes('blocked'))
        return 1;
    return 0;
}
function extractPlainText(description) {
    if (!description)
        return '';
    if (typeof description === 'string')
        return description;
    if (description.type === 'doc' && description.content) {
        return extractTextFromADF(description.content);
    }
    return JSON.stringify(description);
}
function extractTextFromADF(content) {
    let text = '';
    for (const node of content) {
        if (node.type === 'text') {
            text += node.text;
        }
        else if (node.type === 'paragraph' || node.type === 'heading') {
            if (node.content) {
                text += extractTextFromADF(node.content) + '\n';
            }
        }
        else if (node.content) {
            text += extractTextFromADF(node.content);
        }
    }
    return text.trim();
}
//# sourceMappingURL=jiraHandler.js.map