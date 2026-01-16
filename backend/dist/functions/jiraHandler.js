"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_1 = require("@prisma/client");
const response_1 = require("../lib/response");
const prisma = new client_1.PrismaClient();
const handler = async (event) => {
    console.log('Jira Handler - Event:', JSON.stringify(event));
    const method = event.httpMethod;
    const path = event.path;
    try {
        if (method === 'GET' && path.includes('/issues')) {
            return await listJiraIssues(event);
        }
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
async function listJiraIssues(event) {
    const jiraUrl = event.queryStringParameters?.jiraUrl;
    const apiToken = event.queryStringParameters?.apiToken;
    const email = event.queryStringParameters?.email;
    const jqlQuery = event.queryStringParameters?.jqlQuery;
    if (!jiraUrl || !apiToken || !email) {
        return (0, response_1.errorResponse)('Se requiere jiraUrl, apiToken y email', 400);
    }
    if (!jqlQuery) {
        return (0, response_1.errorResponse)('Se requiere jqlQuery', 400);
    }
    try {
        const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
        const issues = await fetchJiraIssues(jiraUrl, auth, jqlQuery);
        return (0, response_1.successResponse)({
            issues: issues.map(issue => ({
                id: issue.id,
                key: issue.key,
                summary: issue.fields.summary,
                description: extractPlainText(issue.fields.description),
                issueType: issue.fields.issuetype.name,
                status: issue.fields.status.name,
                priority: issue.fields.priority?.name || 'Medium',
                created: issue.fields.created,
                updated: issue.fields.updated,
                duedate: issue.fields.duedate,
                dominioPrincipal: issue.fields.customfield_10694?.value || 'Sin dominio',
                prioridadNegocio: issue.fields.customfield_11346?.value || 'Media',
                esProyecto: issue.fields.issuetype.name === 'Proyecto' ? 'Si' : 'No'
            })),
            total: issues.length
        });
    }
    catch (error) {
        console.error('Error listando issues de Jira:', error);
        return (0, response_1.errorResponse)(error instanceof Error ? error.message : 'Error conectando con Jira');
    }
}
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
    const { jiraUrl, apiToken, email, projectKeys, issueKeys, jqlQuery, team } = body;
    console.log('[1] Validando campos...');
    if (!jiraUrl || !apiToken || !email || !team) {
        return (0, response_1.errorResponse)('Campos requeridos: jiraUrl, apiToken, email, team', 400);
    }
    try {
        console.log('[2] Preparando autenticación con Jira...');
        const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
        let issues = [];
        console.log('[3] Iniciando fetch de issues desde Jira...');
        if (issueKeys && issueKeys.length > 0) {
            console.log(`[3a] Importando por issueKeys: ${issueKeys.length} issues`);
            const jql = `key IN (${issueKeys.map((k) => `'${k}'`).join(',')})`;
            issues = await fetchJiraIssues(jiraUrl, auth, jql);
        }
        else if (projectKeys && projectKeys.length > 0) {
            console.log(`[3b] Importando por projectKeys: ${projectKeys}`);
            for (const projectKey of projectKeys) {
                const projectIssues = await fetchJiraIssues(jiraUrl, auth, `project = ${projectKey}`);
                issues = issues.concat(projectIssues);
            }
        }
        else if (jqlQuery) {
            console.log(`[3c] Importando con JQL: ${jqlQuery}`);
            issues = await fetchJiraIssues(jiraUrl, auth, jqlQuery);
        }
        else {
            return (0, response_1.errorResponse)('Se requiere issueKeys, projectKeys o jqlQuery', 400);
        }
        console.log(`[4] Encontrados ${issues.length} issues en Jira`);
        const importedProjects = [];
        for (const issue of issues) {
            const existingProject = await prisma.project.findFirst({
                where: { code: issue.key, team }
            });
            if (existingProject) {
                console.log(`Proyecto ${issue.key} ya existe, omitiendo...`);
                continue;
            }
            try {
                const estimatedHours = issue.fields.customfield_10016 ? issue.fields.customfield_10016 * 8 : 8;
                const startDate = new Date(issue.fields.created);
                const project = await prisma.project.create({
                    data: {
                        code: issue.key,
                        type: mapIssueTypeToProjectType(issue.fields.issuetype.name),
                        title: issue.fields.summary,
                        description: extractPlainText(issue.fields.description),
                        domain: mapJiraDomainToLocal(issue.fields.customfield_10694?.value),
                        priority: mapJiraPriorityToLocal(issue.fields.customfield_11346?.value),
                        status: mapJiraStatusToLocal(issue.fields.status.name),
                        startDate: startDate,
                        endDate: issue.fields.duedate ? new Date(issue.fields.duedate) : null,
                        team,
                        jiraProjectKey: issue.key.split('-')[0],
                        jiraUrl: jiraUrl
                    }
                });
                await prisma.assignment.create({
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
                importedProjects.push({
                    project,
                    assignmentsCount: 1
                });
                console.log(`[5] Proyecto ${issue.key} creado exitosamente`);
            }
            catch (error) {
                console.error(`Error creando proyecto ${issue.key}:`, error);
            }
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
    const seenKeys = new Set();
    let lastKey = null;
    const maxResults = 100;
    const timeoutMs = 30000;
    const MAX_PAGES = 20;
    let pageCount = 0;
    console.log('[fetchJiraIssues] Iniciando fetch con paginación por key...');
    while (pageCount < MAX_PAGES) {
        pageCount++;
        const url = `${jiraUrl}/rest/api/3/search/jql`;
        let paginatedJql = `${jql} ORDER BY key DESC`;
        if (lastKey) {
            const baseJql = jql.replace(/\s+ORDER\s+BY\s+.*/i, '').trim();
            paginatedJql = `${baseJql} AND key < '${lastKey}' ORDER BY key DESC`;
        }
        console.log(`[fetchJiraIssues] Página ${pageCount}, lastKey=${lastKey || 'ninguno'}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const params = new URLSearchParams({
                jql: paginatedJql,
                startAt: '0',
                maxResults: maxResults.toString(),
                fields: 'summary,description,issuetype,status,priority,created,updated,duedate,customfield_10016,customfield_10694,customfield_11346'
            });
            const fullUrl = `${url}?${params.toString()}`;
            console.log(`[fetchJiraIssues] JQL: ${paginatedJql.substring(0, 100)}...`);
            const response = await fetch(fullUrl, {
                method: 'GET',
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
            console.log(`[fetchJiraIssues] Recibidos ${issuesReceived} issues`);
            if (issuesReceived === 0) {
                console.log(`[fetchJiraIssues] No hay más issues. Total final: ${allIssues.length} issues únicos`);
                break;
            }
            let newIssuesCount = 0;
            for (const issue of data.issues) {
                if (!seenKeys.has(issue.key)) {
                    seenKeys.add(issue.key);
                    allIssues.push(issue);
                    newIssuesCount++;
                }
            }
            lastKey = data.issues[data.issues.length - 1].key;
            console.log(`[fetchJiraIssues] ${newIssuesCount} nuevos, último key: ${lastKey}, total acumulado: ${allIssues.length}`);
            if (newIssuesCount === 0) {
                console.log(`[fetchJiraIssues] Todos duplicados. Total final: ${allIssues.length} issues únicos`);
                break;
            }
            if (issuesReceived < maxResults) {
                console.log(`[fetchJiraIssues] Última página (${issuesReceived} < ${maxResults}). Total final: ${allIssues.length} issues`);
                break;
            }
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error?.name === 'AbortError') {
                throw new Error(`Timeout conectando con Jira después de ${timeoutMs}ms`);
            }
            throw error;
        }
    }
    console.log(`[fetchJiraIssues] Completado. Total: ${allIssues.length} issues en ${pageCount} páginas`);
    return allIssues;
}
function mapJiraDomainToLocal(domain) {
    if (!domain)
        return 0;
    const domainLower = domain.toLowerCase();
    if (domainLower.includes('ventas') || domainLower.includes('contratación') || domainLower.includes('contratacion'))
        return 1;
    if (domainLower.includes('ciclo de vida') || domainLower.includes('producto'))
        return 2;
    if (domainLower.includes('facturación') || domainLower.includes('facturacion') || domainLower.includes('cobro'))
        return 3;
    if (domainLower.includes('atención') || domainLower.includes('atencion'))
        return 4;
    if (domainLower.includes('operación') || domainLower.includes('operacion') || domainLower.includes('sistemas') || domainLower.includes('ciberseguridad'))
        return 5;
    if (domainLower.includes('datos'))
        return 6;
    if (domainLower.includes('portabilidad'))
        return 7;
    if (domainLower.includes('integración') || domainLower.includes('integracion'))
        return 8;
    return 0;
}
function mapIssueTypeToProjectType(issueType) {
    if (!issueType)
        return 'Evolutivo';
    const type = issueType.toLowerCase();
    if (type === 'proyecto') {
        return 'Proyecto';
    }
    return 'Evolutivo';
}
function mapJiraPriorityToLocal(prioridadNegocio) {
    if (!prioridadNegocio)
        return 'media';
    const priority = prioridadNegocio.toLowerCase();
    if (priority.includes('muy alta'))
        return 'muy-alta';
    if (priority.includes('alta'))
        return 'alta';
    if (priority.includes('media'))
        return 'media';
    if (priority.includes('baja') && !priority.includes('muy'))
        return 'baja';
    if (priority.includes('muy baja'))
        return 'muy-baja';
    return 'media';
}
function mapJiraStatusToLocal(jiraStatus) {
    const status = jiraStatus.toLowerCase();
    if (status.includes('cancelado'))
        return 0;
    if (status.includes('concepto'))
        return 1;
    if (status.includes('desarrollo'))
        return 2;
    if (status.includes('diseño') || status.includes('diseno'))
        return 3;
    if (status.includes('finalizado'))
        return 4;
    if (status.includes('idea'))
        return 5;
    if (status.includes('implantado'))
        return 6;
    if (status.includes('on hold'))
        return 7;
    if (status.includes('viabilidad'))
        return 8;
    return 1;
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