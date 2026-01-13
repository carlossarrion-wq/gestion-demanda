/**
 * Assignment View Component
 * Manages resource assignment with Excel-like interface using Handsontable
 * Shows two separate tables: Assigned tasks and Pending tasks
 */

import { API_CONFIG } from '../config/data.js';
import { showNotification } from '../utils/helpers.js';
import { CreateTaskModal } from './createTaskModal.js';

// Create task modal instance
let createTaskModalInstance = null;

// Handsontable instances
let hotAssignedInstance = null;
let hotPendingInstance = null;

// Current project being edited
let currentProjectCode = null;
let currentProjectId = null;

// All assignments data
let allAssignments = [];

// Resources and domains for dropdowns
let resourcesList = [];
let domainsList = [];

/**
 * Generate date range: -30 days to +120 days from today
 */
function generateDateRange() {
    const dates = [];
    const today = new Date();
    
    // Start 30 days before today
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);
    
    // End 120 days after today
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 120);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        dates.push({
            date: new Date(currentDate),
            key: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`,
            display: `${currentDate.getDate()}/${currentDate.getMonth() + 1}`
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}

/**
 * Open the assignment view for a project
 * @param {number} projectId - The project ID
 * @param {string} projectCode - The project code
 */
export async function openAssignmentView(projectId, projectCode) {
    console.log('Opening assignment view for project:', projectId, projectCode);
    
    currentProjectId = projectId;
    currentProjectCode = projectCode;
    
    try {
        // Get authentication tokens
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            showNotification('No se encontraron credenciales de autenticación', 'error');
            return;
        }
        
        // Load tasks/assignments for this project
        allAssignments = await loadProjectTasks(projectId, awsAccessKey, userTeam);
        
        // Try to load resources and domains for dropdowns (non-blocking)
        try {
            [resourcesList, domainsList] = await Promise.all([
                loadResources(awsAccessKey, userTeam),
                loadDomains(awsAccessKey, userTeam)
            ]);
        } catch (error) {
            console.warn('Could not load resources/domains, will use manual input:', error);
            resourcesList = [];
            domainsList = [];
        }
        
        // Create and show the assignment modal
        createAssignmentModal(projectCode, allAssignments);
        
    } catch (error) {
        console.error('Error opening assignment view:', error);
        showNotification('Error al cargar las tareas del proyecto', 'error');
    }
}

/**
 * Load tasks/assignments for a project
 */
async function loadProjectTasks(projectId, awsAccessKey, userTeam) {
    console.log('Loading tasks for project:', projectId);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/assignments?projectId=${projectId}`, {
        headers: {
            'Authorization': awsAccessKey,
            'x-user-team': userTeam
        }
    });
    
    if (!response.ok) {
        throw new Error('Error al cargar tareas');
    }
    
    const data = await response.json();
    const tasks = data.data?.assignments || data.assignments || [];
    
    console.log('Tasks loaded:', tasks.length);
    return tasks;
}

/**
 * Load resources from API
 */
async function loadResources(awsAccessKey, userTeam) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/resources`, {
        headers: {
            'Authorization': awsAccessKey,
            'x-user-team': userTeam
        }
    });
    
    if (!response.ok) {
        throw new Error('Error al cargar recursos');
    }
    
    const data = await response.json();
    return data.data?.resources || data.resources || [];
}

/**
 * Load domains from API
 */
async function loadDomains(awsAccessKey, userTeam) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/domains`, {
        headers: {
            'Authorization': awsAccessKey,
            'x-user-team': userTeam
        }
    });
    
    if (!response.ok) {
        throw new Error('Error al cargar dominios');
    }
    
    const data = await response.json();
    return data.data?.domains || data.domains || [];
}

/**
 * Create and display the assignment modal with two Handsontable instances
 */
function createAssignmentModal(projectCode, assignments) {
    // Separate assignments into assigned and pending
    const assignedTasks = assignments.filter(a => a.resourceId);
    const pendingTasks = assignments.filter(a => !a.resourceId);
    
    const totalHours = assignments.reduce((sum, a) => sum + (parseFloat(a.hours) || 0), 0);
    const assignedHours = assignedTasks.reduce((sum, a) => sum + (parseFloat(a.hours) || 0), 0);
    const pendingHours = pendingTasks.reduce((sum, a) => sum + (parseFloat(a.hours) || 0), 0);
    
    // Create modal HTML
    const modalHTML = `
        <div id="assignmentModal" class="modal-overlay" style="display: flex;">
            <div class="modal-container" style="max-width: 1400px; width: 95%; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h2>📋 Asignación de Recursos - ${projectCode}</h2>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <button type="button" id="create-task-btn" class="btn btn-primary" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; font-size: 0.9rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Crear Tarea
                        </button>
                        <button class="modal-close" onclick="window.closeAssignmentView()">&times;</button>
                    </div>
                </div>
                <div class="modal-body">
                    <!-- Statistics Bar -->
                    <div style="display: flex; gap: 1.5rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold; color: #2c3e50;">${assignments.length}</div>
                            <div style="font-size: 0.875rem; color: #718096;">Total Tareas</div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold; color: #f39c12;">${pendingTasks.length}</div>
                            <div style="font-size: 0.875rem; color: #718096;">Pendientes (${pendingHours}h)</div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold; color: #27ae60;">${assignedTasks.length}</div>
                            <div style="font-size: 0.875rem; color: #718096;">Asignadas (${assignedHours}h)</div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold; color: #3498db;">${totalHours}</div>
                            <div style="font-size: 0.875rem; color: #718096;">Horas Totales</div>
                        </div>
                    </div>
                    
                    <!-- Info Box -->
                    <div style="margin-bottom: 1.5rem; padding: 1rem; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                        <p style="margin: 0; color: #1565c0;">
                            <strong>ℹ️ Información:</strong> Edita directamente en las tablas para asignar recursos a las tareas. 
                            Los cambios se guardan automáticamente.
                        </p>
                    </div>
                    
                    <!-- Pending Tasks Section -->
                    <div style="margin-bottom: 2rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; padding: 0.75rem; background: #fff3cd; border-left: 4px solid #f39c12; border-radius: 4px;">
                            <span style="font-size: 1.5rem;">⏳</span>
                            <h3 style="margin: 0; color: #856404; font-size: 1.1rem;">Tareas Pendientes de Asignar (${pendingTasks.length})</h3>
                        </div>
                        <div id="pending-table-container" style="height: ${pendingTasks.length > 0 ? '350px' : '100px'}; overflow: auto; border: 1px solid #dee2e6; border-radius: 4px;"></div>
                    </div>
                    
                    <!-- Assigned Tasks Section -->
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; padding: 0.75rem; background: #d4edda; border-left: 4px solid #27ae60; border-radius: 4px;">
                            <span style="font-size: 1.5rem;">✅</span>
                            <h3 style="margin: 0; color: #155724; font-size: 1.1rem;">Tareas Asignadas (${assignedTasks.length})</h3>
                        </div>
                        <div id="assigned-table-container" style="height: ${assignedTasks.length > 0 ? '350px' : '100px'}; overflow: auto; border: 1px solid #dee2e6; border-radius: 4px;"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.closeAssignmentView()">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('assignmentModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add active class to make modal visible
    const modal = document.getElementById('assignmentModal');
    modal.classList.add('active');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Initialize both Handsontable instances
    initializePendingTable(pendingTasks);
    initializeAssignedTable(assignedTasks);
    
    // Attach event listener to "Crear Tarea" button
    const createTaskBtn = document.getElementById('create-task-btn');
    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', () => openTaskModalFromAssignment());
    }
}

/**
 * Open Create Task Modal from assignment view
 */
function openTaskModalFromAssignment() {
    // Initialize create task modal if not already done
    if (!createTaskModalInstance) {
        createTaskModalInstance = new CreateTaskModal();
        createTaskModalInstance.init();
        
        // Set callback to refresh view when task is created
        createTaskModalInstance.setOnTaskCreatedCallback(() => {
            console.log('Task created, refreshing assignment view...');
            // Save current project info before closing
            const projectId = currentProjectId;
            const projectCode = currentProjectCode;
            // Reload the assignment view to show the new task
            closeAssignmentView();
            openAssignmentView(projectId, projectCode);
        });
    }
    
    // Open create task modal with current project
    createTaskModalInstance.open(currentProjectId, currentProjectCode);
}

/**
 * Initialize Handsontable for pending tasks
 */
function initializePendingTable(pendingTasks) {
    const container = document.getElementById('pending-table-container');
    
    if (pendingTasks.length === 0) {
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #718096; font-style: italic;">No hay tareas pendientes de asignar</div>';
        return;
    }
    
    // Month names for display
    const monthNames = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
        5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
        9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    };
    
    // Prepare data for Handsontable
    const data = pendingTasks.map(assignment => ({
        id: assignment.id,
        title: assignment.title || '',
        description: assignment.description || '',
        month: monthNames[assignment.month] || assignment.month,
        year: assignment.year,
        hours: assignment.hours || 0,
        skillName: assignment.skillName || '',
        resourceId: assignment.resourceId || null,
        resourceName: ''
    }));
    
    // Prepare resource options for dropdown
    const resourceOptions = resourcesList.length > 0 
        ? resourcesList.map(r => `${r.id}: ${r.name} - ${r.role || 'Sin rol'}`)
        : [];
    
    // Determine resource column type
    const resourceColumnConfig = resourceOptions.length > 0
        ? { data: 'resourceName', type: 'dropdown', source: resourceOptions, width: 280 }
        : { data: 'resourceName', type: 'text', width: 280 };
    
    hotPendingInstance = new Handsontable(container, {
        data: data,
        colHeaders: [
            'ID', 'Título', 'Descripción', 'Mes', 'Año', 'Horas', 
            'Skill Requerida', 'Asignar Recurso'
        ],
        columns: [
            {
                data: 'id',
                type: 'text',
                readOnly: true,
                width: 80,
                className: 'htCenter'
            },
            {
                data: 'title',
                type: 'text',
                width: 220
            },
            {
                data: 'description',
                type: 'text',
                width: 280
            },
            {
                data: 'month',
                type: 'text',
                readOnly: true,
                width: 100,
                className: 'htCenter'
            },
            {
                data: 'year',
                type: 'numeric',
                readOnly: true,
                width: 80,
                className: 'htCenter'
            },
            {
                data: 'hours',
                type: 'numeric',
                numericFormat: {
                    pattern: '0.00'
                },
                width: 80,
                className: 'htRight'
            },
            {
                data: 'skillName',
                type: 'text',
                width: 180
            },
            resourceColumnConfig
        ],
        rowHeaders: true,
        width: '100%',
        height: 300,
        licenseKey: 'non-commercial-and-evaluation',
        stretchH: 'all',
        autoWrapRow: true,
        autoWrapCol: true,
        manualRowResize: true,
        manualColumnResize: true,
        contextMenu: true,
        filters: true,
        dropdownMenu: true,
        afterChange: function(changes, source) {
            if (source === 'edit' || source === 'CopyPaste.paste' || source === 'Autofill.fill') {
                saveChangesToDatabase(changes, hotPendingInstance, 'pending');
            }
        }
    });
}

/**
 * Initialize Handsontable for assigned tasks
 */
function initializeAssignedTable(assignedTasks) {
    const container = document.getElementById('assigned-table-container');
    
    if (assignedTasks.length === 0) {
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #718096; font-style: italic;">No hay tareas asignadas aún</div>';
        return;
    }
    
    // Month names for display
    const monthNames = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
        5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
        9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    };
    
    // Prepare data for Handsontable
    const data = assignedTasks.map(assignment => ({
        id: assignment.id,
        title: assignment.title || '',
        description: assignment.description || '',
        month: monthNames[assignment.month] || assignment.month,
        year: assignment.year,
        hours: assignment.hours || 0,
        skillName: assignment.skillName || '',
        resourceId: assignment.resourceId || null,
        resourceName: assignment.resourceId ? getResourceName(assignment.resourceId) : ''
    }));
    
    // Prepare resource options for dropdown
    const resourceOptions = resourcesList.length > 0 
        ? resourcesList.map(r => `${r.id}: ${r.name} - ${r.role || 'Sin rol'}`)
        : [];
    
    // Determine resource column type
    const resourceColumnConfig = resourceOptions.length > 0
        ? { data: 'resourceName', type: 'dropdown', source: resourceOptions, width: 280 }
        : { data: 'resourceName', type: 'text', width: 280 };
    
    hotAssignedInstance = new Handsontable(container, {
        data: data,
        colHeaders: [
            'ID', 'Título', 'Descripción', 'Mes', 'Año', 'Horas', 
            'Skill Requerida', 'Recurso Asignado'
        ],
        columns: [
            {
                data: 'id',
                type: 'text',
                readOnly: true,
                width: 80,
                className: 'htCenter'
            },
            {
                data: 'title',
                type: 'text',
                width: 220
            },
            {
                data: 'description',
                type: 'text',
                width: 280
            },
            {
                data: 'month',
                type: 'text',
                readOnly: true,
                width: 100,
                className: 'htCenter'
            },
            {
                data: 'year',
                type: 'numeric',
                readOnly: true,
                width: 80,
                className: 'htCenter'
            },
            {
                data: 'hours',
                type: 'numeric',
                numericFormat: {
                    pattern: '0.00'
                },
                width: 80,
                className: 'htRight'
            },
            {
                data: 'skillName',
                type: 'text',
                width: 180
            },
            resourceColumnConfig
        ],
        rowHeaders: true,
        width: '100%',
        height: 300,
        licenseKey: 'non-commercial-and-evaluation',
        stretchH: 'all',
        autoWrapRow: true,
        autoWrapCol: true,
        manualRowResize: true,
        manualColumnResize: true,
        contextMenu: true,
        filters: true,
        dropdownMenu: true,
        afterChange: function(changes, source) {
            if (source === 'edit' || source === 'CopyPaste.paste' || source === 'Autofill.fill') {
                saveChangesToDatabase(changes, hotAssignedInstance, 'assigned');
            }
        }
    });
}

/**
 * Get resource name by ID
 */
function getResourceName(resourceId) {
    const resource = resourcesList.find(r => r.id === resourceId);
    if (resource) {
        return `${resource.id}: ${resource.name} - ${resource.role || 'Sin rol'}`;
    }
    return '';
}

/**
 * Extract resource ID from dropdown value (format: "ID: Name - Role")
 */
function extractResourceId(resourceString) {
    if (!resourceString) return null;
    const match = resourceString.match(/^([a-f0-9-]+):/i);
    return match ? match[1] : null;
}

/**
 * Save changes from Handsontable to database
 */
async function saveChangesToDatabase(changes, hotInstance, tableType) {
    if (!changes) return;
    
    try {
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            showNotification('No se encontraron credenciales de autenticación', 'error');
            return;
        }
        
        // Process each change
        for (const change of changes) {
            const [row, prop, oldValue, newValue] = change;
            
            if (oldValue === newValue) continue;
            
            const rowData = hotInstance.getDataAtRow(row);
            const assignmentId = rowData[0]; // ID column
            
            // Prepare update payload based on changed field
            let updatePayload = {};
            
            switch (prop) {
                case 'title':
                    updatePayload.title = newValue;
                    break;
                case 'description':
                    updatePayload.description = newValue;
                    break;
                case 'hours':
                    updatePayload.hours = parseFloat(newValue) || 0;
                    break;
                case 'skillName':
                    updatePayload.skillName = newValue;
                    break;
                case 'resourceName':
                    const resourceId = extractResourceId(newValue);
                    updatePayload.resourceId = resourceId;
                    // Update the resourceId column (hidden data)
                    hotInstance.setDataAtRowProp(row, 'resourceId', resourceId);
                    break;
            }
            
            // Send update to API
            if (Object.keys(updatePayload).length > 0) {
                const response = await fetch(`${API_CONFIG.BASE_URL}/assignments/${assignmentId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': awsAccessKey,
                        'x-user-team': userTeam,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatePayload)
                });
                
                if (!response.ok) {
                    throw new Error('Error al actualizar asignación');
                }
                
                console.log('Assignment updated:', assignmentId, updatePayload);
                
                // If a resource was assigned to a pending task, refresh the view
                if (tableType === 'pending' && prop === 'resourceName' && updatePayload.resourceId) {
                    showNotification('Recurso asignado correctamente. Recargando vista...', 'success');
                    setTimeout(() => {
                        closeAssignmentView();
                        openAssignmentView(currentProjectId, currentProjectCode);
                    }, 1000);
                    return;
                }
            }
        }
        
        // Refresh the table to update display
        hotInstance.render();
        
        showNotification('Cambios guardados correctamente', 'success');
        
    } catch (error) {
        console.error('Error saving changes:', error);
        showNotification('Error al guardar los cambios', 'error');
    }
}

/**
 * Close assignment view
 */
export function closeAssignmentView() {
    const modal = document.getElementById('assignmentModal');
    if (modal) {
        // Destroy Handsontable instances
        if (hotPendingInstance) {
            hotPendingInstance.destroy();
            hotPendingInstance = null;
        }
        if (hotAssignedInstance) {
            hotAssignedInstance.destroy();
            hotAssignedInstance = null;
        }
        
        modal.remove();
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    currentProjectCode = null;
    currentProjectId = null;
    allAssignments = [];
    resourcesList = [];
    domainsList = [];
}

// Make functions globally available
window.openAssignmentView = openAssignmentView;
window.closeAssignmentView = closeAssignmentView;
