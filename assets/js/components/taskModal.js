/**
 * Task Modal Component
 * Manages task creation and editing with Excel-like interface using Handsontable
 */

import { API_CONFIG } from '../config/data.js';
import { showNotification } from '../utils/helpers.js';

// In-memory storage for project tasks
const projectTasks = {};

// Handsontable instance
let hotInstance = null;

// Current project being edited
let currentProjectCode = null;
let currentProjectId = null;

// Track if data is loading
let isLoading = false;

// Available skills from resources
let availableSkills = [];

/**
 * Initialize task data for a project if it doesn't exist
 */
function initializeProjectTasks(projectCode) {
    if (!projectTasks[projectCode]) {
        projectTasks[projectCode] = [];
    }
}

/**
 * Generate next task ID for a project
 */
function generateTaskId(projectCode) {
    initializeProjectTasks(projectCode);
    const tasks = projectTasks[projectCode];
    const maxNumber = tasks.reduce((max, task) => {
        const match = task.taskId.match(/-T(\d+)$/);
        if (match) {
            const num = parseInt(match[1], 10);
            return num > max ? num : max;
        }
        return max;
    }, 0);
    
    const nextNumber = maxNumber + 1;
    return `${projectCode}-T${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Open task modal for a project
 */
export async function openTaskModal(projectId, projectCode) {
    currentProjectId = projectId;
    currentProjectCode = projectCode;
    
    // Initialize tasks for this project
    initializeProjectTasks(projectCode);
    
    // Load available skills from resources
    await loadAvailableSkills();
    
    // Load existing tasks from database
    await loadTasksFromDatabase(projectId);
    
    // Create modal HTML
    const modalHtml = `
        <div id="taskModal" class="modal-overlay" style="display: flex;">
            <div class="modal-container" style="max-width: 1400px; width: 95%;">
                <div class="modal-header">
                    <h2>📝 Gestión de Tareas - ${projectCode}</h2>
                    <button class="modal-close" onclick="window.closeTaskModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                        <p style="margin: 0; color: #1565c0;">
                            <strong>ℹ️ Información:</strong> Las tareas se guardan automáticamente al completar todos los campos obligatorios: 
                            <strong>Título, Descripción, Skill Requerida y Horas</strong>. El mes y año se asignan automáticamente.
                        </p>
                    </div>
                    <div style="margin-bottom: 1rem; display: flex; gap: 1rem; align-items: center;">
                        <button class="btn btn-primary" id="add-task-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Añadir Tarea
                        </button>
                        <button class="btn btn-danger" id="delete-selected-tasks-btn" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            Eliminar Seleccionadas
                        </button>
                        <span id="task-count" style="margin-left: auto; color: #718096; font-weight: 500;">
                            Total: ${projectTasks[projectCode].length} tareas
                        </span>
                    </div>
                    <div id="task-table-container" style="height: 500px; overflow: auto;"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.closeTaskModal()">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('taskModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add active class to make modal visible
    const modal = document.getElementById('taskModal');
    modal.classList.add('active');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Initialize Handsontable
    initializeHandsontable();
    
    // Add event listeners
    document.getElementById('add-task-btn').addEventListener('click', addNewTask);
    document.getElementById('delete-selected-tasks-btn').addEventListener('click', deleteSelectedTasks);
}

/**
 * Initialize Handsontable with configuration
 */
function initializeHandsontable() {
    const container = document.getElementById('task-table-container');
    
    // Month names for display
    const monthNames = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
        5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
        9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    };
    
    // Prepare data for Handsontable
    const data = projectTasks[currentProjectCode].map(task => ({
        selected: task.selected || false,
        taskId: task.taskId,
        title: task.title,
        description: task.description,
        month: monthNames[task.month] || task.month,
        year: task.year,
        hours: task.hours,
        skillName: task.skillName || '',
        dbId: task.id // Hidden field for database ID
    }));
    
    hotInstance = new Handsontable(container, {
        data: data,
        colHeaders: ['Sel.', 'ID Tarea', 'Título', 'Descripción', 'Skill Requerida', 'Horas'],
        columns: [
            {
                data: 'selected',
                type: 'checkbox',
                width: 50,
                className: 'htCenter'
            },
            {
                data: 'taskId',
                type: 'text',
                readOnly: true,
                width: 150,
                className: 'htCenter'
            },
            {
                data: 'title',
                type: 'text',
                width: 250
            },
            {
                data: 'description',
                type: 'text',
                width: 350
            },
            {
                data: 'skillName',
                type: 'dropdown',
                source: availableSkills,
                width: 200,
                strict: false,
                allowInvalid: true
            },
            {
                data: 'hours',
                type: 'numeric',
                numericFormat: {
                    pattern: '0.00'
                },
                width: 100,
                className: 'htRight'
            }
        ],
        rowHeaders: true,
        width: '100%',
        height: 450,
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
                handleCellChanges(changes);
                updateDeleteButtonState();
            }
        }
    });
}

/**
 * Handle cell changes and save to database
 */
async function handleCellChanges(changes) {
    if (!changes || isLoading) return;
    
    // Month name to number mapping
    const monthNameToNumber = {
        'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
        'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
        'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
    };
    
    for (const change of changes) {
        const [row, prop, oldValue, newValue] = change;
        
        if (oldValue === newValue) continue;
        
        const rowData = hotInstance.getDataAtRow(row);
        const taskIndex = row;
        const task = projectTasks[currentProjectCode][taskIndex];
        
        if (!task) continue;
        
        // Update task in memory
        switch (prop) {
            case 'title':
                task.title = newValue;
                break;
            case 'description':
                task.description = newValue;
                break;
            case 'month':
                task.month = monthNameToNumber[newValue] || task.month;
                break;
            case 'year':
                task.year = parseInt(newValue) || task.year;
                break;
            case 'hours':
                task.hours = parseFloat(newValue) || 0;
                break;
            case 'skillName':
                task.skillName = newValue;
                break;
            case 'selected':
                task.selected = newValue;
                break;
        }
        
        // Save to database if task has all required fields and is not just a checkbox change
        if (prop !== 'selected') {
            // Check if all required fields are filled
            const hasAllRequiredFields = 
                task.title && task.title.trim() !== '' &&
                task.description && task.description.trim() !== '' &&
                task.skillName && task.skillName.trim() !== '' &&
                task.hours > 0;
            
            if (hasAllRequiredFields) {
                if (task.id) {
                    // Update existing task
                    await updateTaskInDatabase(task);
                } else {
                    // Create new task
                    await saveTaskToDatabase(task);
                }
            }
        }
    }
    
    updateTaskCount();
}

/**
 * Add a new task row
 */
function addNewTask() {
    const newTaskId = generateTaskId(currentProjectCode);
    const currentDate = new Date();
    
    const newTask = {
        selected: false,
        taskId: newTaskId,
        title: '',
        description: '',
        skillName: '',
        hours: 0,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        id: null // Will be set after saving to database
    };
    
    // Add to memory
    projectTasks[currentProjectCode].push(newTask);
    
    // Reload Handsontable
    if (hotInstance) {
        initializeHandsontable();
    }
    
    // Update count
    updateTaskCount();
}

/**
 * Delete selected tasks
 */
function deleteSelectedTasks() {
    if (!hotInstance) return;
    
    const data = hotInstance.getData();
    const selectedIndices = [];
    
    // Find selected rows
    data.forEach((row, index) => {
        if (row[0] === true) { // checkbox column
            selectedIndices.push(index);
        }
    });
    
    if (selectedIndices.length === 0) {
        showNotification('Por favor, seleccione al menos una tarea para eliminar.', 'warning');
        return;
    }
    
    // Show confirmation dialog
    const taskWord = selectedIndices.length === 1 ? 'tarea' : 'tareas';
    showConfirmDialog(
        `¿Está seguro de que desea eliminar ${selectedIndices.length} ${taskWord}?`,
        async () => {
            // Delete from database first (reverse order to maintain indices)
            for (let i = selectedIndices.length - 1; i >= 0; i--) {
                const index = selectedIndices[i];
                const task = projectTasks[currentProjectCode][index];
                if (task && task.id) {
                    await deleteTaskFromDatabase(task.id);
                }
            }
            
            // Remove from memory (reverse order to maintain indices)
            selectedIndices.reverse().forEach(index => {
                projectTasks[currentProjectCode].splice(index, 1);
            });
            
            // Reload Handsontable
            initializeHandsontable();
            
            // Update count and button state
            updateTaskCount();
            updateDeleteButtonState();
            
            showNotification(`${selectedIndices.length} ${taskWord} eliminada(s) correctamente`, 'success');
        }
    );
}

/**
 * Update task count display
 */
function updateTaskCount() {
    const countElement = document.getElementById('task-count');
    if (countElement) {
        const totalHours = projectTasks[currentProjectCode].reduce((sum, task) => sum + (parseFloat(task.hours) || 0), 0);
        countElement.textContent = `Total: ${projectTasks[currentProjectCode].length} tareas (${totalHours}h)`;
    }
}

/**
 * Update delete button state based on selected tasks
 */
function updateDeleteButtonState() {
    const deleteBtn = document.getElementById('delete-selected-tasks-btn');
    if (!deleteBtn || !hotInstance) return;
    
    const data = hotInstance.getData();
    const hasSelected = data.some(row => row[0] === true);
    
    deleteBtn.disabled = !hasSelected;
}

/**
 * Show custom confirmation dialog
 */
function showConfirmDialog(message, onConfirm) {
    const confirmHtml = `
        <div id="taskConfirmDialog" class="modal-overlay active" style="display: flex; z-index: 10001;">
            <div class="modal-container" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Confirmar acción</h3>
                </div>
                <div class="modal-body">
                    <p style="margin: 1rem 0;">${message}</p>
                </div>
                <div class="modal-footer" style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" id="confirm-cancel-btn">Cancelar</button>
                    <button type="button" class="btn btn-danger" id="confirm-ok-btn">Eliminar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', confirmHtml);
    
    const dialog = document.getElementById('taskConfirmDialog');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    const okBtn = document.getElementById('confirm-ok-btn');
    
    const closeDialog = () => {
        dialog.remove();
    };
    
    cancelBtn.addEventListener('click', closeDialog);
    okBtn.addEventListener('click', () => {
        closeDialog();
        onConfirm();
    });
}

/**
 * Close task modal
 */
export function closeTaskModal() {
    const modal = document.getElementById('taskModal');
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
}

/**
 * Get tasks for a specific project
 */
export function getProjectTasks(projectCode) {
    return projectTasks[projectCode] || [];
}

/**
 * Get all tasks (for debugging)
 */
export function getAllTasks() {
    return projectTasks;
}

/**
 * Load available skills from resources
 */
async function loadAvailableSkills() {
    try {
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            console.warn('No credentials found for loading skills');
            availableSkills = [];
            return;
        }
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/resources?active=true`, {
            method: 'GET',
            headers: {
                'Authorization': awsAccessKey,
                'x-user-team': userTeam
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const resources = data.data?.resources || data.resources || [];
        
        // Extract unique skills from all resources
        const skillsSet = new Set();
        resources.forEach(resource => {
            if (resource.resourceSkills && Array.isArray(resource.resourceSkills)) {
                resource.resourceSkills.forEach(rs => {
                    if (rs.skillName) {
                        skillsSet.add(rs.skillName);
                    }
                });
            }
        });
        
        availableSkills = Array.from(skillsSet).sort();
        console.log('Available skills loaded:', availableSkills);
    } catch (error) {
        console.error('Error loading available skills:', error);
        availableSkills = [];
    }
}

/**
 * Load tasks from database for a project
 */
async function loadTasksFromDatabase(projectId) {
    isLoading = true;
    
    try {
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            showNotification('No se encontraron credenciales de autenticación', 'error');
            isLoading = false;
            return;
        }
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/assignments?projectId=${projectId}`, {
            method: 'GET',
            headers: {
                'Authorization': awsAccessKey,
                'x-user-team': userTeam
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const assignments = data.data?.assignments || data.assignments || [];
        
        // Transform assignments to task format
        projectTasks[currentProjectCode] = assignments.map((assignment, index) => ({
            id: assignment.id,
            taskId: `${currentProjectCode}-T${String(index + 1).padStart(3, '0')}`,
            title: assignment.title,
            description: assignment.description || '',
            skillName: assignment.skillName || '',
            hours: parseFloat(assignment.hours) || 0,
            month: assignment.month,
            year: assignment.year,
            selected: false
        }));
        
        console.log('Tasks loaded from database:', projectTasks[currentProjectCode].length);
    } catch (error) {
        console.error('Error loading tasks from database:', error);
        showNotification('Error al cargar las tareas desde la base de datos', 'error');
    } finally {
        isLoading = false;
    }
}

/**
 * Save a new task to database
 */
async function saveTaskToDatabase(task) {
    try {
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            showNotification('No se encontraron credenciales de autenticación', 'error');
            return;
        }
        
        // Ensure month and year are valid integers
        const month = parseInt(task.month, 10);
        const year = parseInt(task.year, 10);
        
        if (isNaN(month) || month < 1 || month > 12) {
            showNotification('Mes inválido. Debe estar entre 1 y 12.', 'error');
            return;
        }
        
        if (isNaN(year) || year < 2000 || year > 2100) {
            showNotification('Año inválido. Debe estar entre 2000 y 2100.', 'error');
            return;
        }
        
        const hours = parseFloat(task.hours);
        if (isNaN(hours) || hours <= 0) {
            showNotification('Las horas deben ser mayores que 0.', 'error');
            return;
        }
        
        const payload = {
            projectId: currentProjectId,
            title: task.title.trim(),
            description: task.description ? task.description.trim() : null,
            skillName: task.skillName ? task.skillName.trim() : null,
            resourceId: null, // Tasks start unassigned
            month: month,
            year: year,
            hours: hours
        };
        
        console.log('Saving task with payload:', JSON.stringify(payload, null, 2));
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/assignments`, {
            method: 'POST',
            headers: {
                'Authorization': awsAccessKey,
                'x-user-team': userTeam,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            const errorMsg = result.message || result.error || 'Error desconocido';
            console.error('Backend error response:', result);
            throw new Error(errorMsg);
        }
        
        const savedAssignment = result.data?.assignment || result.assignment || result.data || result;
        
        // Update task with database ID
        task.id = savedAssignment.id;
        
        console.log('Task saved to database:', savedAssignment);
    } catch (error) {
        console.error('Error saving task to database:', error);
        showNotification(`Error al guardar la tarea: ${error.message}`, 'error');
    }
}

/**
 * Update an existing task in database
 */
async function updateTaskInDatabase(task) {
    if (!task.id) return;
    
    try {
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            showNotification('No se encontraron credenciales de autenticación', 'error');
            return;
        }
        
        // Ensure month and year are valid integers
        const month = parseInt(task.month, 10);
        const year = parseInt(task.year, 10);
        const hours = parseFloat(task.hours);
        
        if (isNaN(month) || month < 1 || month > 12) {
            showNotification('Mes inválido. Debe estar entre 1 y 12.', 'error');
            return;
        }
        
        if (isNaN(year) || year < 2000 || year > 2100) {
            showNotification('Año inválido. Debe estar entre 2000 y 2100.', 'error');
            return;
        }
        
        if (isNaN(hours) || hours <= 0) {
            showNotification('Las horas deben ser mayores que 0.', 'error');
            return;
        }
        
        const payload = {
            title: task.title.trim(),
            description: task.description ? task.description.trim() : null,
            skillName: task.skillName ? task.skillName.trim() : null,
            month: month,
            year: year,
            hours: hours
        };
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/assignments/${task.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': awsAccessKey,
                'x-user-team': userTeam,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        console.log('Task updated in database:', task.id);
    } catch (error) {
        console.error('Error updating task in database:', error);
        showNotification(`Error al actualizar la tarea: ${error.message}`, 'error');
    }
}

/**
 * Delete a task from database
 */
async function deleteTaskFromDatabase(taskId) {
    if (!taskId) return;
    
    try {
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            showNotification('No se encontraron credenciales de autenticación', 'error');
            return;
        }
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/assignments/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': awsAccessKey,
                'x-user-team': userTeam
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('Task deleted from database:', taskId);
    } catch (error) {
        console.error('Error deleting task from database:', error);
        showNotification(`Error al eliminar la tarea: ${error.message}`, 'error');
    }
}

// Make functions available globally for onclick handlers
window.closeTaskModal = closeTaskModal;
window.openTaskModal = openTaskModal;
