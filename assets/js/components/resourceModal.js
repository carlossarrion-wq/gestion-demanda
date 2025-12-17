/**
 * Resource Modal Component
 * Handles CRUD operations for resources with team-based access control
 */

import { API_CONFIG } from '../config/data.js';
import { reloadCapacityData } from './resourceCapacity.js';

// Modal state
let currentResourceId = null;
let isEditMode = false;

// Available skills list
const AVAILABLE_SKILLS = [
    'Project Management',
    'Análisis',
    'Diseño',
    'Construcción',
    'QA',
    'General'
];

/**
 * Initialize modal event listeners
 */
export function initResourceModal() {
    console.log('Initializing resource modal...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initResourceModalElements);
    } else {
        initResourceModalElements();
    }
}

/**
 * Initialize modal elements after DOM is ready
 */
function initResourceModalElements() {
    console.log('Initializing resource modal elements...');
    
    // Modal close handlers
    const resourceModal = document.getElementById('resourceModal');
    const deleteResourceModal = document.getElementById('deleteResourceModal');
    
    console.log('Resource modal element:', resourceModal);
    console.log('Delete resource modal element:', deleteResourceModal);
    
    if (!resourceModal) {
        console.error('Resource modal not found in DOM!');
        return;
    }
    
    if (!deleteResourceModal) {
        console.error('Delete resource modal not found in DOM!');
        return;
    }
    
    // Close on overlay click
    resourceModal?.addEventListener('click', (e) => {
        if (e.target === resourceModal) {
            closeResourceModal();
        }
    });
    
    deleteResourceModal?.addEventListener('click', (e) => {
        if (e.target === deleteResourceModal) {
            closeDeleteResourceModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (resourceModal?.classList.contains('active')) {
                closeResourceModal();
            }
            if (deleteResourceModal?.classList.contains('active')) {
                closeDeleteResourceModal();
            }
        }
    });
    
    // Form validation on input
    const form = document.getElementById('resourceForm');
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
    
    // Add event listener for "Añadir Recurso" button
    const addResourceBtn = document.getElementById('add-resource-btn');
    if (addResourceBtn) {
        addResourceBtn.addEventListener('click', openCreateResourceModal);
        console.log('Add resource button listener attached');
    } else {
        console.error('Add resource button not found in DOM!');
    }
}

/**
 * Open modal for creating a new resource
 */
export function openCreateResourceModal() {
    console.log('openCreateResourceModal called!');
    
    isEditMode = false;
    currentResourceId = null;
    
    const modal = document.getElementById('resourceModal');
    const form = document.getElementById('resourceForm');
    const title = document.getElementById('resourceModalTitle');
    
    console.log('Modal element:', modal);
    console.log('Form element:', form);
    console.log('Title element:', title);
    
    // Reset form
    form.reset();
    clearFormErrors();
    
    // Set default capacity
    document.getElementById('resourceDefaultCapacity').value = '160';
    
    // Set user's team as default (hidden field)
    const userTeam = sessionStorage.getItem('user_team');
    if (userTeam) {
        document.getElementById('resourceTeam').value = userTeam;
    } else {
        console.error('No user team found in sessionStorage!');
    }
    
    // Update title
    title.textContent = 'Añadir Nuevo Recurso';
    
    // Populate skills checkboxes
    populateSkillsCheckboxes([]);
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Open modal for editing an existing resource
 * @param {Object} resource - Resource data
 */
export function openEditResourceModal(resource) {
    isEditMode = true;
    currentResourceId = resource.id;
    
    const modal = document.getElementById('resourceModal');
    const form = document.getElementById('resourceForm');
    const title = document.getElementById('resourceModalTitle');
    
    // Clear errors
    clearFormErrors();
    
    // Populate form with resource data
    document.getElementById('resourceName').value = resource.name;
    document.getElementById('resourceEmail').value = resource.email || '';
    document.getElementById('resourceTeam').value = resource.team;
    document.getElementById('resourceDefaultCapacity').value = resource.defaultCapacity || 160;
    
    // Populate skills checkboxes with resource's skills
    const resourceSkills = resource.resourceSkills?.map(rs => rs.skillName) || [];
    populateSkillsCheckboxes(resourceSkills);
    
    // Update title
    title.textContent = 'Editar Recurso';
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Populate skills checkboxes
 * @param {Array} selectedSkills - Array of selected skill names
 */
function populateSkillsCheckboxes(selectedSkills) {
    const container = document.getElementById('resourceSkillsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    AVAILABLE_SKILLS.forEach(skill => {
        const isChecked = selectedSkills.includes(skill);
        
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'skill-checkbox-item';
        checkboxDiv.innerHTML = `
            <label class="skill-checkbox-label">
                <input type="checkbox" name="skills" value="${skill}" ${isChecked ? 'checked' : ''}>
                <span>${skill}</span>
            </label>
        `;
        
        container.appendChild(checkboxDiv);
    });
}

/**
 * Close resource modal
 */
export function closeResourceModal() {
    const modal = document.getElementById('resourceModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset after animation
    setTimeout(() => {
        document.getElementById('resourceForm').reset();
        clearFormErrors();
        currentResourceId = null;
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
        case 'resourceName':
            if (!value) {
                isValid = false;
                errorMessage = 'El nombre es obligatorio';
            } else if (value.length < 3) {
                isValid = false;
                errorMessage = 'El nombre debe tener al menos 3 caracteres';
            }
            break;
            
        case 'resourceEmail':
            if (value && !isValidEmail(value)) {
                isValid = false;
                errorMessage = 'El email no es válido';
            }
            break;
            
            
        case 'resourceDefaultCapacity':
            if (!value) {
                isValid = false;
                errorMessage = 'La capacidad por defecto es obligatoria';
            } else if (isNaN(value) || parseInt(value) <= 0) {
                isValid = false;
                errorMessage = 'La capacidad debe ser un número positivo';
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
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate entire form
 * @returns {boolean} - True if all fields are valid
 */
function validateForm() {
    const form = document.getElementById('resourceForm');
    const fields = form.querySelectorAll('input[required], select[required]');
    
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
    const form = document.getElementById('resourceForm');
    form.querySelectorAll('.error').forEach(field => {
        field.classList.remove('error');
    });
    form.querySelectorAll('.form-error').forEach(error => {
        error.classList.remove('active');
        error.textContent = '';
    });
}

/**
 * Save resource (create or update)
 */
export async function saveResource() {
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Get form data
    const emailValue = document.getElementById('resourceEmail').value.trim();
    
    // Get authentication tokens and user team from sessionStorage
    const awsAccessKey = sessionStorage.getItem('aws_access_key');
    const userTeam = sessionStorage.getItem('user_team');
    
    if (!awsAccessKey || !userTeam) {
        showNotification('No se encontró información de autenticación', 'error');
        return;
    }
    
    // Get selected skills
    const selectedSkills = Array.from(
        document.querySelectorAll('input[name="skills"]:checked')
    ).map(checkbox => checkbox.value);
    
    const formData = {
        name: document.getElementById('resourceName').value.trim(),
        email: emailValue === '' ? null : emailValue,
        team: document.getElementById('resourceTeam').value,
        defaultCapacity: parseInt(document.getElementById('resourceDefaultCapacity').value, 10),
        active: true
    };

    console.log('Form data to be sent:', formData);
    
    try {
        // Prepare request
        const url = isEditMode 
            ? `${API_CONFIG.BASE_URL}/resources/${currentResourceId}`
            : `${API_CONFIG.BASE_URL}/resources`;
        
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
            const errorMessage = errorData.error?.message || errorData.message || 'Error al guardar el recurso';
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        const resourceId = result.data?.id || result.id;
        
        // If we have skills selected, update them
        if (selectedSkills.length > 0 && resourceId) {
            await updateResourceSkills(resourceId, selectedSkills, awsAccessKey, userTeam);
        }
        
        // Close modal
        closeResourceModal();
        
        // Refresh capacity data
        reloadCapacityData();
        
        // Show success message
        showNotification(
            isEditMode ? 'Recurso actualizado correctamente' : 'Recurso creado correctamente',
            'success'
        );
        
    } catch (error) {
        console.error('Error saving resource:', error);
        showNotification(error.message || 'Error al guardar el recurso', 'error');
    }
}

/**
 * Update resource skills
 * @param {string} resourceId - Resource ID
 * @param {Array} skills - Array of skill names
 * @param {string} awsAccessKey - AWS access key
 * @param {string} userTeam - User team
 */
async function updateResourceSkills(resourceId, skills, awsAccessKey, userTeam) {
    // Note: This would require a separate endpoint to manage resource skills
    // For now, we'll log this as a TODO
    console.log('TODO: Update resource skills:', { resourceId, skills });
    // This functionality would need to be implemented in the backend
}

/**
 * Open delete confirmation modal
 * @param {Object} resource - Resource to delete
 */
export function openDeleteResourceModal(resource) {
    currentResourceId = resource.id;
    
    const modal = document.getElementById('deleteResourceModal');
    const resourceName = document.getElementById('deleteResourceName');
    
    resourceName.textContent = resource.name;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close delete confirmation modal
 */
export function closeDeleteResourceModal() {
    const modal = document.getElementById('deleteResourceModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    setTimeout(() => {
        currentResourceId = null;
    }, 300);
}

/**
 * Confirm and execute resource deletion (mark as inactive)
 */
export async function confirmDeleteResource() {
    if (!currentResourceId) {
        return;
    }
    
    try {
        // Get authentication tokens
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            throw new Error('No se encontró información de autenticación');
        }
        
        // Mark resource as inactive (soft delete)
        const response = await fetch(`${API_CONFIG.BASE_URL}/resources/${currentResourceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': awsAccessKey,
                'x-user-team': userTeam
            },
            body: JSON.stringify({ active: false })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar el recurso');
        }
        
        // Close modal
        closeDeleteResourceModal();
        
        // Refresh capacity data
        reloadCapacityData();
        
        // Show success message
        showNotification('Recurso marcado como inactivo correctamente', 'success');
        
    } catch (error) {
        console.error('Error deleting resource:', error);
        showNotification(error.message || 'Error al eliminar el recurso', 'error');
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
window.closeResourceModal = closeResourceModal;
window.saveResource = saveResource;
window.closeDeleteResourceModal = closeDeleteResourceModal;
window.confirmDeleteResource = confirmDeleteResource;
window.openCreateResourceModal = openCreateResourceModal;
window.openEditResourceModal = openEditResourceModal;
window.openDeleteResourceModal = openDeleteResourceModal;
