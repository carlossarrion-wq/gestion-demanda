/**
 * Resource Capacity Modal Component with AG Grid
 * Manages resource availability, absences and committed hours
 */

import { API_CONFIG } from '../config/data.js';

export class ResourceCapacityModal {
    constructor() {
        this.gridApi = null;
        this.resourceId = null;
        this.resourceData = null;
        this.modalElement = null;
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
            <div id="capacity-modal" class="modal-overlay">
                <div class="modal-container" style="max-width: 95vw;">
                    <div class="modal-header">
                        <h2>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 24px; height: 24px; display: inline-block; margin-right: 8px;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <span id="capacity-modal-title">Gestión de Capacidad</span>
                        </h2>
                        <button class="modal-close" id="close-capacity-modal" title="Cerrar">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <!-- Resource Information Section -->
                        <div id="resource-info-section" class="resource-info-card">
                            <h3>Información del Recurso</h3>
                            <div class="resource-info-grid">
                                <div class="form-group">
                                    <label>Nombre Completo:</label>
                                    <input type="text" id="resource-name" class="form-input" />
                                </div>
                                <div class="form-group">
                                    <label>Email:</label>
                                    <input type="email" id="resource-email" class="form-input" />
                                </div>
                                <div class="form-group">
                                    <label>Equipo:</label>
                                    <input type="text" id="resource-team" class="form-input" readonly />
                                </div>
                                <div class="form-group">
                                    <label>Skills:</label>
                                    <input type="text" id="resource-skills" class="form-input" />
                                </div>
                            </div>
                            <button class="btn-icon btn-save" id="save-resource-info" style="margin-top: 12px;">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Guardar Información
                            </button>
                        </div>

                        <!-- Capacity Calendar Section -->
                        <div style="margin-top: 24px;">
                            <h3 style="margin-bottom: 12px; color: #319795;">Calendario de Capacidad (365 días)</h3>
                            <div id="capacity-grid" class="ag-grid-container ag-theme-alpine" style="height: 300px;"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <div class="modal-footer-left">
                            <div class="info-text">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                </svg>
                                Validación: Ausencias + Comprometidas ≤ Disponibles
                            </div>
                        </div>
                        <div class="modal-footer-right">
                            <button class="btn-icon btn-cancel" id="cancel-capacity-modal">Cancelar</button>
                            <button class="btn-icon btn-save" id="save-capacity-modal">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Guardar Capacidad
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById('capacity-modal');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close modal
        document.getElementById('close-capacity-modal').addEventListener('click', () => this.close());
        document.getElementById('cancel-capacity-modal').addEventListener('click', () => this.close());
        
        // Close on overlay click
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.close();
            }
        });

        // Save resource info
        document.getElementById('save-resource-info').addEventListener('click', () => this.saveResourceInfo());

        // Save capacity
        document.getElementById('save-capacity-modal').addEventListener('click', () => this.saveCapacity());

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalElement.classList.contains('active')) {
                this.close();
            }
        });
    }

    /**
     * Load resource data from API
     */
    async loadResourceData(resourceId) {
        try {
            const awsAccessKey = sessionStorage.getItem('aws_access_key');
            const userTeam = sessionStorage.getItem('user_team');
            
            if (!awsAccessKey || !userTeam) {
                throw new Error('No authentication tokens found');
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/resources/${resourceId}`, {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            });
            
            if (!response.ok) {
                throw new Error('Error loading resource data');
            }
            
            const data = await response.json();
            return data.data?.resource || data.resource || null;
            
        } catch (error) {
            console.error('Error loading resource data:', error);
            return null;
        }
    }

    /**
     * Load committed hours and absences from assignments (daily assignments)
     * Separates absences (from ABSENCES project) from regular committed hours
     */
    async loadCommittedHoursAndAbsences(resourceId) {
        try {
            const awsAccessKey = sessionStorage.getItem('aws_access_key');
            const userTeam = sessionStorage.getItem('user_team');
            
            if (!awsAccessKey || !userTeam) {
                throw new Error('No authentication tokens found');
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/assignments?resourceId=${resourceId}`, {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            });
            
            if (!response.ok) {
                throw new Error('Error loading committed hours');
            }
            
            const data = await response.json();
            const assignments = data.data?.assignments || data.assignments || [];
            
            console.log('Assignments loaded for resource:', resourceId, 'Count:', assignments.length);
            
            // Group hours by date - separate absences from regular committed hours
            const committedHours = {};
            const absenceHours = {};
            
            assignments.forEach(assignment => {
                let dateStr;
                
                // Check if assignment has date field (new daily system)
                if (assignment.date) {
                    // Convert date to YYYY-MM-DD format
                    const date = new Date(assignment.date);
                    dateStr = date.toISOString().split('T')[0];
                } 
                // Legacy: month/year system - distribute to first day of month
                else if (assignment.month && assignment.year) {
                    const date = new Date(assignment.year, assignment.month - 1, 1);
                    dateStr = date.toISOString().split('T')[0];
                }
                
                if (dateStr) {
                    const hours = parseFloat(assignment.hours) || 0;
                    
                    // Check if this is an absence (from ABSENCES project)
                    const projectCode = assignment.project?.code || '';
                    if (projectCode === 'ABSENCES') {
                        if (!absenceHours[dateStr]) {
                            absenceHours[dateStr] = 0;
                        }
                        absenceHours[dateStr] += hours;
                    } else {
                        // Regular committed hours
                        if (!committedHours[dateStr]) {
                            committedHours[dateStr] = 0;
                        }
                        committedHours[dateStr] += hours;
                    }
                }
            });
            
            console.log('Committed hours by date:', Object.keys(committedHours).length, 'days');
            console.log('Absence hours by date:', Object.keys(absenceHours).length, 'days');
            
            return { committedHours, absenceHours };
            
        } catch (error) {
            console.error('Error loading committed hours:', error);
            return { committedHours: {}, absenceHours: {} };
        }
    }

    /**
     * Open modal for a specific resource
     */
    async open(resourceId, resourceName) {
        this.resourceId = resourceId;
        
        console.log('Opening capacity modal for resource:', resourceId, resourceName);

        // Update modal title
        document.getElementById('capacity-modal-title').textContent = 
            `Gestión de Capacidad - ${resourceName}`;

        // Load resource data
        this.resourceData = await this.loadResourceData(resourceId);
        
        if (this.resourceData) {
            this.populateResourceInfo();
        }

        // Load committed hours and absences
        const { committedHours, absenceHours } = await this.loadCommittedHoursAndAbsences(resourceId);

        // Initialize AG Grid
        this.initializeGrid(committedHours, absenceHours);

        // Show modal
        this.modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Populate resource information fields
     */
    populateResourceInfo() {
        if (!this.resourceData) return;

        document.getElementById('resource-name').value = this.resourceData.name || '';
        document.getElementById('resource-email').value = this.resourceData.email || '';
        document.getElementById('resource-team').value = this.resourceData.team || '';
        document.getElementById('resource-skills').value = 
            this.resourceData.skills?.join(', ') || '';
    }

    /**
     * Close modal
     */
    close() {
        this.modalElement.classList.remove('active');
        document.body.style.overflow = '';
        
        // Destroy grid
        if (this.gridApi) {
            this.gridApi.destroy();
            this.gridApi = null;
        }
    }

    /**
     * Generate date columns: 365 days from today
     */
    generateDateColumns() {
        const dateColumns = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 365 days from today
        for (let i = 0; i < 365; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            
            const dateStr = currentDate.toISOString().split('T')[0];
            const day = currentDate.getDate();
            const month = currentDate.getMonth() + 1;
            const dateHeader = `${day}/${month}`;
            
            // Determine if it's weekend or today
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const isToday = i === 0;
            
            dateColumns.push({
                headerName: dateHeader,
                field: dateStr,
                editable: params => {
                    // Only 'Horas disponibles' and 'Ausencias/Vacaciones' are editable
                    return params.data.rowType === 'disponibles' || params.data.rowType === 'ausencias';
                },
                width: 70,
                minWidth: 70,
                filter: false,
                sortable: false,
                suppressMenu: true,
                cellEditor: 'agNumberCellEditor',
                cellEditorParams: {
                    min: 0,
                    max: 24,
                    precision: 1
                },
                valueFormatter: params => params.value ? `${params.value}h` : '0h',
                cellStyle: params => {
                    const style = { 
                        textAlign: 'center',
                        fontWeight: params.value ? '600' : 'normal',
                        fontSize: '0.85em'
                    };
                    
                    // Different colors for each row type
                    if (params.data.rowType === 'disponibles') {
                        style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                        style.color = '#065f46';
                    } else if (params.data.rowType === 'ausencias') {
                        style.backgroundColor = 'rgba(251, 146, 60, 0.1)';
                        style.color = '#c2410c';
                    } else if (params.data.rowType === 'comprometidas') {
                        style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                        style.color = '#1e40af';
                    }
                    
                    // Highlight today
                    if (isToday) {
                        style.borderLeft = '2px solid #f59e0b';
                        style.borderRight = '2px solid #f59e0b';
                    }
                    // Highlight weekends
                    else if (isWeekend) {
                        style.opacity = '0.6';
                    }
                    
                    return style;
                },
                headerClass: isToday ? 'today-header' : (isWeekend ? 'weekend-header' : '')
            });
        }
        
        return dateColumns;
    }

    /**
     * Initialize AG Grid
     */
    initializeGrid(committedHours = {}, absenceHours = {}) {
        const gridDiv = document.getElementById('capacity-grid');

        // Base column definition
        const columnDefs = [
            {
                headerName: 'Tipo',
                field: 'tipo',
                editable: false,
                width: 250,
                minWidth: 200,
                pinned: 'left',
                cellStyle: params => {
                    const style = { fontWeight: '600' };
                    if (params.data.rowType === 'disponibles') {
                        style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                        style.color = '#065f46';
                    } else if (params.data.rowType === 'ausencias') {
                        style.backgroundColor = 'rgba(251, 146, 60, 0.2)';
                        style.color = '#c2410c';
                    } else if (params.data.rowType === 'comprometidas') {
                        style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                        style.color = '#1e40af';
                    }
                    return style;
                }
            }
        ];

        // Add date columns
        const dateColumns = this.generateDateColumns();
        columnDefs.push(...dateColumns);

        // Prepare row data
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const disponiblesRow = { tipo: 'Horas disponibles', rowType: 'disponibles' };
        const ausenciasRow = { tipo: 'Ausencias/Vacaciones', rowType: 'ausencias' };
        const comprometidasRow = { tipo: 'Horas comprometidas', rowType: 'comprometidas' };

        // Initialize all dates
        for (let i = 0; i < 365; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            // Default 8h for available hours
            disponiblesRow[dateStr] = 8;
            // Absences from database
            ausenciasRow[dateStr] = absenceHours[dateStr] || 0;
            // Committed hours from database
            comprometidasRow[dateStr] = committedHours[dateStr] || 0;
        }

        const rowData = [disponiblesRow, ausenciasRow, comprometidasRow];

        // Grid options
        const gridOptions = {
            columnDefs: columnDefs,
            rowData: rowData,
            defaultColDef: {
                sortable: false,
                filter: false,
                resizable: true,
                suppressMenu: true
            },
            animateRows: false,
            enableCellTextSelection: true,
            suppressRowClickSelection: true,
            stopEditingWhenCellsLoseFocus: true,
            singleClickEdit: false,
            onCellValueChanged: (event) => {
                this.validateCapacity(event);
            },
            onGridReady: (params) => {
                this.gridApi = params.api;
                params.api.sizeColumnsToFit();
                
                // Scroll to today's column
                setTimeout(() => {
                    const todayDateStr = new Date().toISOString().split('T')[0];
                    params.api.ensureColumnVisible(todayDateStr);
                }, 200);
            }
        };

        // Create grid
        this.gridApi = agGrid.createGrid(gridDiv, gridOptions);
    }

    /**
     * Validate capacity constraints
     */
    validateCapacity(event) {
        // Get current value
        const field = event.colDef.field;
        const rowType = event.data.rowType;
        
        // Ensure value is >= 0
        if (event.newValue < 0) {
            event.node.setDataValue(field, 0);
            alert('Las horas no pueden ser negativas');
            return;
        }

        // Get all rows
        let disponibles = 0;
        let ausencias = 0;
        let comprometidas = 0;

        this.gridApi.forEachNode(node => {
            const value = parseFloat(node.data[field]) || 0;
            if (node.data.rowType === 'disponibles') {
                disponibles = value;
            } else if (node.data.rowType === 'ausencias') {
                ausencias = value;
            } else if (node.data.rowType === 'comprometidas') {
                comprometidas = value;
            }
        });

        // Validate: Ausencias + Comprometidas <= Disponibles
        if (ausencias + comprometidas > disponibles) {
            alert(`Validación fallida en ${field}:\nAusencias (${ausencias}h) + Comprometidas (${comprometidas}h) no puede superar Disponibles (${disponibles}h)`);
            
            // Revert to previous value
            if (rowType === 'disponibles') {
                event.node.setDataValue(field, ausencias + comprometidas);
            } else if (rowType === 'ausencias') {
                event.node.setDataValue(field, disponibles - comprometidas);
            }
        }
    }

    /**
     * Save resource information
     */
    async saveResourceInfo() {
        const name = document.getElementById('resource-name').value;
        const email = document.getElementById('resource-email').value;
        const skills = document.getElementById('resource-skills').value;

        console.log('Saving resource info:', { name, email, skills });

        // TODO: Implement API call to update resource
        alert('Información del recurso guardada (simulado)');
    }

    /**
     * Save capacity data
     * Saves absences as special assignments
     */
    async saveCapacity() {
        if (!this.gridApi) return;

        try {
            const awsAccessKey = sessionStorage.getItem('aws_access_key');
            const userTeam = sessionStorage.getItem('user_team');
            
            if (!awsAccessKey || !userTeam) {
                throw new Error('No authentication tokens found');
            }

            const capacityData = {};
            
            this.gridApi.forEachNode(node => {
                const rowType = node.data.rowType;
                capacityData[rowType] = {};
                
                Object.keys(node.data).forEach(key => {
                    if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        capacityData[rowType][key] = parseFloat(node.data[key]) || 0;
                    }
                });
            });

            console.log('Saving capacity data:', capacityData);

            // Get or create special "ABSENCES" project
            const absencesProject = await this.getOrCreateAbsencesProject(awsAccessKey, userTeam);
            
            if (!absencesProject) {
                throw new Error('Could not create absences project');
            }

            // Delete existing absences for this resource
            await this.deleteExistingAbsences(this.resourceId, absencesProject.id, awsAccessKey, userTeam);

            // Save new absences as assignments
            const absencesData = capacityData.ausencias || {};
            const savedCount = await this.saveAbsencesAsAssignments(
                this.resourceId, 
                absencesProject.id, 
                absencesData,
                awsAccessKey,
                userTeam
            );

            alert(`✓ Capacidad guardada correctamente\n\n${savedCount} días con ausencias/vacaciones guardados`);
            
            this.close();
            
        } catch (error) {
            console.error('Error saving capacity:', error);
            alert(`❌ Error al guardar capacidad\n\n${error.message}`);
        }
    }

    /**
     * Get or create the special ABSENCES project
     */
    async getOrCreateAbsencesProject(awsAccessKey, userTeam) {
        try {
            // Try to get existing ABSENCES project
            const getResponse = await fetch(`${API_CONFIG.BASE_URL}/projects`, {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            });
            
            if (getResponse.ok) {
                const data = await getResponse.json();
                const projects = data.data?.projects || data.projects || [];
                const absencesProject = projects.find(p => p.code === 'ABSENCES');
                
                if (absencesProject) {
                    return absencesProject;
                }
            }
            
            // Create ABSENCES project if it doesn't exist
            const createResponse = await fetch(`${API_CONFIG.BASE_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                },
                body: JSON.stringify({
                    code: 'ABSENCES',
                    title: 'Ausencias y Vacaciones',
                    description: 'Proyecto especial para tracking de ausencias y vacaciones',
                    type: 'Proyecto',  // Válido según validators.ts: 'Proyecto' o 'Evolutivo'
                    priority: 'Baja',   // Válido según validators.ts
                    status: 1,          // Idea
                    domain: 12,         // Ninguno
                    team: userTeam,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().split('T')[0]
                })
            });
            
            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                console.error('Error creating ABSENCES project:', errorData);
                throw new Error(`Could not create absences project: ${errorData.message || errorData.error || 'Unknown error'}`);
            }
            
            const result = await createResponse.json();
            return result.data || result;
            
        } catch (error) {
            console.error('Error getting/creating absences project:', error);
            return null;
        }
    }

    /**
     * Delete existing absences for this resource
     */
    async deleteExistingAbsences(resourceId, projectId, awsAccessKey, userTeam) {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}/assignments?projectId=${projectId}&resourceId=${resourceId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': awsAccessKey,
                        'x-user-team': userTeam
                    }
                }
            );
            
            if (!response.ok) return;
            
            const data = await response.json();
            const assignments = data.data?.assignments || data.assignments || [];
            
            // Delete each existing absence assignment
            for (const assignment of assignments) {
                await fetch(`${API_CONFIG.BASE_URL}/assignments/${assignment.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': awsAccessKey,
                        'x-user-team': userTeam
                    }
                });
            }
            
            console.log(`Deleted ${assignments.length} existing absences`);
            
        } catch (error) {
            console.error('Error deleting existing absences:', error);
        }
    }

    /**
     * Save absences as assignments
     */
    async saveAbsencesAsAssignments(resourceId, projectId, absencesData, awsAccessKey, userTeam) {
        let savedCount = 0;
        
        for (const [date, hours] of Object.entries(absencesData)) {
            // Only save days with hours > 0
            if (hours <= 0) continue;
            
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}/assignments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': awsAccessKey,
                        'x-user-team': userTeam
                    },
                    body: JSON.stringify({
                        projectId: projectId,
                        resourceId: resourceId,
                        title: 'Ausencia/Vacación',
                        description: 'Registro de ausencia o vacación',
                        date: date,
                        hours: hours
                    })
                });
                
                if (response.ok) {
                    savedCount++;
                } else {
                    console.error(`Failed to save absence for ${date}`);
                }
                
            } catch (error) {
                console.error(`Error saving absence for ${date}:`, error);
            }
        }
        
        return savedCount;
    }
}
