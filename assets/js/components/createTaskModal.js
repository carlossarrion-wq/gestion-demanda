/**
 * Create Task Modal Component
 * Simple form to create a new task/assignment for a project
 */

import { API_CONFIG } from '../config/data.js';
import { showNotification } from '../utils/helpers.js';

export class CreateTaskModal {
    constructor() {
        this.modalElement = null;
        this.projectId = null;
        this.projectCode = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the modal
     */
    init() {
        if (this.isInitialized) return;
        
        this.createModalHTML();
        this.attachEventListeners();
        this.isInitialized = true;
    }

    /**
     * Create modal HTML structure
     */
    createModalHTML() {
        const modalHTML = `
            <div id="create-task-modal" class="modal-overlay">
                <div class="modal-container" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 24px; height: 24px; display: inline-block; margin-right: 8px;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span>Crear Nueva Tarea</span>
                        </h2>
                        <button class="modal-close" id="close-create-task-modal" title="Cerrar">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="create-task-form">
                            <div class="form-group">
                                <label for="task-title">Título de la Tarea *</label>
                                <input type="text" id="task-title" name="title" class="form-control" required placeholder="Ej: Desarrollo de módulo de reportes">
                            </div>
                            
                            <div class="form-group">
                                <label for="task-description">Descripción</label>
                                <textarea id="task-description" name="description" class="form-control" rows="3" placeholder="Descripción detallada de la tarea..."></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="task-month">Mes *</label>
                                    <select id="task-month" name="month" class="form-control" required>
                                        <option value="">Seleccionar mes</option>
                                        <option value="1">Enero</option>
                                        <option value="2">Febrero</option>
                                        <option value="3">Marzo</option>
                                        <option value="4">Abril</option>
                                        <option value="5">Mayo</option>
                                        <option value="6">Junio</option>
                                        <option value="7">Julio</option>
                                        <option value="8">Agosto</option>
                                        <option value="9">Septiembre</option>
                                        <option value="10">Octubre</option>
                                        <option value="11">Noviembre</option>
                                        <option value="12">Diciembre</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="task-year">Año *</label>
                                    <input type="number" id="task-year" name="year" class="form-control" required min="2024" max="2030" value="2026">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="task-hours">Horas Estimadas *</label>
                                    <input type="number" id="task-hours" name="hours" class="form-control" required min="0" step="0.5" placeholder="Ej: 40">
                                </div>
                                
                                <div class="form-group">
                                    <label for="task-skill">Skill Requerida</label>
                                    <input type="text" id="task-skill" name="skillName" class="form-control" placeholder="Ej: Frontend, Backend, QA...">
                                </div>
                            </div>
                            
                            <div class="form-info">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                </svg>
                                <span>La tarea se creará sin asignar a ningún recurso. Podrás asignarla posteriormente desde la tabla.</span>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-icon btn-cancel" id="cancel-create-task">Cancelar</button>
                        <button type="button" class="btn-icon btn-save" id="save-create-task">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            Crear Tarea
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById('create-task-modal');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close modal
        document.getElementById('close-create-task-modal').addEventListener('click', () => this.close());
        document.getElementById('cancel-create-task').addEventListener('click', () => this.close());
        
        // Close on overlay click
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.close();
            }
        });

        // Save task
        document.getElementById('save-create-task').addEventListener('click', () => this.save());

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalElement.classList.contains('active')) {
                this.close();
            }
        });
        
        // Set current month and year by default
        const now = new Date();
        document.getElementById('task-month').value = now.getMonth() + 1;
        document.getElementById('task-year').value = now.getFullYear();
    }

    /**
     * Open modal for a specific project
     */
    open(projectId, projectCode) {
        this.projectId = projectId;
        this.projectCode = projectCode;

        // Reset form
        document.getElementById('create-task-form').reset();
        
        // Set current month and year
        const now = new Date();
        document.getElementById('task-month').value = now.getMonth() + 1;
        document.getElementById('task-year').value = now.getFullYear();

        // Show modal
        this.modalElement.classList.add('active');
    }

    /**
     * Close modal
     */
    close() {
        this.modalElement.classList.remove('active');
    }

    /**
     * Save task to database
     */
    async save() {
        const form = document.getElementById('create-task-form');
        
        // Validate form
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Get form data
        const formData = new FormData(form);
        const month = parseInt(formData.get('month'));
        const year = parseInt(formData.get('year'));
        const hours = parseFloat(formData.get('hours'));
        
        // Additional validation for month, year, and hours
        if (!month || isNaN(month) || month < 1 || month > 12) {
            showNotification('Por favor selecciona un mes válido (1-12)', 'error');
            return;
        }
        
        if (!year || isNaN(year) || year < 2024 || year > 2030) {
            showNotification('Por favor selecciona un año válido (2024-2030)', 'error');
            return;
        }
        
        if (!hours || isNaN(hours) || hours <= 0) {
            showNotification('Las horas deben ser un número mayor que 0', 'error');
            return;
        }
        
        const taskData = {
            projectId: this.projectId,
            title: formData.get('title'),
            description: formData.get('description') || '',
            month: month,
            year: year,
            hours: hours,
            skillName: formData.get('skillName') || '',
            resourceId: null // Initially unassigned
        };

        try {
            // Get authentication tokens
            const awsAccessKey = sessionStorage.getItem('aws_access_key');
            const userTeam = sessionStorage.getItem('user_team');
            
            if (!awsAccessKey || !userTeam) {
                showNotification('No se encontraron credenciales de autenticación', 'error');
                return;
            }

            console.log('Creating task:', taskData);

            // Send POST request to API
            const response = await fetch(`${API_CONFIG.BASE_URL}/assignments`, {
                method: 'POST',
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear la tarea');
            }

            const result = await response.json();
            console.log('Task created successfully:', result);

            showNotification('✓ Tarea creada exitosamente', 'success');
            
            // Close modal
            this.close();
            
            // Trigger callback if provided
            if (this.onTaskCreated) {
                this.onTaskCreated(result.data);
            }

        } catch (error) {
            console.error('Error creating task:', error);
            showNotification(`Error al crear la tarea: ${error.message}`, 'error');
        }
    }

    /**
     * Set callback for when task is created
     */
    setOnTaskCreatedCallback(callback) {
        this.onTaskCreated = callback;
    }
}
