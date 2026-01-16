/**
 * Task Modal Component with AG Grid
 * Provides Excel-like interface for managing project tasks
 */

import { API_CONFIG } from '../config/data.js';

export class TaskModal {
    constructor() {
        this.gridApi = null;
        this.projectId = null;
        this.projectName = null;
        this.modalElement = null;
        this.isInitialized = false;
        this.resourcesList = [];
        this.tasksList = [];
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
            <div id="task-modal" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 24px; height: 24px; display: inline-block; margin-right: 8px;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                            </svg>
                            <span id="modal-project-title">Detalle de Tareas del Proyecto</span>
                        </h2>
                        <button class="modal-close" id="close-task-modal" title="Cerrar">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="task-grid" class="ag-grid-container ag-theme-alpine"></div>
                    </div>
                    <div class="modal-footer">
                        <div class="modal-footer-left">
                            <button class="btn-icon btn-add" id="add-task-row">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Añadir Fila
                            </button>
                            <button class="btn-icon btn-delete" id="delete-task-row">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                                Eliminar Seleccionadas
                            </button>
                            <div class="info-text">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                </svg>
                                Doble clic para editar | Tab/Enter para navegar
                            </div>
                        </div>
                        <div class="modal-footer-right">
                            <button class="btn-icon btn-cancel" id="cancel-task-modal">Cancelar</button>
                            <button class="btn-icon btn-save" id="save-task-modal">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById('task-modal');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close modal
        document.getElementById('close-task-modal').addEventListener('click', () => this.close());
        document.getElementById('cancel-task-modal').addEventListener('click', () => this.close());
        
        // Close on overlay click
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.close();
            }
        });

        // Add row
        document.getElementById('add-task-row').addEventListener('click', () => this.addRow());

        // Delete selected rows
        document.getElementById('delete-task-row').addEventListener('click', () => this.deleteSelectedRows());

        // Save changes
        document.getElementById('save-task-modal').addEventListener('click', () => this.save());

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalElement.classList.contains('active')) {
                this.close();
            }
        });
    }

    /**
     * Load existing assignments for this project and transform to grid format
     */
    async loadProjectAssignments() {
        try {
            const awsAccessKey = sessionStorage.getItem('aws_access_key');
            const userTeam = sessionStorage.getItem('user_team');
            
            if (!awsAccessKey || !userTeam) {
                console.warn('No authentication tokens found');
                return [];
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/assignments?projectId=${this.projectId}`, {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            });
            
            if (!response.ok) {
                throw new Error('Error loading assignments');
            }
            
            const data = await response.json();
            const assignments = data.data?.assignments || data.assignments || [];
            
            console.log('Raw assignments loaded:', assignments.length);
            
            // Transform assignments to grid row format
            // Group by resource + task + team
            const rowsMap = new Map();
            
            assignments.forEach(assignment => {
                // Find resource name
                const resource = this.resourcesList.find(r => r.id === assignment.resourceId);
                const resourceName = resource?.name || 'Unknown';
                
                // Create unique key for grouping
                const key = `${resourceName}|${assignment.title}|${assignment.team || ''}`;
                
                if (!rowsMap.has(key)) {
                    rowsMap.set(key, {
                        recurso: resourceName,
                        tarea: assignment.title,
                        detalleTarea: assignment.description || '',
                        equipo: assignment.team || ''
                    });
                }
                
                const row = rowsMap.get(key);
                
                // Add hours to the appropriate date
                if (assignment.date) {
                    // Daily assignment
                    const dateStr = new Date(assignment.date).toISOString().split('T')[0];
                    row[dateStr] = (row[dateStr] || 0) + parseFloat(assignment.hours || 0);
                } else if (assignment.month && assignment.year) {
                    // Legacy monthly assignment - put on first day of month
                    const date = new Date(assignment.year, assignment.month - 1, 1);
                    const dateStr = date.toISOString().split('T')[0];
                    row[dateStr] = (row[dateStr] || 0) + parseFloat(assignment.hours || 0);
                }
            });
            
            const rows = Array.from(rowsMap.values());
            console.log('Transformed to grid rows:', rows.length);
            
            return rows;
            
        } catch (error) {
            console.error('Error loading project assignments:', error);
            return [];
        }
    }

    /**
     * Load tasks from API for this project
     */
    async loadTasks() {
        try {
            const awsAccessKey = sessionStorage.getItem('aws_access_key');
            const userTeam = sessionStorage.getItem('user_team');
            
            if (!awsAccessKey || !userTeam) {
                console.warn('No authentication tokens found');
                return [];
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/assignments?projectId=${this.projectId}`, {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            });
            
            if (!response.ok) {
                throw new Error('Error loading tasks');
            }
            
            const data = await response.json();
            console.log('API Response for tasks:', data);
            const tasks = data.data?.assignments || data.assignments || [];
            console.log('Raw tasks:', tasks);
            console.log('Project ID used:', this.projectId);
            
            // Extract unique task titles
            const taskTitles = tasks.map(t => t.title);
            console.log('Task titles:', taskTitles);
            const uniqueTasks = [...new Set(taskTitles.filter(t => t && t.trim() !== ''))];
            
            console.log('Tasks loaded for project:', uniqueTasks.length);
            console.log('Unique tasks:', uniqueTasks);
            return uniqueTasks;
            
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    /**
     * Load resources from API
     */
    async loadResources() {
        try {
            const awsAccessKey = sessionStorage.getItem('aws_access_key');
            const userTeam = sessionStorage.getItem('user_team');
            
            if (!awsAccessKey || !userTeam) {
                console.warn('No authentication tokens found');
                return [];
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/resources`, {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            });
            
            if (!response.ok) {
                throw new Error('Error loading resources');
            }
            
            const data = await response.json();
            let resources = data.data?.resources || data.resources || [];
            
            // Filter resources by user's team
            resources = resources.filter(r => {
                // Normalize team values for comparison
                const resourceTeam = (r.team || '').toLowerCase().trim();
                const normalizedUserTeam = userTeam.toLowerCase().trim();
                
                return resourceTeam === normalizedUserTeam;
            });
            
            console.log('Resources loaded:', resources.length, `(filtered by team: ${userTeam})`);
            return resources;
            
        } catch (error) {
            console.error('Error loading resources:', error);
            return [];
        }
    }

    /**
     * Open modal for a specific project
     */
    async open(projectCode, projectName, existingTasks = [], startDate = null, endDate = null) {
        // Find the numeric project ID from the project code
        const project = window.allProjects?.find(p => p.code === projectCode);
        
        this.projectId = project?.id || projectCode; // Use numeric ID if available, fallback to code
        this.projectCode = projectCode;
        this.projectName = projectName;
        this.startDate = startDate;
        this.endDate = endDate;

        console.log('Opening modal for project:', { code: projectCode, id: this.projectId, name: projectName });

        // Update modal title
        const dateRange = startDate && endDate ? ` (${startDate} - ${endDate})` : '';
        document.getElementById('modal-project-title').textContent = 
            `Asignación de Recursos - ${projectName}${dateRange}`;

        // Load resources and tasks before initializing grid
        this.resourcesList = await this.loadResources();
        this.tasksList = await this.loadTasks();

        // Load existing assignments for this project
        const loadedAssignments = await this.loadProjectAssignments();
        console.log('Loaded assignments for project:', loadedAssignments.length);

        // Initialize AG Grid with loaded data
        this.initializeGrid(loadedAssignments, startDate, endDate);

        // Show modal
        this.modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';
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
     * Generate date columns: -30 days to +120 days from today
     */
    generateDateColumns() {
        const dateColumns = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Start 30 days before today
        const start = new Date(today);
        start.setDate(start.getDate() - 30);
        
        // End 120 days after today
        const end = new Date(today);
        end.setDate(end.getDate() + 120);
        
        let currentDate = new Date(start);
        
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const day = currentDate.getDate();
            const month = currentDate.getMonth() + 1;
            const dateHeader = `${day}/${month}`;
            
            // Determine if it's weekend or today
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const isToday = currentDate.toDateString() === today.toDateString();
            
            dateColumns.push({
                headerName: dateHeader,
                field: dateStr,
                editable: true,
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
                valueFormatter: params => params.value ? `${params.value}h` : '',
                cellStyle: params => {
                    const style = { 
                        textAlign: 'center',
                        fontWeight: params.value ? '600' : 'normal',
                        fontSize: '0.85em'
                    };
                    
                    // Highlight today's column
                    if (isToday) {
                        style.backgroundColor = '#fef3c7';
                        style.borderLeft = '2px solid #f59e0b';
                        style.borderRight = '2px solid #f59e0b';
                    }
                    // Highlight weekends
                    else if (isWeekend) {
                        style.background = 'rgba(200, 200, 200, 0.1)';
                    }
                    // Highlight cells with values
                    else if (params.value) {
                        style.background = 'rgba(49, 151, 149, 0.1)';
                        style.color = '#00695c';
                    }
                    
                    return style;
                },
                headerClass: isToday ? 'today-header' : (isWeekend ? 'weekend-header' : '')
            });
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log('Generated date columns:', dateColumns.length);
        console.log('First 5 columns:', dateColumns.slice(0, 5).map(c => c.headerName));
        console.log('Last 5 columns:', dateColumns.slice(-5).map(c => c.headerName));
        
        return dateColumns;
    }

    /**
     * Initialize AG Grid
     */
    initializeGrid(tasks, startDate = null, endDate = null) {
        const gridDiv = document.getElementById('task-grid');

        console.log('Initializing grid with resources:', this.resourcesList.length);
        console.log('Resources:', this.resourcesList);
        console.log('Tasks:', this.tasksList.length);

        // Prepare resource names for dropdown
        const resourceNames = this.resourcesList.length > 0 
            ? this.resourcesList.map(r => r.name)
            : ['Recurso 1', 'Recurso 2', 'Recurso 3']; // Fallback values
        
        // Prepare task names for dropdown - always include "Proyecto" as first option
        const taskNames = ['Proyecto', ...this.tasksList];
        
        console.log('Resource names for dropdown:', resourceNames);
        console.log('Task names for dropdown:', taskNames);

        // Base column definitions
        const columnDefs = [
            {
                headerName: '',
                checkboxSelection: true,
                headerCheckboxSelection: true,
                width: 50,
                pinned: 'left',
                lockPosition: true,
                suppressMenu: true
            },
            {
                headerName: 'Recurso',
                field: 'recurso',
                editable: true,
                width: 140,
                minWidth: 120,
                pinned: 'left',
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                    values: resourceNames
                },
                cellStyle: { 
                    fontWeight: '600',
                    background: 'rgba(49, 151, 149, 0.05)'
                }
            },
            {
                headerName: 'Tarea',
                field: 'tarea',
                editable: true,
                width: 150,
                minWidth: 120,
                pinned: 'left',
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                    values: taskNames
                }
            },
            {
                headerName: 'Comentarios',
                field: 'detalleTarea',
                editable: true,
                width: 200,
                minWidth: 150,
                pinned: 'left',
                cellEditor: 'agLargeTextCellEditor',
                cellEditorPopup: true,
                cellEditorParams: {
                    maxLength: 500,
                    rows: 5,
                    cols: 50
                },
                wrapText: true,
                autoHeight: true
            },
            {
                headerName: 'Equipo',
                field: 'equipo',
                editable: true,
                width: 140,
                minWidth: 120,
                pinned: 'left',
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                    values: ['Conceptualización', 'Análisis', 'Diseño', 'Construcción', 'QA', 'Despliegue']
                },
                cellStyle: params => {
                    const colors = {
                        'Conceptualización': { background: 'rgba(129, 199, 132, 0.1)', color: '#2e7d32' },
                        'Análisis': { background: 'rgba(66, 153, 225, 0.1)', color: '#3182ce' },
                        'Diseño': { background: 'rgba(236, 64, 122, 0.1)', color: '#d53f8c' },
                        'Construcción': { background: 'rgba(255, 183, 77, 0.1)', color: '#e65100' },
                        'QA': { background: 'rgba(186, 104, 200, 0.1)', color: '#6a1b9a' },
                        'Despliegue': { background: 'rgba(77, 182, 172, 0.1)', color: '#00695c' }
                    };
                    return colors[params.value] || {};
                }
            },
            // Add Total column after Equipo (before date columns)
            {
                headerName: 'Total',
                field: 'total',
                width: 120,
                minWidth: 70,
                pinned: 'left',
                editable: false,
                filter: false,
                sortable: false,
                suppressMenu: true,
                resizable: true,
                cellStyle: {
                    backgroundColor: '#e5e7eb', 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    borderLeft: '2px solid #6b7280',
                    fontSize: '0.9em'
                },
                valueGetter: (params) => {
                    // Sum all day columns
                    let total = 0;
                    Object.keys(params.data).forEach(key => {
                        if (key.match(/^\d{4}-\d{2}-\d{2}$/) && params.data[key]) {
                            total += parseFloat(params.data[key]) || 0;
                        }
                    });
                    return total > 0 ? `${total.toFixed(1)}h` : '';
                }
            }
        ];

        // Always add date columns
        // If no dates provided, generate 120 days from today
        let dateStart = startDate;
        let dateEnd = endDate;
        
        if (!dateStart || !dateEnd) {
            const today = new Date();
            dateStart = today.toISOString().split('T')[0];
            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + 120);
            dateEnd = futureDate.toISOString().split('T')[0];
        }
        
        const dateColumns = this.generateDateColumns();
        columnDefs.push(...dateColumns);

        // Grid options
        const gridOptions = {
            columnDefs: columnDefs,
            rowData: tasks.length > 0 ? tasks : this.getDefaultRows(),
            defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true,
                suppressMenu: false
            },
            rowSelection: 'multiple',
            animateRows: true,
            enableCellTextSelection: true,
            ensureDomOrder: true,
            suppressRowClickSelection: true,
            stopEditingWhenCellsLoseFocus: true,
            singleClickEdit: false,
            enterNavigatesVertically: true,
            enterNavigatesVerticallyAfterEdit: true,
            undoRedoCellEditing: true,
            undoRedoCellEditingLimit: 20,
            enableRangeSelection: true,
            enableFillHandle: true,
            fillHandleDirection: 'y',
            onCellValueChanged: (event) => {
                console.log('Cell value changed:', event);
            },
            onGridReady: (params) => {
                this.gridApi = params.api;
                params.api.sizeColumnsToFit();
                
                // Scroll to today's column
                setTimeout(() => {
                    const todayDateStr = new Date().toISOString().split('T')[0];
                    params.api.ensureColumnVisible(todayDateStr);
                    console.log('Scrolled to today:', todayDateStr);
                }, 200);
            }
        };

        // Create grid
        this.gridApi = agGrid.createGrid(gridDiv, gridOptions);
    }

    /**
     * Get default empty rows
     */
    getDefaultRows() {
        const defaultRow = { recurso: '', tarea: '', detalleTarea: '', equipo: '' };
        
        // Always initialize date fields
        let dateStart = this.startDate;
        let dateEnd = this.endDate;
        
        if (!dateStart || !dateEnd) {
            const today = new Date();
            dateStart = today.toISOString().split('T')[0];
            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + 120);
            dateEnd = futureDate.toISOString().split('T')[0];
        }
        
        const start = new Date(dateStart);
        const end = new Date(dateEnd);
        let currentDate = new Date(start);
        
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            defaultRow[dateStr] = null;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return [
            { ...defaultRow },
            { ...defaultRow },
            { ...defaultRow }
        ];
    }

    /**
     * Add new row
     */
    addRow() {
        if (!this.gridApi) return;

        const newRow = { recurso: '', tarea: '', detalleTarea: '', equipo: '' };
        
        // Always initialize date fields
        let dateStart = this.startDate;
        let dateEnd = this.endDate;
        
        if (!dateStart || !dateEnd) {
            const today = new Date();
            dateStart = today.toISOString().split('T')[0];
            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + 120);
            dateEnd = futureDate.toISOString().split('T')[0];
        }
        
        const start = new Date(dateStart);
        const end = new Date(dateEnd);
        let currentDate = new Date(start);
        
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            newRow[dateStr] = null;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        this.gridApi.applyTransaction({ add: [newRow] });

        // Focus on the new row
        const rowCount = this.gridApi.getDisplayedRowCount();
        this.gridApi.ensureIndexVisible(rowCount - 1);
    }

    /**
     * Delete selected rows
     */
    deleteSelectedRows() {
        if (!this.gridApi) return;

        const selectedRows = this.gridApi.getSelectedRows();
        
        if (selectedRows.length === 0) {
            alert('Por favor, selecciona las filas que deseas eliminar.');
            return;
        }

        if (confirm(`¿Estás seguro de eliminar ${selectedRows.length} fila(s)?`)) {
            this.gridApi.applyTransaction({ remove: selectedRows });
        }
    }

    /**
     * Save changes
     */
    async save() {
        if (!this.gridApi) return;

        const allRows = [];
        this.gridApi.forEachNode(node => allRows.push(node.data));

        // Filter out empty rows (rows with at least some data)
        const validRows = allRows.filter(row => {
            // Check if row has recurso, tarea, descripcion, or equipo
            if (row.recurso || row.tarea || row.detalleTarea || row.equipo) {
                return true;
            }
            // Or check if it has any date values
            return Object.keys(row).some(key => key.match(/^\d{4}-\d{2}-\d{2}$/) && row[key]);
        });

        // Validate data
        const errors = this.validateData(validRows);
        if (errors.length > 0) {
            alert('Errores de validación:\n\n' + errors.join('\n'));
            return;
        }

        // Calculate totals from date columns
        let totalHoras = 0;
        validRows.forEach(row => {
            Object.keys(row).forEach(key => {
                if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    totalHoras += parseFloat(row[key]) || 0;
                }
            });
        });

        console.log('Saving tasks for project:', this.projectId);
        console.log('Tasks:', validRows);
        console.log('Total horas:', totalHoras.toFixed(1));

        // Save to database
        try {
            await this.saveToDatabase(validRows);
            
            // Also save to localStorage as backup
            this.saveToStorage(validRows);

            // Show success message
            alert(`✓ Guardado exitoso\n\nProyecto: ${this.projectName}\nTareas: ${validRows.length}\nTotal horas: ${totalHoras.toFixed(1)}h`);

            this.close();
        } catch (error) {
            console.error('Error saving to database:', error);
            
            // Mostrar error detallado al usuario
            const errorMessage = error.message || 'Error desconocido al guardar';
            
            // Si es error de capacidad, mostrar mensaje especial
            if (errorMessage.includes('capacidad') || errorMessage.includes('capacity')) {
                alert(errorMessage);
            } else {
                alert(`❌ Error al guardar los cambios\n\n${errorMessage}\n\nPor favor, revisa los datos e intenta de nuevo.`);
            }
        }
    }

    /**
     * Save to database with daily assignments
     * Strategy: Delete all existing assignments for this project, then create new ones
     */
    async saveToDatabase(rows) {
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            throw new Error('No authentication tokens found');
        }

        // STEP 1: Delete all existing assignments for this project
        console.log('Step 1: Deleting existing assignments for project:', this.projectId);
        try {
            const deleteResponse = await fetch(`${API_CONFIG.BASE_URL}/assignments?projectId=${this.projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            });
            
            if (deleteResponse.ok) {
                const deleteResult = await deleteResponse.json();
                console.log('Deleted assignments:', deleteResult);
            } else {
                console.warn('Could not delete existing assignments:', deleteResponse.status);
            }
        } catch (error) {
            console.warn('Error deleting existing assignments:', error);
            // Continue anyway - maybe there were no existing assignments
        }

        // STEP 2: Transform rows to daily assignments
        const assignments = [];
        
        rows.forEach(row => {
            // For each day with hours, create a daily assignment
            Object.keys(row).forEach(key => {
                if (key.match(/^\d{4}-\d{2}-\d{2}$/) && row[key] && parseFloat(row[key]) > 0) {
                    // Find resource ID from name
                    const resource = this.resourcesList.find(r => r.name === row.recurso);
                    
                    if (!resource) {
                        console.warn(`Resource not found for: ${row.recurso}`);
                        return;
                    }
                    
                    // Extract month and year from date for KPI filtering
                    const dateObj = new Date(key);
                    const month = dateObj.getMonth() + 1; // 1-12
                    const year = dateObj.getFullYear();
                    
                    assignments.push({
                        projectId: this.projectId,
                        resourceId: resource.id,
                        title: row.tarea || 'Sin título',
                        description: row.detalleTarea || '',
                        team: row.equipo || null,
                        date: key, // YYYY-MM-DD format
                        month: month, // Add month for KPI filtering
                        year: year, // Add year for KPI filtering
                        hours: parseFloat(row[key])
                    });
                }
            });
        });

        console.log('Step 2: Creating new assignments:', assignments.length);
        console.log('Sample assignments:', assignments.slice(0, 3));

        // STEP 3: Save each assignment to the API
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const assignment of assignments) {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}/assignments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': awsAccessKey,
                        'x-user-team': userTeam
                    },
                    body: JSON.stringify(assignment)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    
                    // Get error message (can be string or object)
                    const errorMessage = typeof errorData.error === 'string' 
                        ? errorData.error 
                        : (errorData.message || JSON.stringify(errorData));
                    
                    // Check if it's a capacity exceeded error
                    if (errorMessage.toLowerCase().includes('capacity')) {
                        results.errors.push({
                            assignment,
                            error: errorMessage,
                            type: 'CAPACITY_EXCEEDED'
                        });
                    } else {
                        results.errors.push({
                            assignment,
                            error: errorMessage
                        });
                    }
                    results.failed++;
                } else {
                    results.success++;
                }
            } catch (error) {
                console.error('Error saving assignment:', error);
                results.errors.push({
                    assignment,
                    error: error.message
                });
                results.failed++;
            }
        }

        console.log('Save results:', results);

        // If there were capacity errors, show detailed message
        if (results.errors.some(e => e.type === 'CAPACITY_EXCEEDED')) {
            const capacityErrors = results.errors.filter(e => e.type === 'CAPACITY_EXCEEDED');
            const errorMessages = capacityErrors.map(e => {
                const { assignment, error } = e;
                const resource = this.resourcesList.find(r => r.id === assignment.resourceId);
                return `• ${resource?.name} - ${assignment.date}: ${error}`;
            });
            
            throw new Error(
                `⚠️ Se superó la capacidad disponible:\n\n${errorMessages.join('\n')}\n\n` +
                `Guardadas: ${results.success} | Fallidas: ${results.failed}\n\n` +
                `Por favor, revisa las horas asignadas en el modal de Gestión de Capacidad.`
            );
        }

        // If there were other errors
        if (results.failed > 0) {
            throw new Error(
                `Se guardaron ${results.success} asignaciones, pero ${results.failed} fallaron.\n\n` +
                `Errores: ${results.errors.map(e => e.error).join(', ')}`
            );
        }

        return results;
    }

    /**
     * Validate task data
     */
    validateData(rows) {
        const errors = [];

        rows.forEach((row, index) => {
            const rowNum = index + 1;

            // Check if row has at least one filled field
            const hasRecurso = row.recurso && row.recurso.trim() !== '';
            const hasTarea = row.tarea && row.tarea.trim() !== '';
            const hasEquipo = row.equipo && row.equipo.trim() !== '';
            
            // Check if row has at least some hours in date columns
            let hasHours = false;
            Object.keys(row).forEach(key => {
                if (key.match(/^\d{4}-\d{2}-\d{2}$/) && row[key] > 0) {
                    hasHours = true;
                }
            });

            // If row has any data, validate required fields
            if (hasRecurso || hasTarea || hasEquipo || hasHours) {
                if (!hasTarea) {
                    errors.push(`Fila ${rowNum}: El campo "Tarea" es obligatorio`);
                }
            }
        });

        return errors;
    }

    /**
     * Save to localStorage
     */
    saveToStorage(tasks) {
        const storageKey = `project_tasks_${this.projectId}`;
        localStorage.setItem(storageKey, JSON.stringify({
            projectId: this.projectId,
            projectName: this.projectName,
            tasks: tasks,
            lastUpdated: new Date().toISOString()
        }));
    }

    /**
     * Load from localStorage
     */
    static loadFromStorage(projectId) {
        const storageKey = `project_tasks_${projectId}`;
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data).tasks : [];
    }
}
