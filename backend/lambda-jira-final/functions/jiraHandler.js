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
        const formattedIssues = issues.map(issue => ({
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
            esProyecto: issue.fields.customfield_10037?.value || 'No',
            prioridadNegocio: issue.fields.customfield_10038?.value || 'Media',
            dominioPrincipal: issue.fields.customfield_10039?.value || '',
        }));
        return (0, response_1.successResponse)({
            issues: formattedIssues,
            total: formattedIssues.length
        });
    }
    catch (error) {
        console.error('Error listando issues de Jira:', error);
        return (0, response_1.errorResponse)(error instanceof Error ? error.message : 'Error conectando con Jira');
    }
}
async function importFromJira(event) {
    if (!event.body) {
        return (0, response_1.errorResponse)('Body requerido', 400);
    }
    const body = JSON.parse(event.body);
    const { jiraUrl, apiToken, email, issueKeys, jqlQuery, team } = body;
    console.log('[1] Validando campos...');
    if (!jiraUrl || !apiToken || !email || !team) {
        return (0, response_1.errorResponse)('Campos requeridos: jiraUrl, apiToken, email, team', 400);
    }
    if (!issueKeys && !jqlQuery) {
        return (0, response_1.errorResponse)('Se requiere issueKeys (array) o jqlQuery (string)', 400);
    }
    try {
        console.log('[2] Preparando autenticación con Jira...');
        const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
        let keysToImport = [];
        if (jqlQuery) {
            console.log('[3] Buscando issues con JQL:', jqlQuery);
            const issues = await fetchJiraIssues(jiraUrl, auth, jqlQuery);
            keysToImport = issues.map(issue => issue.key);
            console.log(`[3] Encontrados ${keysToImport.length} issues para importar`);
        }
        else if (issueKeys && Array.isArray(issueKeys)) {
            keysToImport = issueKeys;
            console.log(`[3] Importando ${keysToImport.length} issues seleccionados...`);
        }
        if (keysToImport.length === 0) {
            return (0, response_1.errorResponse)('No se encontraron issues para importar', 400);
        }
        const importedProjects = [];
        const skippedProjects = [];
        const errors = [];
        for (const issueKey of keysToImport) {
            try {
                const jql = `key = '${issueKey}'`;
                const issues = await fetchJiraIssues(jiraUrl, auth, jql);
                if (issues.length === 0) {
                    console.warn(`Issue ${issueKey} no encontrado en Jira`);
                    errors.push({ issueKey, error: 'No encontrado en Jira' });
                    continue;
                }
                const issue = issues[0];
                if (!issue) {
                    console.warn(`Issue ${issueKey} no tiene datos`);
                    errors.push({ issueKey, error: 'Sin datos' });
                    continue;
                }
                const existingProject = await prisma.project.findFirst({
                    where: { code: issue.key, team }
                });
                if (existingProject) {
                    console.log(`Proyecto ${issue.key} ya existe, omitiendo...`);
                    skippedProjects.push({
                        code: issue.key,
                        title: issue.fields.summary,
                        reason: 'Ya existe'
                    });
                    continue;
                }
                const esProyecto = issue.fields.customfield_10037?.value || 'No';
                const projectType = esProyecto === 'Si' ? 'Proyecto' : 'Evolutivo';
                const prioridadNegocio = issue.fields.customfield_10038?.value || 'Media';
                const priority = mapBusinessPriorityToLocal(prioridadNegocio);
                const dominioPrincipal = issue.fields.customfield_10039?.value || '';
                const domain = mapDomainToId(dominioPrincipal);
                const status = mapJiraStatusToLocal(issue.fields.status.name);
                const project = await prisma.project.create({
                    data: {
                        code: issue.key,
                        title: issue.fields.summary,
                        description: extractPlainText(issue.fields.description),
                        type: projectType,
                        priority: priority,
                        status: status,
                        domain: domain,
                        startDate: new Date(issue.fields.created),
                        endDate: issue.fields.duedate ? new Date(issue.fields.duedate) : null,
                        team: team,
                        jiraProjectKey: issue.key,
                        jiraUrl: jiraUrl
                    }
                });
                importedProjects.push({
                    code: project.code,
                    title: project.title,
                    type: project.type
                });
                console.log(`✓ Proyecto ${issue.key} importado correctamente`);
            }
            catch (error) {
                console.error(`Error importando issue ${issueKey}:`, error);
                errors.push({
                    issueKey,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        }
        return (0, response_1.successResponse)({
            message: `Importados ${importedProjects.length} proyectos con éxito`,
            imported: importedProjects,
            skipped: skippedProjects,
            errors: errors,
            totalIssues: keysToImport.length
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
            where: { id: projectId }
        });
        if (!project) {
            return (0, response_1.errorResponse)('Proyecto no encontrado', 404);
        }
        if (!project.jiraProjectKey) {
            return (0, response_1.errorResponse)('Este proyecto no está vinculado a Jira', 400);
        }
        const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
        const jql = `key = '${project.jiraProjectKey}'`;
        const issues = await fetchJiraIssues(jiraUrl, auth, jql);
        if (issues.length === 0) {
            return (0, response_1.errorResponse)('Issue no encontrado en Jira', 404);
        }
        const issue = issues[0];
        if (!issue) {
            return (0, response_1.errorResponse)('Issue sin datos en Jira', 404);
        }
        const esProyecto = issue.fields.customfield_10037?.value || 'No';
        const projectType = esProyecto === 'Si' ? 'Proyecto' : 'Evolutivo';
        const prioridadNegocio = issue.fields.customfield_10038?.value || 'Media';
        const priority = mapBusinessPriorityToLocal(prioridadNegocio);
        const dominioPrincipal = issue.fields.customfield_10039?.value || '';
        const domain = mapDomainToId(dominioPrincipal);
        const status = mapJiraStatusToLocal(issue.fields.status.name);
        await prisma.project.update({
            where: { id: project.id },
            data: {
                title: issue.fields.summary,
                description: extractPlainText(issue.fields.description),
                type: projectType,
                priority: priority,
                status: status,
                domain: domain,
                endDate: issue.fields.duedate ? new Date(issue.fields.duedate) : null,
                updatedAt: new Date()
            }
        });
        return (0, response_1.successResponse)({
            message: 'Proyecto sincronizado con éxito',
            projectCode: project.code
        });
    }
    catch (error) {
        console.error('Error sincronizando proyecto:', error);
        return (0, response_1.errorResponse)(error instanceof Error ? error.message : 'Error sincronizando proyecto');
    }
}
async function fetchJiraIssues(jiraUrl, auth, jql) {
    const allIssues = [];
    const seenIds = new Set();
    let startAt = 0;
    const maxResults = 100;
    const timeoutMs = 30000;
    const MAX_PAGES = 10;
    let pageCount = 0;
    console.log('[fetchJiraIssues] Iniciando fetch...');
    while (pageCount < MAX_PAGES) {
        pageCount++;
        const fields = 'summary,description,issuetype,status,priority,created,updated,duedate,customfield_10016,customfield_10037,customfield_10038,customfield_10039';
        const url = `${jiraUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}&fields=${fields}`;
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
            console.log(`[fetchJiraIssues] Recibidos ${issuesReceived} issues de ${maxResults} solicitados`);
            if (issuesReceived === 0) {
                console.log(`[fetchJiraIssues] No hay más issues. Total final: ${allIssues.length} issues únicos`);
                break;
            }
            let newIssuesCount = 0;
            for (const issue of data.issues) {
                if (!seenIds.has(issue.id)) {
                    seenIds.add(issue.id);
                    allIssues.push(issue);
                    newIssuesCount++;
                }
            }
            console.log(`[fetchJiraIssues] ${newIssuesCount} issues nuevos (${issuesReceived - newIssuesCount} duplicados filtrados)`);
            if (newIssuesCount === 0) {
                console.log(`[fetchJiraIssues] No hay más issues nuevos. Total final: ${allIssues.length} issues únicos`);
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
function mapBusinessPriorityToLocal(businessPriority) {
    const priority = businessPriority.toLowerCase();
    if (priority.includes('muy alta'))
        return 'Crítica';
    if (priority.includes('alta'))
        return 'Alta';
    if (priority.includes('media'))
        return 'Normal';
    if (priority.includes('baja'))
        return 'Baja';
    if (priority.includes('muy baja'))
        return 'Muy Baja';
    return 'Normal';
}
function mapDomainToId(domain) {
    const domainMap = {
        'Ventas': 0,
        'Contratación y SW': 1,
        'Ciclo de Vida y Producto': 2,
        'Facturación y Cobro': 3,
        'Atención': 4,
        'Operación de Sistemas y Ciberseguridad': 5,
        'Datos': 6,
        'Portabilidad': 7,
        'Integración': 8
    };
    return domainMap[domain] ?? 0;
}
function mapJiraStatusToLocal(jiraStatus) {
    const statusMap = {
        'Cancelado': 4,
        'Concepto': 0,
        'DESARROLLO': 1,
        'Diseño Detallado': 0,
        'Finalizado': 3,
        'Idea': 0,
        'Implantado': 3,
        'On hold': 2,
        'Viabilidad (Tec-Eco)': 0
    };
    return statusMap[jiraStatus] ?? 0;
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