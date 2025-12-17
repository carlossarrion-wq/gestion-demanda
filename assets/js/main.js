// Main Application Entry Point

import { initializeTabs } from './components/tabs.js';
import { initializeAllCharts } from './components/charts.js';
import { initializeKPIs } from './components/kpi.js';
import { 
    initProjectModal, 
    openCreateProjectModal, 
    openEditProjectModal, 
    openDeleteModal 
} from './components/projectModal.js';
import { 
    initResourceModal,
    openCreateResourceModal,
    openEditResourceModal,
    openDeleteResourceModal
} from './components/resourceModal.js';
import { openTaskModal } from './components/taskModal.js';
import { openAssignmentView } from './components/assignmentView.js';
import { initializeResourceCapacity } from './components/resourceCapacity.js';
import { projectMetadata, projectSkillBreakdown, monthKeys, API_CONFIG } from './config/data.js';
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
    initProjectModal();
    initResourceModal();
    initializeResourceCapacity();
    
    // Initialize tables
    populateTopProjectsTable();
    
    // Load projects from API
    loadProjectsFromAPI();
    
    // Update Matrix KPIs
    updateMatrixKPIs();
    
    // Initialize event listeners
    initializeEventListeners();
    
    console.log('Application initialized successfully!');
}

/**
 * Load projects from API and populate the table
 */
async function loadProjectsFromAPI() {
    try {
        // Get authentication tokens
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            console.warn('No authentication tokens found, skipping project load');
            console.warn('awsAccessKey:', awsAccessKey ? 'present' : 'missing');
            console.warn('userTeam:', userTeam ? userTeam : 'missing');
            return;
        }
        
        console.log('Loading projects from API...');
        console.log('User team:', userTeam);
        console.log('API URL:', `${API_CONFIG.BASE_URL}/projects`);
        
        // Fetch projects
        const response = await fetch(`${API_CONFIG.BASE_URL}/projects`, {
            headers: {
                'Authorization': awsAccessKey,
                'x-user-team': userTeam
            }
        });
        
        if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
            throw new Error('Error al cargar proyectos');
        }
        
        const data = await response.json();
        console.log('Projects data received:', data);
        
        // Extract projects array from response
        // The API returns: {success: true, data: {projects: [...], count: N}}
        const projects = data.data?.projects || data.projects || [];
        console.log(`Filtered projects for team "${userTeam}":`, projects.length);
        
        // Update table
        updateProjectsTable(projects);
        
        console.log(`Loaded ${projects.length} projects from API`);
        
    } catch (error) {
        console.error('Error loading projects from API:', error);
        // Don't show error notification on page load, just log it
    }
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
            console.log('Add resource button clicked!');
            openCreateResourceModal();
        });
    }
    
    // Add project button
    const addProjectBtn = document.getElementById('add-project-btn');
    console.log('Add project button found:', addProjectBtn);
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', function() {
            console.log('Add project button clicked!');
            console.log('openCreateProjectModal function:', typeof openCreateProjectModal);
            openCreateProjectModal();
        });
        console.log('Event listener attached to add-project-btn');
    } else {
        console.error('Add project button NOT found!');
    }
    
    // Import Jira button
    const importJiraBtn = document.getElementById('import-jira-btn');
    if (importJiraBtn) {
        importJiraBtn.addEventListener('click', function() {
            importFromJira();
        });
    }
    
    // Tab change listener - reload projects when Projects tab is opened
    document.addEventListener('click', function(e) {
        const tabButton = e.target.closest('.tab-button');
        if (tabButton && tabButton.getAttribute('data-tab') === 'projects') {
            console.log('Projects tab opened, reloading projects...');
            loadProjectsFromAPI();
        }
    });
    
    // Expand icons for project skills and resource projects
    document.addEventListener('click', function(e) {
        const expandIcon = e.target.closest('.expand-icon');
        if (expandIcon) {
            const projectId = expandIcon.getAttribute('data-project');
            const resourceId = expandIcon.getAttribute('data-resource');
            
            if (projectId) {
                toggleProjectSkills(projectId);
            } else if (resourceId) {
                toggleResourceProjects(resourceId, expandIcon);
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
                } else if (action === 'tasks') {
                    openTasksModal(projectId);
                } else if (action === 'resources') {
                    assignResources(projectId);
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
 * Open tasks modal for a project
 */
function openTasksModal(projectCode) {
    console.log('Opening tasks modal for project:', projectCode);
    
    // Find project in allProjects array
    const project = allProjects.find(p => p.code === projectCode);
    
    if (!project) {
        console.error(`Project ${projectCode} not found`);
        return;
    }
    
    // Open task modal with project ID and code
    openTaskModal(project.id, project.code);
}

/**
 * Assign resources to a project
 */
function assignResources(projectCode) {
    console.log('Opening assignment view for project:', projectCode);
    
    // Find project in allProjects array
    const project = allProjects.find(p => p.code === projectCode);
    
    if (!project) {
        console.error(`Project ${projectCode} not found`);
        return;
    }
    
    // Open assignment view with project ID and code
    openAssignmentView(project.id, project.code);
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
 * Toggle resource projects visibility
 */
function toggleResourceProjects(resourceId, expandIcon) {
    // Find all skill rows for this resource
    const skillRows = document.querySelectorAll(`.skill-row[data-resource="${resourceId}"]`);
    
    if (skillRows.length === 0) return;
    
    // Check current state
    const isExpanded = skillRows[0].style.display !== 'none';
    
    // Toggle visibility
    skillRows.forEach(row => {
        row.style.display = isExpanded ? 'none' : 'table-row';
    });
    
    // Toggle icon
    expandIcon.textContent = isExpanded ? '+' : '−';
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
function editProject(projectCode) {
    console.log('Edit project called for code:', projectCode);
    
    // Find project in allProjects array (loaded from API)
    const project = allProjects.find(p => p.code === projectCode);
    
    if (!project) {
        console.error(`Project ${projectCode} not found in allProjects`);
        return;
    }
    
    console.log('Project found for editing:', project);
    
    // The project object from API already has the correct structure
    // that openEditProjectModal expects: {id, code, type, title, description, domain, priority, startDate, endDate, status}
    openEditProjectModal(project);
}

/**
 * Delete project
 */
function deleteProject(projectCode) {
    console.log('Delete project called for code:', projectCode);
    
    // Find project in allProjects array (loaded from API)
    const project = allProjects.find(p => p.code === projectCode);
    
    if (!project) {
        console.error(`Project ${projectCode} not found in allProjects`);
        // Fallback: try to find in projectMetadata (for backward compatibility)
        const metadata = projectMetadata[projectCode];
        if (metadata) {
            const fallbackProject = {
                id: metadata.id || projectCode,
                code: projectCode,
                title: metadata.title
            };
            openDeleteModal(fallbackProject);
            return;
        }
        console.error(`Project ${projectCode} not found anywhere`);
        return;
    }
    
    console.log('Project found:', project);
    
    // Create project object for modal with the correct structure
    const projectForModal = {
        id: project.id,
        code: project.code,
        title: project.title
    };
    
    openDeleteModal(projectForModal);
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
    // Count projects by type from real data
    let totalProjects = 0;
    let evolutivosCount = 0;
    let proyectosCount = 0;
    
    // Use window.allProjects array (loaded from API)
    if (window.allProjects && Array.isArray(window.allProjects)) {
        totalProjects = window.allProjects.length;
        
        window.allProjects.forEach(project => {
            if (project.type === 'Evolutivo') {
                evolutivosCount++;
            } else if (project.type === 'Proyecto') {
                proyectosCount++;
            }
        });
    }
    
    // Update Matrix tab elements
    const matrixTotalElement = document.getElementById('matrix-total-projects');
    const matrixEvolutivosElement = document.getElementById('matrix-evolutivos-count');
    const matrixProyectosElement = document.getElementById('matrix-proyectos-count');
    
    if (matrixTotalElement) matrixTotalElement.textContent = totalProjects;
    if (matrixEvolutivosElement) matrixEvolutivosElement.textContent = evolutivosCount;
    if (matrixProyectosElement) matrixProyectosElement.textContent = proyectosCount;
    
    // Update Projects tab elements
    const projectsTotalElement = document.getElementById('projects-total-count');
    const projectsEvolutivosElement = document.getElementById('projects-evolutivos-count');
    const projectsProyectosElement = document.getElementById('projects-proyectos-count');
    
    if (projectsTotalElement) projectsTotalElement.textContent = totalProjects;
    if (projectsEvolutivosElement) projectsEvolutivosElement.textContent = evolutivosCount;
    if (projectsProyectosElement) projectsProyectosElement.textContent = proyectosCount;
    
    console.log('Matrix and Projects KPIs updated:', { totalProjects, evolutivosCount, proyectosCount });
}

// Pagination state
let currentPage = 1;
const projectsPerPage = 10;
let allProjects = [];

/**
 * Update projects table with new data from API
 * Called after CRUD operations to refresh the table
 * @param {Array} projects - Array of project objects from API
 */
function updateProjectsTable(projects) {
    const tableBody = document.getElementById('projects-table-body');
    if (!tableBody) {
        console.warn('Projects table body not found');
        return;
    }
    
    // Store all projects for pagination
    allProjects = projects || [];
    
    // Make allProjects globally available
    window.allProjects = allProjects;
    
    // Update KPIs immediately after loading projects
    updateMatrixKPIs();
    
    // Update charts with real data
    initializeAllCharts();
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Check if there are no projects
    if (!allProjects || allProjects.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="10" style="text-align: center; padding: 2rem; color: #6b7280;">
                No hay proyectos disponibles. Haz clic en "Añadir Proyecto" para crear uno.
            </td>
        `;
        tableBody.appendChild(row);
        console.log('No projects to display');
        
        // Hide pagination if no projects
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(allProjects.length / projectsPerPage);
    const startIndex = (currentPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    const projectsToDisplay = allProjects.slice(startIndex, endIndex);
    
    // Populate with paginated data
    projectsToDisplay.forEach(project => {
        const row = document.createElement('tr');
        
        // Debug logging
        console.log('Project data:', {
            code: project.code,
            domain: project.domain,
            domainType: typeof project.domain,
            status: project.status,
            statusType: typeof project.status,
            type: project.type
        });
        
        const priorityClass = getPriorityClass(project.priority);
        const priorityText = getPriorityText(project.priority);
        const statusClass = getStatusClass(project.status);
        const statusText = getStatusText(project.status);
        const domainText = getDomainText(project.domain);
        
        console.log('Converted values:', {
            code: project.code,
            domainText: domainText,
            statusText: statusText
        });
        
        // Format dates if they exist
        const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString('es-ES') : '-';
        const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString('es-ES') : '-';
        
        row.innerHTML = `
            <td style="text-align: left;"><strong>${project.code}</strong></td>
            <td style="text-align: left;">${project.title}</td>
            <td style="text-align: left;">${truncateText(project.description || '', 50)}</td>
            <td style="text-align: left;">${domainText}</td>
            <td style="text-align: center;">
                <span class="priority-badge ${priorityClass}">${priorityText}</span>
            </td>
            <td style="text-align: center;">${startDate}</td>
            <td style="text-align: center;">${endDate}</td>
            <td style="text-align: center;">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td style="text-align: center;">${project.type || '-'}</td>
            <td style="text-align: center;">
                <span class="action-icon" data-action="edit" data-project="${project.code}" title="Editar Proyecto">✏️</span>
                <span class="action-icon" data-action="tasks" data-project="${project.code}" title="Gestión de Tareas">📋</span>
                <span class="action-icon" data-action="resources" data-project="${project.code}" title="Asignación de Recursos">👤</span>
                <span class="action-icon" data-action="delete" data-project="${project.code}" title="Eliminar Proyecto">🗑️</span>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Render pagination controls
    renderPagination(totalPages);
    
    console.log(`Projects table updated with ${allProjects.length} projects (showing page ${currentPage} of ${totalPages})`);
}

/**
 * Render pagination controls
 * @param {number} totalPages - Total number of pages
 */
function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination-container');
    
    if (!paginationContainer) {
        console.warn('Pagination container not found');
        return;
    }
    
    // Hide pagination if only one page or no projects
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    paginationContainer.innerHTML = '';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-btn';
    prevButton.innerHTML = '&laquo; Anterior';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            updateProjectsTable(allProjects);
        }
    };
    paginationContainer.appendChild(prevButton);
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page button if not visible
    if (startPage > 1) {
        const firstButton = document.createElement('button');
        firstButton.className = 'pagination-btn';
        firstButton.textContent = '1';
        firstButton.onclick = () => {
            currentPage = 1;
            updateProjectsTable(allProjects);
        };
        paginationContainer.appendChild(firstButton);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = 'pagination-btn';
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.textContent = i;
        pageButton.onclick = () => {
            currentPage = i;
            updateProjectsTable(allProjects);
        };
        paginationContainer.appendChild(pageButton);
    }
    
    // Last page button if not visible
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
        
        const lastButton = document.createElement('button');
        lastButton.className = 'pagination-btn';
        lastButton.textContent = totalPages;
        lastButton.onclick = () => {
            currentPage = totalPages;
            updateProjectsTable(allProjects);
        };
        paginationContainer.appendChild(lastButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-btn';
    nextButton.innerHTML = 'Siguiente &raquo;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateProjectsTable(allProjects);
        }
    };
    paginationContainer.appendChild(nextButton);
}

/**
 * Update dashboard (KPIs and charts) after CRUD operations
 * Called from projectModal.js after successful operations
 */
function updateDashboard() {
    console.log('Updating dashboard...');
    
    // Update KPIs
    initializeKPIs();
    
    // Update charts
    initializeAllCharts();
    
    // Update Matrix KPIs
    updateMatrixKPIs();
    
    // Update Top Projects table
    populateTopProjectsTable();
    
    console.log('Dashboard updated successfully');
}

// Make functions globally available for projectModal.js
window.updateProjectsTable = updateProjectsTable;
window.updateDashboard = updateDashboard;
window.loadProjectsFromAPI = loadProjectsFromAPI;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for external use if needed
export { initializeApp, updateProjectsTable, updateDashboard, loadProjectsFromAPI };
