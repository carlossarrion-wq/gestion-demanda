/**
 * Project Modal Component
 * Handles CRUD operations for projects with team-based access control
 */

import { API_CONFIG } from '../config/data.js';
import { initializeDropdowns, populateDomainDropdown, populateStatusDropdown } from '../utils/dropdownLoader.js';

// Modal state
let currentProjectId = null;
let isEditMode = false;

/**
 * Initialize modal event listeners
 */
export function initProjectModal() {
    console.log('Initializing project modal...');
    
    // Modal close handlers
    const projectModal = document.getElementById('projectModal');
    const deleteModal = document.getElementById('deleteModal');
    
    console.log('Project modal element:', projectModal);
    console.log('Delete modal element:', deleteModal);
    
    // Close on overlay click
    projectModal?.addEventListener('click', (e) => {
        if (e.target === projectModal) {
            closeProjectModal();
        }
    });
    
    deleteModal?.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (projectModal?.classList.contains('active')) {
                closeProjectModal();
            }
            if (deleteModal?.classList.contains('active')) {
                closeDeleteModal();
            }
        }
    });
    
    // Form validation on input
    const form = document.getElementById('projectForm');
    if (form) {
        form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', () => validateField(field));
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    validateField(field);
                }
            });
        });
    }
}

/**
 * Open modal for creating a new project
 */
export function openCreateProjectModal() {
    console.log('openCreateProjectModal called!');
    
    isEditMode = false;
    currentProjectId = null;
    
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const title = document.getElementById('modalTitle');
    
    console.log('Modal element:', modal);
    console.log('Form element:', form);
    console.log('Title element:', title);
    
    // Reset form
    form.reset();
    clearFormErrors();
    
    // Update title
    title.textContent = 'Crear Nuevo Proyecto';
    
    // Load dropdowns (synchronous now)
    initializeDropdowns();
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Open modal for editing an existing project
 * @param {Object} project - Project data
 */
export function openEditProjectModal(project) {
    isEditMode = true;
    currentProjectId = project.id;
    
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const title = document.getElementById('modalTitle');
    
    // Clear errors
    clearFormErrors();
    
    // Load dropdowns with selected values (synchronous now)
    populateDomainDropdown('projectDomain', project.domain);
    populateStatusDropdown('projectStatus', project.status);
    
    // Populate form with project data
    document.getElementById('projectId').value = project.id;
    document.getElementById('projectCode').value = project.code;
    document.getElementById('projectType').value = project.type || '';
    document.getElementById('projectTitle').value = project.title;
    document.getElementById('projectDescription').value = project.description;
    document.getElementById('projectDomain').value = project.domain;
    document.getElementById('projectPriority').value = project.priority;
    document.getElementById('projectStartDate').value = project.startDate;
    document.getElementById('projectEndDate').value = project.endDate;
    document.getElementById('projectStatus').value = project.status;
    
    // Update title
    title.textContent = 'Editar Proyecto';
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close project modal
 */
export function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset after animation
    setTimeout(() => {
        document.getElementById('projectForm').reset();
        clearFormErrors();
        currentProjectId = null;
        isEditMode = false;
    }, 300);
}

/**
 * Validate a single form field
 * @param {HTMLElement} field - Form field to validate
 * @returns {boolean} - True if valid
 */
function validateField(field) {
    const fieldId = field.id;
    const value = field.value.trim();
    const errorElement = document.getElementById(`${fieldId}Error`);
    
    let isValid = true;
    let errorMessage = '';
    
    switch (fieldId) {
        case 'projectCode':
            if (!value) {
                isValid = false;
                errorMessage = 'El código es obligatorio';
            } else if (value.length > 50) {
                isValid = false;
                errorMessage = 'El código debe tener máximo 50 caracteres';
            }
            break;
            
        case 'projectTitle':
            if (!value) {
                isValid = false;
                errorMessage = 'El título es obligatorio';
            } else if (value.length < 5) {
                isValid = false;
                errorMessage = 'El título debe tener al menos 5 caracteres';
            }
            break;
            
        case 'projectDescription':
            if (!value) {
                isValid = false;
                errorMessage = 'La descripción es obligatoria';
            } else if (value.length < 10) {
                isValid = false;
                errorMessage = 'La descripción debe tener al menos 10 caracteres';
            }
            break;
            
        case 'projectDomain':
            if (!value) {
                isValid = false;
                errorMessage = 'El dominio es obligatorio';
            }
            break;
            
        case 'projectPriority':
            if (!value) {
                isValid = false;
                errorMessage = 'La prioridad es obligatoria';
            }
            break;
            
        case 'projectStartDate':
            // OPCIONAL - Solo validar formato si se proporciona
            if (value) {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    isValid = false;
                    errorMessage = 'Formato de fecha inválido';
                }
            }
            break;
            
        case 'projectEndDate':
            // OPCIONAL - Solo validar si se proporciona
            if (value) {
                const endDate = new Date(value);
                if (isNaN(endDate.getTime())) {
                    isValid = false;
                    errorMessage = 'Formato de fecha inválido';
                } else {
                    const startDate = document.getElementById('projectStartDate').value;
                    if (startDate && endDate < new Date(startDate)) {
                        isValid = false;
                        errorMessage = 'La fecha de fin debe ser posterior a la fecha de inicio';
                    }
                }
            }
            break;
            
        case 'projectStatus':
            if (!value) {
                isValid = false;
                errorMessage = 'El estado es obligatorio';
            }
            break;
    }
    
    // Update UI
    if (isValid) {
        field.classList.remove('error');
        if (errorElement) {
            errorElement.classList.remove('active');
            errorElement.textContent = '';
        }
    } else {
        field.classList.add('error');
        if (errorElement) {
            errorElement.classList.add('active');
            errorElement.textContent = errorMessage;
        }
    }
    
    return isValid;
}

/**
 * Validate entire form
 * @returns {boolean} - True if all fields are valid
 */
function validateForm() {
    const form = document.getElementById('projectForm');
    const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    let isValid = true;
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Clear all form errors
 */
function clearFormErrors() {
    const form = document.getElementById('projectForm');
    form.querySelectorAll('.error').forEach(field => {
        field.classList.remove('error');
    });
    form.querySelectorAll('.form-error').forEach(error => {
        error.classList.remove('active');
        error.textContent = '';
    });
}

/**
 * Save project (create or update)
 */
export async function saveProject() {
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Get form data
    const typeValue = document.getElementById('projectType').value.trim();
    const startDateValue = document.getElementById('projectStartDate').value.trim();
    const endDateValue = document.getElementById('projectEndDate').value.trim();
    
    // Get authentication tokens and user team from sessionStorage
    const awsAccessKey = sessionStorage.getItem('aws_access_key');
    const userTeam = sessionStorage.getItem('user_team');
    
    if (!awsAccessKey || !userTeam) {
        showNotification('No se encontró información de autenticación', 'error');
        return;
    }
    
    const formData = {
        code: document.getElementById('projectCode').value.trim(),
        type: typeValue === '' ? null : typeValue, // Explicitly set to null if empty
        title: document.getElementById('projectTitle').value.trim(),
        description: document.getElementById('projectDescription').value.trim(),
        domain: parseInt(document.getElementById('projectDomain').value, 10),  // Numeric ID
        priority: document.getElementById('projectPriority').value, // String value
        startDate: startDateValue === '' ? null : startDateValue,
        endDate: endDateValue === '' ? null : endDateValue,
        status: parseInt(document.getElementById('projectStatus').value, 10),   // Numeric ID
        team: userTeam  // Add team from sessionStorage
    };

    console.log('Form data to be sent:', formData);
    
    try {
        // Prepare request
        const url = isEditMode 
            ? `${API_CONFIG.BASE_URL}/projects/${currentProjectId}`
            : `${API_CONFIG.BASE_URL}/projects`;
        
        const method = isEditMode ? 'PUT' : 'POST';
        
        // Make API request
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': awsAccessKey,
                'x-user-team': userTeam
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            // Extract specific error message from API response structure
            const errorMessage = errorData.error?.message || errorData.message || 'Error al guardar el proyecto';
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        // Close modal
        closeProjectModal();
        
        // Refresh projects table
        await refreshProjectsTable();
        
        // Show success message
        showNotification(
            isEditMode ? 'Proyecto actualizado correctamente' : 'Proyecto creado correctamente',
            'success'
        );
        
    } catch (error) {
        console.error('Error saving project:', error);
        showNotification(error.message || 'Error al guardar el proyecto', 'error');
    }
}

/**
 * Open delete confirmation modal
 * @param {Object} project - Project to delete
 */
export function openDeleteModal(project) {
    currentProjectId = project.id;
    
    const modal = document.getElementById('deleteModal');
    const projectName = document.getElementById('deleteProjectName');
    
    projectName.textContent = project.title;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close delete confirmation modal
 */
export function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    setTimeout(() => {
        currentProjectId = null;
    }, 300);
}

/**
 * Confirm and execute project deletion
 */
export async function confirmDelete() {
    if (!currentProjectId) {
        return;
    }
    
    try {
        // Get authentication tokens
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            throw new Error('No se encontró información de autenticación');
        }
        
        // Make API request
        const response = await fetch(`${API_CONFIG.BASE_URL}/projects/${currentProjectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': awsAccessKey,
                'x-user-team': userTeam
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar el proyecto');
        }
        
        // Close modal
        closeDeleteModal();
        
        // Refresh projects table
        await refreshProjectsTable();
        
        // Show success message
        showNotification('Proyecto eliminado correctamente', 'success');
        
    } catch (error) {
        console.error('Error deleting project:', error);
        showNotification(error.message || 'Error al eliminar el proyecto', 'error');
    }
}

/**
 * Refresh projects table after CRUD operations
 */
async function refreshProjectsTable() {
    try {
        // Get authentication tokens
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            throw new Error('No se encontró información de autenticación');
        }
        
        // Fetch projects
        const response = await fetch(`${API_CONFIG.BASE_URL}/projects`, {
            headers: {
                'Authorization': awsAccessKey,
                'x-user-team': userTeam
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar proyectos');
        }
        
        const data = await response.json();
        console.log('Projects data received after CRUD operation:', data);
        
        // Extract projects array from response
        // The API returns: {success: true, data: {projects: [...], count: N}}
        const projects = data.data?.projects || data.projects || [];
        console.log(`Refreshed ${projects.length} projects after CRUD operation`);
        
        // Update table (this function should be imported from the main module)
        if (window.updateProjectsTable) {
            window.updateProjectsTable(projects);
        }
        
        // Update KPIs and charts
        if (window.updateDashboard) {
            window.updateDashboard();
        }
        
    } catch (error) {
        console.error('Error refreshing projects:', error);
    }
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, warning)
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Make functions globally available for HTML onclick handlers
window.closeProjectModal = closeProjectModal;
window.saveProject = saveProject;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.openCreateProjectModal = openCreateProjectModal;
window.openEditProjectModal = openEditProjectModal;
window.openDeleteModal = openDeleteModal;
