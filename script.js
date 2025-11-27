// Global data storage
let resources = [
    { id: 'juan', name: 'Juan Pérez', type: 'developer', capacity: 160, cost: 4500, status: 'available' },
    { id: 'maria', name: 'María García', type: 'designer', capacity: 160, cost: 3800, status: 'assigned' },
    { id: 'carlos', name: 'Carlos López', type: 'pm', capacity: 160, cost: 5200, status: 'available' },
    { id: 'ana', name: 'Ana Martín', type: 'qa', capacity: 160, cost: 3200, status: 'assigned' }
];

let projects = [
    { id: 'app-mobile', name: 'App Mobile', start: '2025-01', end: '2025-05', priority: 'alta', status: 'planned' },
    { id: 'web-corp', name: 'Web Corporativa', start: '2025-02', end: '2025-06', priority: 'media', status: 'planned' },
    { id: 'api-int', name: 'API Integración', start: '2025-04', end: '2025-07', priority: 'baja', status: 'planned' }
];

let capacityMatrix = {
    'app-mobile': { 'ene': 2, 'feb': 3, 'mar': 4, 'abr': 2, 'may': 1 },
    'web-corp': { 'feb': 1, 'mar': 2, 'abr': 2, 'may': 2, 'jun': 1 },
    'api-int': { 'abr': 1, 'may': 1, 'jun': 1, 'jul': 1 }
};

// Tab functionality
function showTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabId).classList.add('active');
    
    // Add active class to the button that corresponds to this tab
    const activeButton = document.querySelector(`[onclick="showTab('${tabId}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Period selector functionality
function changePeriod(selectedPeriod) {
    console.log(`Período seleccionado: ${selectedPeriod}`);
    
    // Update the data and charts based on the selected period
    switch(selectedPeriod) {
        case 'mes-actual':
            // Show current month data
            updateChartsForCurrentMonth();
            break;
        case 'mes-proximo':
            // Show next month data
            updateChartsForNextMonth();
            break;
        case 'siguientes-3-meses':
            // Show next 3 months data
            updateChartsForNext3Months();
            break;
        default:
            console.log('Período no reconocido:', selectedPeriod);
    }
}

// Helper functions to update charts based on selected period
function updateChartsForCurrentMonth() {
    // In a real implementation, this would update all charts with current month data
    console.log('Actualizando gráficos para el mes actual');
}

function updateChartsForNextMonth() {
    // In a real implementation, this would update all charts with next month data
    console.log('Actualizando gráficos para el mes próximo');
}

function updateChartsForNext3Months() {
    // In a real implementation, this would update all charts with next 3 months data
    console.log('Actualizando gráficos para los siguientes 3 meses');
}

// Capacity matrix functionality
function editCapacity(projectId, month) {
    const currentValue = capacityMatrix[projectId] && capacityMatrix[projectId][month] ? capacityMatrix[projectId][month] : 0;
    const newValue = prompt(`Recursos para ${projectId} en ${month}:`, currentValue);
    
    if (newValue !== null && !isNaN(newValue)) {
        if (!capacityMatrix[projectId]) {
            capacityMatrix[projectId] = {};
        }
        capacityMatrix[projectId][month] = parseInt(newValue);
        updateCapacityMatrix();
    }
}

function updateCapacityMatrix() {
    // This would update the matrix display
    // For now, just show an alert
    alert('Matriz actualizada. En una implementación real, esto actualizaría la vista.');
}

// Modal functionality
function showAddResourceModal() {
    const modal = document.getElementById('add-resource-modal');
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // Set default values
    document.getElementById('modal-resource-capacity').value = '160';
    
    // Focus on first input
    setTimeout(() => {
        document.getElementById('modal-resource-name').focus();
    }, 300);
}

function hideAddResourceModal() {
    const modal = document.getElementById('add-resource-modal');
    modal.classList.remove('show');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
        modal.style.display = 'none';
        clearAddResourceForm();
    }, 300);
}

function clearAddResourceForm() {
    document.getElementById('modal-resource-name').value = '';
    document.getElementById('modal-resource-capacity').value = '160';
    document.getElementById('modal-resource-start-date').value = '';
    document.getElementById('modal-resource-end-date').value = '';
    
    // Uncheck all skills
    const skillCheckboxes = document.querySelectorAll('.skill-option input[type="checkbox"]');
    skillCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

function submitAddResource() {
    const name = document.getElementById('modal-resource-name').value.trim();
    const capacity = parseInt(document.getElementById('modal-resource-capacity').value);
    const startDate = document.getElementById('modal-resource-start-date').value;
    const endDate = document.getElementById('modal-resource-end-date').value;
    
    // Get selected skills
    const selectedSkills = [];
    const skillCheckboxes = document.querySelectorAll('.skill-option input[type="checkbox"]:checked');
    skillCheckboxes.forEach(checkbox => {
        selectedSkills.push(checkbox.value);
    });
    
    // Validation
    if (!name) {
        alert('Por favor, introduce el nombre del recurso.');
        document.getElementById('modal-resource-name').focus();
        return;
    }
    
    if (!capacity || capacity < 1 || capacity > 200) {
        alert('Por favor, introduce una capacidad válida (1-200 horas).');
        document.getElementById('modal-resource-capacity').focus();
        return;
    }
    
    if (selectedSkills.length === 0) {
        alert('Por favor, selecciona al menos una skill.');
        return;
    }
    
    // Validate dates if both are provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
        document.getElementById('modal-resource-start-date').focus();
        return;
    }
    
    // Create new resource object
    const newResource = {
        id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        name: name,
        skills: selectedSkills,
        capacity: capacity,
        startDate: startDate || null,
        endDate: endDate || null,
        status: 'available'
    };
    
    // Add to resources array
    resources.push(newResource);
    
    // Add new row to the resources table
    addResourceToTable(newResource);
    
    // Hide modal
    hideAddResourceModal();
    
    // Show success message
    alert(`Recurso "${name}" añadido correctamente.`);
}

function addResourceToTable(resource) {
    const tableBody = document.querySelector('#resources-tab .capacity-matrix tbody');
    const row = document.createElement('tr');
    
    // Create skills badges HTML
    const skillsBadgesHtml = resource.skills.map(skill => {
        const skillMap = {
            'construccion': 'Cod',
            'analisis': 'Ana',
            'diseno': 'Dis',
            'qa': 'QA',
            'project-management': 'PM',
            'conceptualizacion': 'Con',
            'general': 'Gen'
        };
        const shortName = skillMap[skill] || skill.substring(0, 3).toUpperCase();
        return `<span class="skill-badge ${skill}">${shortName}</span>`;
    }).join('');
    
    // Create capacity cells for all months (default to resource capacity)
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const capacityCells = months.map(month => {
        return `<td><span class="capacity-cell medium" onclick="editResourceCapacity('${resource.id}', '${month}')" title="Disponible - ${resource.capacity}">${resource.capacity}</span></td>`;
    }).join('');
    
    row.innerHTML = `
        <td class="project-name"><strong>${resource.name}</strong></td>
        <td style="text-align: left; padding: 0.5rem;">
            ${skillsBadgesHtml}
        </td>
        ${capacityCells}
    `;
    
    // Insert before the last row (if there are existing rows)
    const existingRows = tableBody.querySelectorAll('tr');
    if (existingRows.length > 0) {
        tableBody.insertBefore(row, existingRows[existingRows.length - 1].nextSibling);
    } else {
        tableBody.appendChild(row);
    }
}

// Resource management (legacy function - kept for compatibility)
function addResource() {
    // This function is now replaced by the modal functionality
    showAddResourceModal();
}

function updateResourcesTable() {
    // This would update the resources table
    alert('Recurso añadido. En una implementación real, esto actualizaría la tabla.');
}

function editResource(resourceId) {
    alert(`Editando recurso: ${resourceId}`);
}

function deleteResource(resourceId) {
    if (confirm('¿Estás seguro de que quieres eliminar este recurso?')) {
        resources = resources.filter(r => r.id !== resourceId);
        updateResourcesTable();
    }
}

// Project management
function addProject() {
    const id = document.getElementById('project-id').value;
    const title = document.getElementById('project-title').value;
    const description = document.getElementById('project-description').value;
    const domain = document.getElementById('project-domain').value;
    const priority = document.getElementById('project-business-priority').value;
    const startDate = document.getElementById('project-start-date').value;
    const endDate = document.getElementById('project-end-date').value;
    const status = document.getElementById('project-status').value;
    const type = document.getElementById('project-type').value;
    
    if (id && title && domain && priority && startDate && status && type) {
        const newProject = {
            id: id,
            title: title,
            description: description || 'Sin descripción',
            domain: domain,
            priority: priority,
            startDate: startDate,
            endDate: endDate || '-',
            status: status,
            type: type
        };
        
        // Add to projects array (in real implementation, this would be saved to database)
        projects.push(newProject);
        
        // Add row to table
        addProjectToTable(newProject);
        
        // Clear form
        clearProjectForm();
        
        alert('Proyecto añadido correctamente.');
    } else {
        alert('Por favor, completa todos los campos obligatorios (ID, Título, Dominio Principal, Prioridad, Fecha Inicio, Estado, Tipo).');
    }
}

function addProjectToTable(project) {
    const tableBody = document.getElementById('projects-table-body');
    const row = document.createElement('tr');
    
    // Convert domain value to display text
    const domainMap = {
        'atencion': 'Atención',
        'facturacion': 'Facturación y Cobros',
        'contratacion': 'Contratación',
        'tecnologia': 'Tecnología',
        'marketing': 'Marketing',
        'rrhh': 'Recursos Humanos',
        'finanzas': 'Finanzas',
        'operaciones': 'Operaciones'
    };
    
    const domainText = domainMap[project.domain] || project.domain;
    const typeText = project.type.charAt(0).toUpperCase() + project.type.slice(1);
    
    row.innerHTML = `
        <td><strong>${project.id}</strong></td>
        <td>${project.title}</td>
        <td>${project.description.substring(0, 30)}${project.description.length > 30 ? '...' : ''}</td>
        <td>${domainText}</td>
        <td><span class="priority-badge ${project.priority}">${project.priority.charAt(0).toUpperCase() + project.priority.slice(1).replace('-', ' ')}</span></td>
        <td>${project.startDate}</td>
        <td>${project.endDate}</td>
        <td><span class="status-badge ${project.status}">${project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span></td>
        <td>${typeText}</td>
        <td>
            <span class="action-icon" onclick="editProject('${project.id}')" title="Editar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
            </span>
            <span class="action-icon" onclick="deleteProject('${project.id}')" title="Eliminar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
            </span>
            <span class="action-icon" onclick="syncWithJira('${project.id}')" title="Sincronizar con Jira">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            </span>
        </td>
    `;
    
    tableBody.appendChild(row);
}

function clearProjectForm() {
    document.getElementById('project-id').value = '';
    document.getElementById('project-title').value = '';
    document.getElementById('project-description').value = '';
    document.getElementById('project-domain').value = 'atencion';
    document.getElementById('project-business-priority').value = 'muy-alta';
    document.getElementById('project-start-date').value = '';
    document.getElementById('project-end-date').value = '';
    document.getElementById('project-status').value = 'concepto';
    document.getElementById('project-type').value = 'evolutivo';
}

function filterProjects() {
    const searchTerm = document.getElementById('project-search').value.toLowerCase();
    const tableBody = document.getElementById('projects-table-body');
    const rows = tableBody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        // Search in ID, Title, Description, and Reporter columns
        if (cells.length > 0) {
            const id = cells[0].textContent.toLowerCase();
            const title = cells[1].textContent.toLowerCase();
            const description = cells[2].textContent.toLowerCase();
            const reporter = cells[7].textContent.toLowerCase();
            
            if (id.includes(searchTerm) || title.includes(searchTerm) || 
                description.includes(searchTerm) || reporter.includes(searchTerm)) {
                found = true;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
}

function importFromJira() {
    // Simulate Jira import dialog
    const jiraUrl = prompt('Introduce la URL de tu instancia de Jira:', 'https://tu-empresa.atlassian.net');
    
    if (jiraUrl) {
        const jqlQuery = prompt('Introduce la consulta JQL (opcional):', 'project = "NC" AND status != "Closed"');
        
        if (jqlQuery !== null) {
            // Show loading state
            const importButton = event.target;
            const originalText = importButton.innerHTML;
            importButton.innerHTML = '<div class="loading-spinner"></div> Importando...';
            importButton.disabled = true;
            
            // Simulate API call delay
            setTimeout(() => {
                // Simulate imported projects
                const importedProjects = [
                    {
                        id: 'NC-500',
                        title: 'Migración Base de Datos Oracle',
                        description: 'Migración completa de la base de datos...',
                        priority: 'muy-alta',
                        startDate: '2025-01-15',
                        endDate: '2025-03-30',
                        status: 'desarrollo',
                        reporter: 'Ana García'
                    },
                    {
                        id: 'NC-501',
                        title: 'Implementación SSO',
                        description: 'Single Sign-On para todas las aplicaciones...',
                        priority: 'alta',
                        startDate: '2025-02-01',
                        endDate: '2025-04-15',
                        status: 'viabilidad',
                        reporter: 'Carlos Ruiz'
                    }
                ];
                
                // Add imported projects to table
                importedProjects.forEach(project => {
                    addProjectToTable(project);
                    projects.push(project);
                });
                
                // Restore button state
                importButton.innerHTML = originalText;
                importButton.disabled = false;
                
                alert(`Se han importado ${importedProjects.length} proyectos desde Jira correctamente.`);
            }, 2000);
        }
    }
}

function updateProjectsTable() {
    alert('Proyecto actualizado. En una implementación real, esto actualizaría la tabla.');
}

function editProject(projectId) {
    alert(`Editando proyecto: ${projectId}. En una implementación real, esto abriría un formulario de edición.`);
}

function deleteProject(projectId) {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
        // Remove from projects array
        projects = projects.filter(p => p.id !== projectId);
        
        // Remove from table
        const tableBody = document.getElementById('projects-table-body');
        const rows = tableBody.getElementsByTagName('tr');
        
        for (let i = 0; i < rows.length; i++) {
            const firstCell = rows[i].getElementsByTagName('td')[0];
            if (firstCell && firstCell.textContent.includes(projectId)) {
                tableBody.removeChild(rows[i]);
                break;
            }
        }
        
        alert('Proyecto eliminado correctamente.');
    }
}

function syncWithJira(projectId) {
    // Show loading state
    const actionIcon = event.target.closest('.action-icon');
    const originalContent = actionIcon.innerHTML;
    actionIcon.innerHTML = '<div class="loading-spinner"></div>';
    actionIcon.style.pointerEvents = 'none';
    
    // Simulate API call delay
    setTimeout(() => {
        // Simulate sync result
        const syncSuccess = Math.random() > 0.2; // 80% success rate
        
        if (syncSuccess) {
            alert(`Proyecto ${projectId} sincronizado correctamente con Jira.`);
        } else {
            alert(`Error al sincronizar proyecto ${projectId} con Jira. Verifique la conexión.`);
        }
        
        // Restore original state
        actionIcon.innerHTML = originalContent;
        actionIcon.style.pointerEvents = 'auto';
    }, 1500);
}

// Refresh functions
function refreshData() {
    alert('Actualizando datos generales...');
}

function refreshMatrix() {
    alert('Actualizando matriz de capacidad...');
}

function refreshResources() {
    alert('Actualizando recursos...');
}

function refreshProjects() {
    alert('Actualizando proyectos...');
}

// Initialize charts
function initializeChart() {
    const ctx = document.getElementById('utilization-chart');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                datasets: [{
                    label: 'Utilización (%)',
                    data: [17, 33, 50, 42, 50, 42, 33, 25, 25, 25, 17, 8],
                    borderColor: '#319795',
                    backgroundColor: 'rgba(49, 151, 149, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
}

function initializeFTEsPerMonthChart() {
    const ctx = document.getElementById('ftes-per-month-chart');
    if (ctx) {
        // Calculate FTEs per month based on resource data (1 FTE = 160 hours)
        const monthlyData = [
            { month: 'Ene', hours: 620, ftes: 3.88 }, // Juan(160) + María(140) + Carlos(160) + Ana(160)
            { month: 'Feb', hours: 560, ftes: 3.50 }, // Juan(120) + María(150) + Carlos(160) + Ana(130)
            { month: 'Mar', hours: 640, ftes: 4.00 }, // Juan(180) + María(160) + Carlos(140) + Ana(140)
            { month: 'Abr', hours: 600, ftes: 3.75 }, // Juan(160) + María(130) + Carlos(150) + Ana(160)
            { month: 'May', hours: 520, ftes: 3.25 }, // Juan(80) + María(160) + Carlos(160) + Ana(120)
            { month: 'Jun', hours: 640, ftes: 4.00 }, // Juan(160) + María(160) + Carlos(160) + Ana(160)
            { month: 'Jul', hours: 560, ftes: 3.50 }, // Juan(160) + María(80) + Carlos(160) + Ana(160)
            { month: 'Ago', hours: 520, ftes: 3.25 }, // Juan(40) + María(160) + Carlos(160) + Ana(160)
            { month: 'Sep', hours: 560, ftes: 3.50 }, // Juan(160) + María(160) + Carlos(160) + Ana(80)
            { month: 'Oct', hours: 640, ftes: 4.00 }, // Juan(160) + María(160) + Carlos(160) + Ana(160)
            { month: 'Nov', hours: 640, ftes: 4.00 }, // Juan(160) + María(160) + Carlos(160) + Ana(160)
            { month: 'Dic', hours: 640, ftes: 4.00 }  // Juan(160) + María(160) + Carlos(160) + Ana(160)
        ];

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.map(d => d.month),
                datasets: [{
                    label: 'FTEs',
                    data: monthlyData.map(d => d.ftes),
                    backgroundColor: '#319795',
                    borderColor: '#2c7a7b',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const monthData = monthlyData[context.dataIndex];
                                return `FTEs: ${monthData.ftes.toFixed(2)} (${monthData.hours}h)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        }
                    }
                }
            }
        });
    }
}

function initializeFTEsBySkillChart() {
    const ctx = document.getElementById('ftes-by-skill-chart');
    if (ctx) {
        // Calculate potential FTEs by skill and month
        // Juan: Cod, Ana, Dis (3 skills)
        // María: Dis, Con, Gen (3 skills)  
        // Carlos: PM, Ana, Gen (3 skills)
        // Ana: QA, Ana, Gen (3 skills)
        
        const skillData = {
            'Construcción': [1.0, 0.75, 1.13, 1.0, 0.5, 1.0, 1.0, 0.25, 1.0, 1.0, 1.0, 1.0], // Juan's capacity / 160
            'Análisis': [1.0, 0.75, 1.13, 1.0, 0.5, 1.0, 1.0, 0.25, 1.0, 1.0, 1.0, 1.0], // Juan + Carlos + Ana
            'Diseño': [1.88, 1.69, 2.0, 1.81, 1.5, 2.0, 1.5, 2.0, 2.0, 2.0, 2.0, 2.0], // Juan + María
            'PM': [1.0, 1.0, 0.88, 0.94, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], // Carlos
            'QA': [1.0, 0.81, 0.88, 1.0, 0.75, 1.0, 1.0, 1.0, 0.5, 1.0, 1.0, 1.0], // Ana
            'Conceptualización': [0.88, 0.94, 1.0, 0.81, 1.0, 1.0, 0.5, 1.0, 1.0, 1.0, 1.0, 1.0], // María
            'General': [2.69, 2.44, 2.88, 2.75, 2.25, 3.0, 2.5, 3.0, 2.5, 3.0, 3.0, 3.0] // María + Carlos + Ana
        };

        const colors = [
            '#319795', '#e53e3e', '#d69e2e', '#38a169', '#805ad5', '#dd6b20', '#3182ce'
        ];

        const datasets = Object.keys(skillData).map((skill, index) => ({
            label: skill,
            data: skillData[skill],
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            tension: 0.4,
            fill: false
        }));

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} FTEs`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 4,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        }
                    }
                }
            }
        });
    }
}

// Resource capacity editing function
function editResourceCapacity(resourceId, month) {
    alert(`Editando capacidad de ${resourceId} para ${month}`);
}

function initializeProjectsByDomainChart() {
    const ctx = document.getElementById('projects-by-domain-chart');
    if (ctx) {
        // Count projects by domain from the table data
        const domainData = {
            'Atención': 1,
            'Tecnología': 3,
            'Facturación y Cobros': 1,
            'Contratación': 1,
            'Operaciones': 1
        };

        const colors = ['#319795', '#e53e3e', '#d69e2e', '#38a169', '#805ad5'];

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(domainData),
                datasets: [{
                    data: Object.values(domainData),
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function initializeProjectsByPriorityChart() {
    const ctx = document.getElementById('projects-by-priority-chart');
    if (ctx) {
        // Count projects by priority from the table data
        const priorityData = {
            'Muy Alta': 2,
            'Alta': 2,
            'Media': 2,
            'Baja': 1
        };

        const colors = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169'];

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(priorityData),
                datasets: [{
                    data: Object.values(priorityData),
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function initializeProjectsByStatusChart() {
    const ctx = document.getElementById('projects-by-status-chart');
    if (ctx) {
        // Count projects by status from the table data, ordered by project lifecycle
        const statusData = {
            'Idea': 0,
            'Conceptualización': 0,
            'Diseño Detallado': 2,
            'Viabilidad': 0,
            'Desarrollo': 3,
            'Implantado': 0,
            'Finalizado': 2,
            'Cancelado': 0
        };

        const colors = ['#cbd5e0', '#a0aec0', '#d69e2e', '#ed8936', '#319795', '#38a169', '#48bb78', '#718096'];

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(statusData),
                datasets: [{
                    label: 'Proyectos',
                    data: Object.values(statusData),
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.parsed.x / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${context.parsed.x} proyectos (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Número de Proyectos'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Estado'
                        }
                    }
                }
            }
        });
    }
}

function initializeProjectsByTypeChart() {
    const ctx = document.getElementById('projects-by-type-chart');
    if (ctx) {
        // Count projects by type from the table data
        const typeData = {
            'Proyecto': 4,
            'Evolutivo': 3
        };

        const colors = ['#319795', '#805ad5'];

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(typeData),
                datasets: [{
                    data: Object.values(typeData),
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Project skill breakdown data structure
const projectSkillBreakdown = {
    'NC-249': {
        skills: {
            'Construcción': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 200, jul: 100, ago: 0, sep: 0, oct: 0, nov: 0, dic: 0 },
            'Análisis': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 80, jul: 40, ago: 0, sep: 0, oct: 0, nov: 0, dic: 0 },
            'QA': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 40, jul: 20, ago: 0, sep: 0, oct: 0, nov: 0, dic: 0 }
        }
    },
    'NC-15': {
        skills: {
            'Construcción': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 80, jul: 160, ago: 80, sep: 0, oct: 0, nov: 0, dic: 0 },
            'Análisis': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 50, jul: 100, ago: 50, sep: 0, oct: 0, nov: 0, dic: 0 },
            'Diseño': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 30, jul: 60, ago: 30, sep: 0, oct: 0, nov: 0, dic: 0 }
        }
    },
    'NC-16': {
        skills: {
            'Construcción': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 160, jul: 240, ago: 240, sep: 160, oct: 0, nov: 0, dic: 0 },
            'Análisis': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 100, jul: 150, ago: 150, sep: 100, oct: 0, nov: 0, dic: 0 },
            'Diseño': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 40, jul: 60, ago: 60, sep: 40, oct: 0, nov: 0, dic: 0 },
            'QA': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 20, jul: 30, ago: 30, sep: 20, oct: 0, nov: 0, dic: 0 }
        }
    },
    'NC-17': {
        skills: {
            'Construcción': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 80, jul: 160, ago: 0, sep: 0, oct: 0, nov: 0, dic: 0 },
            'Análisis': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 50, jul: 100, ago: 0, sep: 0, oct: 0, nov: 0, dic: 0 },
            'Diseño': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 30, jul: 60, ago: 0, sep: 0, oct: 0, nov: 0, dic: 0 }
        }
    },
    'NC-18': {
        skills: {
            'Construcción': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 80, jul: 80, ago: 160, sep: 0, oct: 0, nov: 0, dic: 0 },
            'Análisis': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 50, jul: 50, ago: 100, sep: 0, oct: 0, nov: 0, dic: 0 },
            'General': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 30, jul: 30, ago: 60, sep: 0, oct: 0, nov: 0, dic: 0 }
        }
    },
    'NC-19': {
        skills: {
            'Construcción': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 0, jul: 0, ago: 80, sep: 160, oct: 240, nov: 0, dic: 0 },
            'Análisis': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 0, jul: 0, ago: 50, sep: 100, oct: 150, nov: 0, dic: 0 },
            'QA': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 0, jul: 0, ago: 30, sep: 60, oct: 90, nov: 0, dic: 0 }
        }
    },
    'NC-20': {
        skills: {
            'Construcción': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 0, jul: 80, ago: 160, sep: 240, oct: 240, nov: 160, dic: 0 },
            'Análisis': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 0, jul: 50, ago: 100, sep: 150, oct: 150, nov: 100, dic: 0 },
            'Project Management': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 0, jul: 20, ago: 40, sep: 60, oct: 60, nov: 40, dic: 0 },
            'QA': { ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 0, jul: 10, ago: 20, sep: 30, oct: 30, nov: 20, dic: 0 }
        }
    }
};

// Track expanded projects
const expandedProjects = new Set();

// Toggle project skills breakdown
function toggleProjectSkills(projectId) {
    const expandIcon = document.querySelector(`[data-project="${projectId}"] .expand-icon`);
    const projectRow = document.querySelector(`[data-project="${projectId}"]`);
    
    if (expandedProjects.has(projectId)) {
        // Collapse - remove skill rows
        collapseProjectSkills(projectId);
        expandIcon.classList.remove('expanded');
        expandIcon.textContent = '+';
        expandedProjects.delete(projectId);
    } else {
        // Expand - add skill rows
        expandProjectSkills(projectId, projectRow);
        expandIcon.classList.add('expanded');
        expandIcon.textContent = '−';
        expandedProjects.add(projectId);
    }
}

// Expand project skills
function expandProjectSkills(projectId, projectRow) {
    const skillData = projectSkillBreakdown[projectId];
    if (!skillData) return;
    
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    
    // Create skill rows
    Object.keys(skillData.skills).forEach((skillName, index) => {
        const skillRow = document.createElement('tr');
        skillRow.className = 'skill-row';
        skillRow.setAttribute('data-project-skill', `${projectId}-${skillName}`);
        
        // Create skill name cell
        const skillNameCell = document.createElement('td');
        skillNameCell.className = 'project-name';
        skillNameCell.innerHTML = `<em>${skillName}</em>`;
        skillRow.appendChild(skillNameCell);
        
        // Create month cells
        months.forEach(month => {
            const cell = document.createElement('td');
            const hours = skillData.skills[skillName][month] || 0;
            
            if (hours > 0) {
                cell.innerHTML = `<span class="capacity-cell" title="${hours} horas">${hours}</span>`;
            } else {
                cell.innerHTML = `<span class="capacity-cell empty" title="0 horas">-</span>`;
            }
            
            skillRow.appendChild(cell);
        });
        
        // Insert after project row
        const nextSibling = projectRow.nextSibling;
        if (nextSibling) {
            projectRow.parentNode.insertBefore(skillRow, nextSibling);
        } else {
            projectRow.parentNode.appendChild(skillRow);
        }
        
        // Animate in
        setTimeout(() => {
            skillRow.classList.add('visible');
        }, index * 50); // Stagger animation
    });
}

// Collapse project skills
function collapseProjectSkills(projectId) {
    const skillRows = document.querySelectorAll(`[data-project-skill^="${projectId}-"]`);
    skillRows.forEach(row => {
        row.classList.remove('visible');
        setTimeout(() => {
            if (row.parentNode) {
                row.parentNode.removeChild(row);
            }
        }, 300); // Wait for animation to complete
    });
}

// Matrix tab indicators and charts
function updateMatrixIndicators() {
    // Get current month (July = index 6 for our data)
    const currentMonthIndex = 6; // July 2025
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const currentMonth = months[currentMonthIndex];
    
    // Calculate active projects for current month
    let activeProjects = 0;
    let totalHours = 0;
    
    Object.keys(projectSkillBreakdown).forEach(projectId => {
        const project = projectSkillBreakdown[projectId];
        let projectHours = 0;
        
        Object.keys(project.skills).forEach(skill => {
            projectHours += project.skills[skill][currentMonth] || 0;
        });
        
        if (projectHours > 0) {
            activeProjects++;
            totalHours += projectHours;
        }
    });
    
    // Update indicators
    document.getElementById('active-projects-count').textContent = activeProjects;
    document.getElementById('current-month-hours').textContent = totalHours;
    document.getElementById('current-month-ftes').textContent = (totalHours / 160).toFixed(1);
}

function initializeCommittedHoursChart() {
    const ctx = document.getElementById('committed-hours-chart');
    if (ctx) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        // Calculate committed hours per month from project data
        const committedHours = [0, 0, 0, 0, 0, 1120, 1600, 1440, 1120, 960, 320, 0];
        
        // Calculate available hours (4 resources * 160 hours each, adjusted for vacations/availability)
        const availableHours = [640, 560, 640, 600, 520, 640, 560, 520, 560, 640, 640, 640];
        
        // Calculate FTE lines
        const availableFTEs = availableHours.map(hours => hours / 160);
        const committedFTEs = committedHours.map(hours => hours / 160);
        const totalResources = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]; // 4 resources available

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Horas Comprometidas',
                        data: committedHours,
                        backgroundColor: 'rgba(49, 151, 149, 0.7)',
                        borderColor: '#319795',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Horas Disponibles',
                        data: availableHours,
                        backgroundColor: 'rgba(107, 114, 128, 0.3)',
                        borderColor: '#6b7280',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'FTEs Disponibles',
                        data: availableFTEs,
                        type: 'line',
                        borderColor: '#d97706',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointRadius: 4,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Recursos Totales',
                        data: totalResources,
                        type: 'line',
                        borderColor: '#dc2626',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label.includes('FTEs') || context.dataset.label.includes('Recursos')) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
                                }
                                return `${context.dataset.label}: ${context.parsed.y} horas`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Horas'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        max: 5,
                        title: {
                            display: true,
                            text: 'FTEs / Recursos'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }
}

function initializeSkillDistributionChart() {
    const ctx = document.getElementById('skill-distribution-chart');
    if (ctx) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthKeys = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        
        // Calculate skill distribution per month
        const skillTotals = {};
        const skillColors = {
            'Construcción': '#10b981',
            'Análisis': '#3b82f6',
            'Diseño': '#ec4899',
            'QA': '#8b5cf6',
            'Project Management': '#f59e0b',
            'General': '#6b7280'
        };
        
        // Initialize skill totals
        Object.keys(skillColors).forEach(skill => {
            skillTotals[skill] = new Array(12).fill(0);
        });
        
        // Sum up hours by skill for each month
        Object.keys(projectSkillBreakdown).forEach(projectId => {
            const project = projectSkillBreakdown[projectId];
            Object.keys(project.skills).forEach(skillName => {
                monthKeys.forEach((monthKey, index) => {
                    const hours = project.skills[skillName][monthKey] || 0;
                    if (skillTotals[skillName]) {
                        skillTotals[skillName][index] += hours;
                    }
                });
            });
        });
        
        // Create datasets for stacked bar chart
        const datasets = Object.keys(skillTotals).map(skill => ({
            label: skill,
            data: skillTotals[skill],
            backgroundColor: skillColors[skill],
            borderColor: skillColors[skill],
            borderWidth: 1
        }));

        // Add horizontal line for total resources capacity (4 resources * 160 hours = 640 hours)
        const totalResourcesCapacity = [640, 640, 640, 640, 640, 640, 640, 640, 640, 640, 640, 640];
        datasets.push({
            label: 'Capacidad Total Recursos',
            data: totalResourcesCapacity,
            type: 'line',
            borderColor: '#dc2626',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 4,
            fill: false
        });
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label === 'Capacidad Total Recursos') {
                                    return `${context.dataset.label}: ${context.parsed.y} horas`;
                                }
                                return `${context.dataset.label}: ${context.parsed.y} horas`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Horas'
                        }
                    }
                }
            }
        });
    }
}

// New charts for Vista General tab
function initializeCapacityDemandChart() {
    const ctx = document.getElementById('capacity-demand-chart');
    if (ctx) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        // Capacity data (total available hours per month)
        const capacityData = [640, 560, 640, 600, 520, 640, 560, 520, 560, 640, 640, 640];
        
        // Demand data (committed hours from projects)
        const demandData = [0, 0, 0, 0, 0, 1120, 1600, 1440, 1120, 960, 320, 0];
        
        // Calculate overload (demand exceeding capacity)
        const overloadData = demandData.map((demand, index) => {
            const capacity = capacityData[index];
            return demand > capacity ? demand - capacity : 0;
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Capacidad Disponible',
                        data: capacityData,
                        borderColor: '#4299e1',
                        backgroundColor: 'rgba(66, 153, 225, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Demanda Proyectada',
                        data: demandData,
                        borderColor: '#f6ad55',
                        backgroundColor: 'rgba(246, 173, 85, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Sobrecarga',
                        data: overloadData,
                        borderColor: '#f56565',
                        backgroundColor: 'rgba(245, 101, 101, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Legend is shown separately in HTML
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} horas`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Horas'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
}

function initializeOverviewSkillsDistributionChart() {
    const ctx = document.getElementById('skills-distribution-chart');
    if (ctx) {
        // Skills distribution data for overview (different from matrix tab)
        const skillsData = {
            'Desarrollo': 35,
            'Análisis': 25,
            'QA': 15,
            'PM': 12,
            'Diseño': 13
        };

        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(skillsData),
                datasets: [{
                    data: Object.values(skillsData),
                    backgroundColor: colors,
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Legend is shown separately in HTML
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
}

// Alert management functions
function dismissAlert(alertElement) {
    alertElement.style.opacity = '0';
    alertElement.style.transform = 'translateX(-100%)';
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.parentNode.removeChild(alertElement);
        }
    }, 300);
}

function resolveAlert(alertId) {
    alert(`Resolviendo alerta: ${alertId}`);
    // In a real implementation, this would update the alert status
}

function viewAlertDetails(alertId) {
    alert(`Mostrando detalles de alerta: ${alertId}`);
    // In a real implementation, this would open a detailed view
}

function reassignResource(resourceId, projectId) {
    alert(`Reasignando recurso ${resourceId} del proyecto ${projectId}`);
    // In a real implementation, this would open a reassignment dialog
}

function prioritizeProject(projectId) {
    alert(`Priorizando proyecto: ${projectId}`);
    // In a real implementation, this would open a priority management dialog
}

function planCapacity() {
    alert('Abriendo planificador de capacidad...');
    // In a real implementation, this would open capacity planning tools
}

function analyzeCapacity() {
    alert('Iniciando análisis de capacidad...');
    // In a real implementation, this would run capacity analysis
}

function hireResource(skillType) {
    alert(`Iniciando proceso de contratación para: ${skillType}`);
    // In a real implementation, this would open hiring workflow
}

function trainResource(skillType) {
    alert(`Iniciando programa de formación en: ${skillType}`);
    // In a real implementation, this would open training management
}

function optimizeAssignments() {
    alert('Optimizando asignaciones de recursos...');
    // In a real implementation, this would run optimization algorithms
}

function generateReport() {
    alert('Generando reporte de capacidad...');
    // In a real implementation, this would generate and download a report
}

function openScenarioSimulator() {
    alert('Abriendo simulador de escenarios...');
    // In a real implementation, this would open scenario planning tools
}

function exportDashboard() {
    alert('Exportando dashboard...');
    // In a real implementation, this would export dashboard data/images
}

// Control panel functions
function updateAnalysisPeriod(period) {
    console.log(`Actualizando período de análisis: ${period}`);
    // In a real implementation, this would update all charts and data
}

function updatePriorityFilter(priority) {
    console.log(`Filtrando por prioridad: ${priority}`);
    // In a real implementation, this would filter displayed data
}

function updateCapacityView(view) {
    console.log(`Cambiando vista de capacidad: ${view}`);
    // In a real implementation, this would change the visualization mode
}

function toggleAutoAlerts(enabled) {
    console.log(`Alertas automáticas: ${enabled ? 'activadas' : 'desactivadas'}`);
    // In a real implementation, this would enable/disable automatic alerts
}

// Initialize overview page charts (replicated from Matrix tab)
function initializeOverviewCommittedHoursChart() {
    const ctx = document.getElementById('overview-committed-hours-chart');
    if (ctx) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        // Calculate committed hours per month from project data
        const committedHours = [0, 0, 0, 0, 0, 1120, 1600, 1440, 1120, 960, 320, 0];
        
        // Calculate available hours (4 resources * 160 hours each, adjusted for vacations/availability)
        const availableHours = [640, 560, 640, 600, 520, 640, 560, 520, 560, 640, 640, 640];
        
        // Calculate FTE lines
        const availableFTEs = availableHours.map(hours => hours / 160);
        const totalResources = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]; // 4 resources available

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Horas Comprometidas',
                        data: committedHours,
                        backgroundColor: 'rgba(49, 151, 149, 0.7)',
                        borderColor: '#319795',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Horas Disponibles',
                        data: availableHours,
                        backgroundColor: 'rgba(107, 114, 128, 0.3)',
                        borderColor: '#6b7280',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'FTEs Disponibles',
                        data: availableFTEs,
                        type: 'line',
                        borderColor: '#d97706',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointRadius: 4,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Recursos Totales',
                        data: totalResources,
                        type: 'line',
                        borderColor: '#dc2626',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label.includes('FTEs') || context.dataset.label.includes('Recursos')) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
                                }
                                return `${context.dataset.label}: ${context.parsed.y} horas`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Horas'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        max: 5,
                        title: {
                            display: true,
                            text: 'FTEs / Recursos'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }
}

function initializeOverviewSkillDistributionChart() {
    const ctx = document.getElementById('overview-skill-distribution-chart');
    if (ctx) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthKeys = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        
        // Calculate skill distribution per month
        const skillTotals = {};
        const skillColors = {
            'Construcción': '#10b981',
            'Análisis': '#3b82f6',
            'Diseño': '#ec4899',
            'QA': '#8b5cf6',
            'Project Management': '#f59e0b',
            'General': '#6b7280'
        };
        
        // Initialize skill totals
        Object.keys(skillColors).forEach(skill => {
            skillTotals[skill] = new Array(12).fill(0);
        });
        
        // Sum up hours by skill for each month
        Object.keys(projectSkillBreakdown).forEach(projectId => {
            const project = projectSkillBreakdown[projectId];
            Object.keys(project.skills).forEach(skillName => {
                monthKeys.forEach((monthKey, index) => {
                    const hours = project.skills[skillName][monthKey] || 0;
                    if (skillTotals[skillName]) {
                        skillTotals[skillName][index] += hours;
                    }
                });
            });
        });
        
        // Create datasets for stacked bar chart
        const datasets = Object.keys(skillTotals).map(skill => ({
            label: skill,
            data: skillTotals[skill],
            backgroundColor: skillColors[skill],
            borderColor: skillColors[skill],
            borderWidth: 1
        }));

        // Add horizontal line for total resources capacity (4 resources * 160 hours = 640 hours)
        const totalResourcesCapacity = [640, 640, 640, 640, 640, 640, 640, 640, 640, 640, 640, 640];
        datasets.push({
            label: 'Capacidad Total Recursos',
            data: totalResourcesCapacity,
            type: 'line',
            borderColor: '#dc2626',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 4,
            fill: false
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label === 'Capacidad Total Recursos') {
                                    return `${context.dataset.label}: ${context.parsed.y} horas`;
                                }
                                return `${context.dataset.label}: ${context.parsed.y} horas`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Horas'
                        }
                    }
                }
            }
        });
    }
}

// Function to populate Top 5 Projects table
function populateTopProjectsTable() {
    const tableBody = document.getElementById('top-projects-table-body');
    if (!tableBody) return;
    
    // Project metadata (matching projectSkillBreakdown IDs)
    const projectMetadata = {
        'NC-249': {
            title: 'Migración Sistema Legacy',
            description: 'Migración completa del sistema legacy a nueva arquitectura cloud',
            domain: 'Tecnología',
            priority: 'muy-alta',
            status: 'desarrollo'
        },
        'NC-15': {
            title: 'Portal Cliente Web',
            description: 'Desarrollo de nuevo portal web para clientes con funcionalidades avanzadas',
            domain: 'Atención',
            priority: 'alta',
            status: 'desarrollo'
        },
        'NC-16': {
            title: 'Sistema Facturación Automática',
            description: 'Implementación de sistema automatizado de facturación y cobros',
            domain: 'Facturación y Cobros',
            priority: 'muy-alta',
            status: 'desarrollo'
        },
        'NC-17': {
            title: 'App Mobile Clientes',
            description: 'Aplicación móvil nativa para iOS y Android',
            domain: 'Atención',
            priority: 'alta',
            status: 'diseño-detallado'
        },
        'NC-18': {
            title: 'Integración CRM',
            description: 'Integración con sistema CRM corporativo',
            domain: 'Tecnología',
            priority: 'media',
            status: 'desarrollo'
        },
        'NC-19': {
            title: 'Plataforma Analytics',
            description: 'Plataforma de análisis de datos y reporting avanzado',
            domain: 'Tecnología',
            priority: 'media',
            status: 'diseño-detallado'
        },
        'NC-20': {
            title: 'Sistema Gestión Contratos',
            description: 'Sistema integral de gestión y seguimiento de contratos',
            domain: 'Contratación',
            priority: 'alta',
            status: 'desarrollo'
        }
    };
    
    // Calculate total hours and hours incurred for each project
    const projectsWithHours = [];
    const monthKeys = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    
    Object.keys(projectSkillBreakdown).forEach(projectId => {
        const project = projectSkillBreakdown[projectId];
        const metadata = projectMetadata[projectId];
        
        if (!metadata) return;
        
        // Calculate total hours across all skills and months
        let totalHours = 0;
        Object.keys(project.skills).forEach(skillName => {
            monthKeys.forEach(month => {
                totalHours += project.skills[skillName][month] || 0;
            });
        });
        
        // Calculate hours incurred (simulate realistic progress: 40-75% of total hours)
        // Projects with more hours tend to have lower completion percentage
        const progressPercentage = totalHours > 1000 ? 0.45 : (totalHours > 500 ? 0.60 : 0.70);
        const hoursIncurred = Math.round(totalHours * progressPercentage);
        
        projectsWithHours.push({
            id: projectId,
            title: metadata.title,
            description: metadata.description,
            domain: metadata.domain,
            priority: metadata.priority,
            totalHours: totalHours,
            hoursIncurred: hoursIncurred,
            status: metadata.status
        });
    });
    
    // Sort by total hours descending and take top 5
    projectsWithHours.sort((a, b) => b.totalHours - a.totalHours);
    const top5Projects = projectsWithHours.slice(0, 5);
    
    // Clear existing table content
    tableBody.innerHTML = '';
    
    // Populate table with top 5 projects
    top5Projects.forEach(project => {
        const row = document.createElement('tr');
        
        // Priority badge styling
        const priorityClass = project.priority;
        const priorityText = project.priority === 'muy-alta' ? 'Muy Alta' : 
                            project.priority === 'alta' ? 'Alta' : 
                            project.priority === 'media' ? 'Media' : 'Baja';
        
        // Status badge styling
        const statusClass = project.status;
        const statusText = project.status === 'desarrollo' ? 'Desarrollo' : 
                          project.status === 'diseño-detallado' ? 'Diseño Detallado' : 
                          project.status === 'viabilidad' ? 'Viabilidad' : 
                          project.status === 'concepto' ? 'Concepto' : 
                          project.status === 'implantado' ? 'Implantado' : 
                          project.status === 'finalizado' ? 'Finalizado' : 'Cancelado';
        
        row.innerHTML = `
            <td style="text-align: left;"><strong>${project.id}</strong></td>
            <td style="text-align: left;">${project.title}</td>
            <td style="text-align: left;">${project.description}</td>
            <td style="text-align: left;">${project.domain}</td>
            <td style="text-align: center;">
                <span class="priority-badge ${priorityClass}">${priorityText}</span>
            </td>
            <td style="text-align: right;"><strong>${project.totalHours.toLocaleString()}</strong></td>
            <td style="text-align: right;">${project.hoursIncurred.toLocaleString()}</td>
            <td style="text-align: center;">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize existing charts
    initializeChart();
    initializeFTEsPerMonthChart();
    initializeFTEsBySkillChart();
    initializeProjectsByDomainChart();
    initializeProjectsByPriorityChart();
    initializeProjectsByStatusChart();
    
    // Initialize matrix tab charts and indicators
    updateMatrixIndicators();
    initializeCommittedHoursChart();
    initializeSkillDistributionChart();
    
    // Initialize Vista General overview charts (replicated from Matrix tab)
    initializeOverviewCommittedHoursChart();
    initializeOverviewSkillDistributionChart();
    
    // Initialize new Vista General charts
    initializeCapacityDemandChart();
    initializeOverviewSkillsDistributionChart();
    
    // Populate Top 5 Projects table
    populateTopProjectsTable();
    
    // Add event listeners for control panel
    const periodSelect = document.querySelector('.quick-controls select:nth-of-type(1)');
    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => updateAnalysisPeriod(e.target.value));
    }
    
    const prioritySelect = document.querySelector('.quick-controls select:nth-of-type(2)');
    if (prioritySelect) {
        prioritySelect.addEventListener('change', (e) => updatePriorityFilter(e.target.value));
    }
    
    const viewSelect = document.querySelector('.quick-controls select:nth-of-type(3)');
    if (viewSelect) {
        viewSelect.addEventListener('change', (e) => updateCapacityView(e.target.value));
    }
    
    const autoAlertsToggle = document.getElementById('auto-alerts');
    if (autoAlertsToggle) {
        autoAlertsToggle.addEventListener('change', (e) => toggleAutoAlerts(e.target.checked));
    }
    
    // Add click event listeners for modal close
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal') || e.target.classList.contains('modal-overlay')) {
            hideAddResourceModal();
        }
    });
    
    // Add escape key listener for modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAddResourceModal();
        }
    });
});
