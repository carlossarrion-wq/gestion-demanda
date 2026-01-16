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

// Handsontable instance
let hotInstance = null;

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
        
        // Try to load resources for dropdowns (non-blocking)
        try {
            resourcesList = await loadResources(awsAccessKey, userTeam);
            // NOTE: domainsList commented out - not currently used but kept for future use
            // If needed in the future, uncomment the following lines:
            // [resourcesList, domainsList] = await Promise.all([
            //     loadResources(awsAccessKey, userTeam),
            //     loadDomains(awsAccessKey, userTeam)
            // ]);
        } catch (error) {
            console.warn('Could not load resources, will use manual input:', error);
            resourcesList = [];
            // domainsList = [];  // Uncomment if domains loading is re-enabled
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
 * Create and display the assignment modal with single unified Handsontable
 */
function createAssignmentModal(projectCode, assignments) {
    // Separate assignments into assigned and pending for statistics
    const assignedTasks = assignments.filter(a => a.resourceId);
    const pendingTasks = assignments.filter(a => !a.resourceId);
    
    const totalHours = assignments.reduce((sum, a) => sum + (parseFloat(a.hours) || 0), 0);
    const assignedHours = assignedTasks.reduce((sum, a) => sum + (parseFloat(a.hours) || 0), 0);
    const pendingHours = pendingTasks.reduce((sum, a) => sum + (parseFloat(a.hours) || 0), 0);
    
    // Create modal HTML with single table
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
                            <div style="font-size: 0.875rem; color: #718096;">Pendientes (${pendingHours.toFixed(1)}h)</div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold; color: #27ae60;">${assignedTasks.length}</div>
                            <div style="font-size: 0.875rem; color: #718096;">Asignadas (${assignedHours.toFixed(1)}h)</div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold; color: #3498db;">${totalHours.toFixed(1)}</div>
                            <div style="font-size: 0.875rem; color: #718096;">Horas Totales</div>
                        </div>
                    </div>
                    
                    <!-- Info Box -->
                    <div style="margin-bottom: 1.5rem; padding: 1rem; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                        <p style="margin: 0; color: #1565c0;">
                            <strong>ℹ️ Información:</strong> Las tareas <span style="background: #fff3cd; padding: 2px 6px; border-radius: 3px;">pendientes</span> están resaltadas en amarillo. 
                            Solo puedes asignar recursos en esta vista. 
                            Para editar otros campos, usa el modal de "Gestión de Tareas" (segundo botón 📋 en la tabla de proyectos).
                        </p>
                    </div>
                    
                    <!-- Unified Tasks Table -->
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; padding: 0.75rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 4px;">
                            <span style="font-size: 1.5rem;">📋</span>
                            <h3 style="margin: 0; color: white; font-size: 1.1rem;">Todas las Tareas (${assignments.length})</h3>
                        </div>
                        <div id="tasks-table-container" style="height: ${assignments.length > 0 ? '600px' : '150px'}; overflow: auto; border: 1px solid #dee2e6; border-radius: 4px;"></div>
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
    
    // Initialize unified Handsontable
    initializeUnifiedTable(assignments);
    
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
 * Initialize unified Handsontable for all tasks
 */
function initializeUnifiedTable(assignments) {
    const container = document.getElementById('tasks-table-container');
    
    if (assignments.length === 0) {
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #718096; font-style: italic;">No hay tareas en este proyecto</div>';
        return;
    }
    
    // Month names for display
    const monthNames = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
        5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
        9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    };
    
    // Group assignments by task-resource pair and sum hours
    const groupedMap = new Map();
    
    assignments.forEach(assignment => {
        // Create a unique key for grouping: title + resourceId (or 'pending' if no resource)
        const key = `${assignment.title}|${assignment.resourceId || 'pending'}`;
        
        if (!groupedMap.has(key)) {
            // First time seeing this task-resource pair
            groupedMap.set(key, {
                id: assignment.id, // Keep first assignment ID
                allIds: [], // Track ALL assignment IDs in this group
                title: assignment.title || '',
                description: assignment.description || '',
                month: monthNames[assignment.month] || assignment.month, // Display name
                monthNumber: assignment.month, // Store original number for updates
                year: assignment.year,
                hours: 0, // Will accumulate
                skillName: assignment.skillName || '',
                resourceId: assignment.resourceId || null,
                resourceName: assignment.resourceId ? getResourceName(assignment.resourceId) : '',
                isPending: !assignment.resourceId,
                isGrouped: false // Will be set to true if more than one assignment
            });
        }
        
        // Add this assignment ID to the group
        const group = groupedMap.get(key);
        group.allIds.push(assignment.id);
        
        // Accumulate hours for this group
        group.hours += parseFloat(assignment.hours) || 0;
        
        // Mark as grouped if we have more than one assignment
        if (group.allIds.length > 1) {
            group.isGrouped = true;
        }
    });
    
    // Convert map to array for Handsontable and initialize checkbox field
    const data = Array.from(groupedMap.values()).map(item => ({
        ...item,
        selected: false  // Initialize checkbox field
    }));
    
    // Prepare resource options for dropdown (only names for cleaner display)
    const resourceOptions = resourcesList.length > 0 
        ? resourcesList.map(r => r.name)
        : [];
    
    // Determine resource column type (read-only)
    const resourceColumnConfig = {
        data: 'resourceName',
        type: 'text',
        readOnly: true,
        width: 280
    };
    
    hotInstance = new Handsontable(container, {
        data: data,
        colHeaders: [
            'ID', 'Título', 'Descripción', 'Mes', 'Año', 'Horas', 
            'Recurso Asignado'
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
                readOnly: true,
                width: 220
            },
            {
                data: 'description',
                type: 'text',
                readOnly: true,
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
                readOnly: true,
                numericFormat: {
                    pattern: '0.00'
                },
                width: 80,
                className: 'htRight'
            },
            resourceColumnConfig  // Resource column is editable
        ],
        rowHeaders: true,
        width: '100%',
        height: 550,
        licenseKey: 'non-commercial-and-evaluation',
        stretchH: 'all',
        autoWrapRow: true,
        autoWrapCol: true,
        manualRowResize: true,
        manualColumnResize: true,
        contextMenu: true,
        filters: true,
        dropdownMenu: true,
        // Highlight pending tasks with yellow background
        cells: function(row, col) {
            const cellProperties = {};
            const rowData = this.instance.getSourceDataAtRow(row);
            
            if (rowData && rowData.isPending) {
                cellProperties.className = 'htCenter pending-task';
                cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    td.style.backgroundColor = '#fff3cd';
                    td.style.fontWeight = '500';
                };
            }
            
            return cellProperties;
        },
        afterChange: function(changes, source) {
            if (source === 'edit' || source === 'CopyPaste.paste' || source === 'Autofill.fill') {
                saveChangesToDatabase(changes, hotInstance);
            }
        }
    });
}

/**
 * Get resource name by ID (returns only the name)
 */
function getResourceName(resourceId) {
    const resource = resourcesList.find(r => r.id === resourceId);
    return resource ? resource.name : '';
}

/**
 * Extract resource ID from resource name
 */
function extractResourceId(resourceName) {
    if (!resourceName) return null;
    // Find resource by name
    const resource = resourcesList.find(r => r.name === resourceName);
    return resource ? resource.id : null;
}

/**
 * Save changes from Handsontable to database
 */
async function saveChangesToDatabase(changes, tableInstance) {
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
            
            // Get the full row data including allIds
            const sourceData = tableInstance.getSourceDataAtRow(row);
            const allIds = sourceData.allIds || [sourceData.id];
            
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
                    // Note: hours are aggregated, so we can't update individual records
                    showNotification('Las horas son un total agregado. Usa el modal de Gestión de Tareas para editar horas individuales.', 'warning');
                    return;
                case 'skillName':
                    updatePayload.skillName = newValue;
                    break;
                case 'resourceName':
                    const resourceId = extractResourceId(newValue);
                    updatePayload.resourceId = resourceId;
                    
                    // CRITICAL: Preserve month and year from source data
                    // When updating only resourceId, we must keep month/year intact
                    if (sourceData.monthNumber) {
                        updatePayload.month = sourceData.monthNumber;  // Use numeric value
                    }
                    if (sourceData.year) {
                        updatePayload.year = sourceData.year;
                    }
                    
                    // Update the resourceId column (hidden data)
                    tableInstance.setDataAtRowProp(row, 'resourceId', resourceId);
                    // Update isPending flag
                    tableInstance.setDataAtRowProp(row, 'isPending', !resourceId);
                    break;
            }
            
            // Send update to ALL assignments in this group
            if (Object.keys(updatePayload).length > 0) {
                let successCount = 0;
                let errorCount = 0;
                
                for (const assignmentId of allIds) {
                    try {
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
                            errorCount++;
                            console.error(`Error updating assignment ${assignmentId}`);
                        } else {
                            successCount++;
                        }
                    } catch (err) {
                        errorCount++;
                        console.error(`Error updating assignment ${assignmentId}:`, err);
                    }
                }
                
                console.log(`Updated ${successCount} assignments (${errorCount} errors)`);
                
                if (errorCount > 0) {
                    showNotification(`Actualizado parcialmente: ${successCount} OK, ${errorCount} con error`, 'warning');
                }
            }
        }
        
        // Refresh the table to update display and styling
        tableInstance.render();
        
        showNotification('Cambios guardados correctamente', 'success');
        
    } catch (error) {
        console.error('Error saving changes:', error);
        showNotification('Error al guardar los cambios', 'error');
    }
}

/**
 * Delete a task (all assignments in the group)
 */
async function deleteTask(assignmentIds, tableInstance) {
    // Confirm deletion
    const confirmed = confirm(
        `¿Estás seguro de que deseas eliminar esta tarea?\n\n` +
        `Se eliminarán ${assignmentIds.length} registro(s) de asignación.\n` +
        `Esta acción no se puede deshacer.`
    );
    
    if (!confirmed) return;
    
    try {
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            showNotification('No se encontraron credenciales de autenticación', 'error');
            return;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        // Delete all assignments in this group
        for (const assignmentId of assignmentIds) {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}/assignments/${assignmentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': awsAccessKey,
                        'x-user-team': userTeam
                    }
                });
                
                if (!response.ok) {
                    errorCount++;
                    console.error(`Error deleting assignment ${assignmentId}`);
                } else {
                    successCount++;
                }
            } catch (err) {
                errorCount++;
                console.error(`Error deleting assignment ${assignmentId}:`, err);
            }
        }
        
        console.log(`Deleted ${successCount} assignments (${errorCount} errors)`);
        
        if (successCount > 0) {
            showNotification(`Tarea eliminada correctamente (${successCount} registros)`, 'success');
            
            // Refresh the assignment view
            const projectId = currentProjectId;
            const projectCode = currentProjectCode;
            closeAssignmentView();
            await openAssignmentView(projectId, projectCode);
        } else {
            showNotification('No se pudo eliminar la tarea', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error al eliminar la tarea', 'error');
    }
}

/**
 * Close assignment view
 */
export function closeAssignmentView() {
    const modal = document.getElementById('assignmentModal');
    if (modal) {
        // Destroy Handsontable instance
        if (hotInstance) {
            hotInstance.destroy();
            hotInstance = null;
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
