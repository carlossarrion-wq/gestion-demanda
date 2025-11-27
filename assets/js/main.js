// Main Application Entry Point

import { initializeTabs } from './components/tabs.js';
import { initializeAllCharts } from './components/charts.js';
import { initializeKPIs } from './components/kpi.js';
import { projectMetadata, projectSkillBreakdown, monthKeys } from './config/data.js';
import { 
    getPriorityText, 
    getPriorityClass, 
    getStatusText, 
    getStatusClass,
    getDomainText,
    truncateText,
    formatNumber 
} from './utils/helpers.js';

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing Capacity Planning Application...');
    
    // Initialize components
    initializeTabs();
    initializeKPIs();
    initializeAllCharts();
    
    // Initialize tables
    populateTopProjectsTable();
    
    // Update Matrix KPIs
    updateMatrixKPIs();
    
    // Initialize event listeners
    initializeEventListeners();
    
    console.log('Application initialized successfully!');
}

/**
 * Populate Top 5 Projects table
 */
function populateTopProjectsTable() {
    const tableBody = document.getElementById('top-projects-table-body');
    if (!tableBody) return;
    
    const projectsWithHours = [];
    
    Object.keys(projectSkillBreakdown).forEach(projectId => {
        const project = projectSkillBreakdown[projectId];
        const metadata = projectMetadata[projectId];
        
        if (!metadata) return;
        
        let totalHours = 0;
        Object.keys(project.skills).forEach(skillName => {
            monthKeys.forEach(month => {
                totalHours += project.skills[skillName][month] || 0;
            });
        });
        
        const progressPercentage = totalHours > 1000 ? 0.45 : (totalHours > 500 ? 0.60 : 0.70);
        const hoursIncurred = Math.round(totalHours * progressPercentage);
        
        projectsWithHours.push({
            id: projectId,
            title: metadata.title,
            description: metadata.description,
            domain: metadata.dominiosPrincipales,
            priority: metadata.priority,
            totalHours: totalHours,
            hoursIncurred: hoursIncurred,
            status: metadata.status
        });
    });
    
    projectsWithHours.sort((a, b) => b.totalHours - a.totalHours);
    const top5Projects = projectsWithHours.slice(0, 5);
    
    tableBody.innerHTML = '';
    
    top5Projects.forEach(project => {
        const row = document.createElement('tr');
        
        const priorityClass = getPriorityClass(project.priority);
        const priorityText = getPriorityText(project.priority);
        const statusClass = getStatusClass(project.status);
        const statusText = getStatusText(project.status);
        
        const percentageIncurred = project.totalHours > 0 
            ? ((project.hoursIncurred / project.totalHours) * 100).toFixed(1)
            : '0.0';
        
        row.innerHTML = `
            <td style="text-align: left;"><strong>${project.id}</strong></td>
            <td style="text-align: left;">${project.title}</td>
            <td style="text-align: left;">${project.description}</td>
            <td style="text-align: left;">${project.domain}</td>
            <td style="text-align: center;">
                <span class="priority-badge ${priorityClass}">${priorityText}</span>
            </td>
            <td style="text-align: right;"><strong>${formatNumber(project.totalHours)}</strong></td>
            <td style="text-align: right;">${formatNumber(project.hoursIncurred)}</td>
            <td style="text-align: right;"><strong>${percentageIncurred}%</strong></td>
            <td style="text-align: center;">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Period selector
    const periodSelector = document.getElementById('period-selector');
    if (periodSelector) {
        periodSelector.addEventListener('change', function() {
            console.log(`Período seleccionado: ${this.value}`);
            // Future implementation: update charts based on selected period
        });
    }
    
    // Project search
    const projectSearch = document.getElementById('project-search');
    if (projectSearch) {
        projectSearch.addEventListener('keyup', function() {
            filterProjects(this.value);
        });
    }
    
    // Add resource button
    const addResourceBtn = document.getElementById('add-resource-btn');
    if (addResourceBtn) {
        addResourceBtn.addEventListener('click', function() {
            alert('Funcionalidad de añadir recurso en desarrollo');
        });
    }
    
    // Add project button
    const addProjectBtn = document.getElementById('add-project-btn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', function() {
            alert('Funcionalidad de añadir proyecto en desarrollo');
        });
    }
    
    // Import Jira button
    const importJiraBtn = document.getElementById('import-jira-btn');
    if (importJiraBtn) {
        importJiraBtn.addEventListener('click', function() {
            importFromJira();
        });
    }
    
    // Expand icons for project skills
    document.addEventListener('click', function(e) {
        const expandIcon = e.target.closest('.expand-icon');
        if (expandIcon) {
            const projectId = expandIcon.getAttribute('data-project');
            if (projectId) {
                toggleProjectSkills(projectId);
            }
        }
    });
    
    // Capacity cells
    document.addEventListener('click', function(e) {
        const capacityCell = e.target.closest('.capacity-cell');
        if (capacityCell) {
            const projectId = capacityCell.getAttribute('data-project');
            const month = capacityCell.getAttribute('data-month');
            const resourceId = capacityCell.getAttribute('data-resource');
            
            if (projectId && month) {
                editCapacity(projectId, month);
            } else if (resourceId && month) {
                editResourceCapacity(resourceId, month);
            }
        }
    });
    
    // Action icons
    document.addEventListener('click', function(e) {
        const actionIcon = e.target.closest('.action-icon');
        if (actionIcon) {
            const action = actionIcon.getAttribute('data-action');
            const projectId = actionIcon.getAttribute('data-project');
            
            if (action && projectId) {
                if (action === 'edit') {
                    editProject(projectId);
                } else if (action === 'delete') {
                    deleteProject(projectId);
                } else if (action === 'sync') {
                    syncWithJira(projectId);
                }
            }
        }
    });
}

/**
 * Filter projects in table
 */
function filterProjects(searchTerm) {
    const tableBody = document.getElementById('projects-table-body');
    if (!tableBody) return;
    
    const rows = tableBody.getElementsByTagName('tr');
    const term = searchTerm.toLowerCase();
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        if (cells.length > 0) {
            const id = cells[0].textContent.toLowerCase();
            const title = cells[1].textContent.toLowerCase();
            const description = cells[2].textContent.toLowerCase();
            
            if (id.includes(term) || title.includes(term) || description.includes(term)) {
                found = true;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
}

/**
 * Toggle project skills breakdown
 */
function toggleProjectSkills(projectId) {
    alert(`Expandir/contraer detalles de skills para proyecto: ${projectId}`);
    // Future implementation
}

/**
 * Edit capacity for project/month
 */
function editCapacity(projectId, month) {
    const newValue = prompt(`Editar capacidad para ${projectId} en ${month}:`);
    if (newValue !== null && !isNaN(newValue)) {
        console.log(`Actualizar capacidad: ${projectId} - ${month} = ${newValue}`);
        alert('Capacidad actualizada (funcionalidad en desarrollo)');
    }
}

/**
 * Edit resource capacity
 */
function editResourceCapacity(resourceId, month) {
    alert(`Editar capacidad de ${resourceId} para ${month}`);
}

/**
 * Edit project
 */
function editProject(projectId) {
    alert(`Editar proyecto: ${projectId} (funcionalidad en desarrollo)`);
}

/**
 * Delete project
 */
function deleteProject(projectId) {
    if (confirm(`¿Estás seguro de que quieres eliminar el proyecto ${projectId}?`)) {
        alert('Proyecto eliminado (funcionalidad en desarrollo)');
    }
}

/**
 * Sync with Jira
 */
function syncWithJira(projectId) {
    alert(`Sincronizando proyecto ${projectId} con Jira...`);
    setTimeout(() => {
        alert('Sincronización completada (simulación)');
    }, 1000);
}

/**
 * Import from Jira
 */
function importFromJira() {
    const jiraUrl = prompt('Introduce la URL de tu instancia de Jira:', 'https://tu-empresa.atlassian.net');
    
    if (jiraUrl) {
        const jqlQuery = prompt('Introduce la consulta JQL (opcional):', 'project = "NC" AND status != "Closed"');
        
        if (jqlQuery !== null) {
            alert('Importando proyectos desde Jira... (funcionalidad en desarrollo)');
        }
    }
}

/**
 * Update Matrix KPIs
 */
function updateMatrixKPIs() {
    // Count projects by type
    let totalProjects = 0;
    let evolutivosCount = 0;
    let proyectosCount = 0;
    
    Object.keys(projectMetadata).forEach(projectId => {
        const metadata = projectMetadata[projectId];
        totalProjects++;
        
        if (metadata.tipo === 'Evolutivo') {
            evolutivosCount++;
        } else {
            proyectosCount++;
        }
    });
    
    // Update DOM elements
    const totalElement = document.getElementById('matrix-total-projects');
    const evolutivosElement = document.getElementById('matrix-evolutivos-count');
    const proyectosElement = document.getElementById('matrix-proyectos-count');
    
    if (totalElement) totalElement.textContent = totalProjects;
    if (evolutivosElement) evolutivosElement.textContent = evolutivosCount;
    if (proyectosElement) proyectosElement.textContent = proyectosCount;
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for external use if needed
export { initializeApp };
