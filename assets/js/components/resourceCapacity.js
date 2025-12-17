/**
 * Resource Capacity Management Module
 * Handles loading and displaying resource capacity data dynamically from API
 */

import { API_CONFIG } from '../config/data.js';

// Global state
let capacityData = null;
let currentYear = new Date().getFullYear();

/**
 * Initialize resource capacity management
 */
export function initializeResourceCapacity() {
    console.log('Initializing Resource Capacity Management...');
    
    // Load capacity data when the capacity tab is opened
    document.addEventListener('click', function(e) {
        const tabButton = e.target.closest('.tab-button');
        if (tabButton && tabButton.getAttribute('data-tab') === 'resources-tab') {
            console.log('Capacity tab opened, loading capacity data...');
            loadCapacityData();
        }
    });
    
    console.log('Resource Capacity Management initialized');
}

/**
 * Load capacity overview data from API
 */
async function loadCapacityData() {
    try {
        // Get authentication tokens
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            console.warn('No authentication tokens found');
            showErrorMessage('No se encontraron credenciales de autenticación');
            return;
        }
        
        console.log('Loading capacity data from API...');
        console.log('User team:', userTeam);
        console.log('Year:', currentYear);
        
        // Fetch capacity overview
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAPACITY}/overview?year=${currentYear}`, 
            {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            }
        );
        
        if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
            throw new Error('Error al cargar datos de capacidad');
        }
        
        const data = await response.json();
        console.log('Capacity data received:', data);
        
        // Store data globally
        capacityData = data.data || data;
        
        // Update all UI components
        updateKPIs(capacityData.kpis);
        updateCharts(capacityData.charts);
        updateCapacityMatrix(capacityData.resources, capacityData.currentMonth);
        
        console.log('Capacity view updated successfully');
        
    } catch (error) {
        console.error('Error loading capacity data:', error);
        showErrorMessage('Error al cargar datos de capacidad. Por favor, intenta de nuevo.');
    }
}

/**
 * Update KPIs section
 */
function updateKPIs(kpis) {
    if (!kpis) return;
    
    // Total resources
    const totalResourcesEl = document.querySelector('[data-kpi="total-resources"]');
    if (totalResourcesEl) {
        totalResourcesEl.textContent = kpis.totalResources || 0;
    }
    
    // Resources with assignment
    const withAssignmentEl = document.querySelector('[data-kpi="with-assignment"]');
    if (withAssignmentEl) {
        withAssignmentEl.textContent = kpis.resourcesWithAssignment || 0;
    }
    
    // Resources without assignment
    const withoutAssignmentEl = document.querySelector('[data-kpi="without-assignment"]');
    if (withoutAssignmentEl) {
        withoutAssignmentEl.textContent = kpis.resourcesWithoutAssignment || 0;
    }
    
    // Average utilization - current month
    const currentUtilizationEl = document.querySelector('[data-kpi="current-utilization"]');
    if (currentUtilizationEl) {
        currentUtilizationEl.textContent = `${kpis.avgUtilization?.current || 0}%`;
    }
    
    // Average utilization - future
    const futureUtilizationEl = document.querySelector('[data-kpi="future-utilization"]');
    if (futureUtilizationEl) {
        futureUtilizationEl.textContent = `${kpis.avgUtilization?.future || 0}%`;
    }
    
    console.log('KPIs updated');
}

/**
 * Update charts section
 */
function updateCharts(charts) {
    if (!charts) return;
    
    // Update monthly comparison chart (Horas Comprometidas vs Disponibles)
    updateMonthlyComparisonChart(charts.monthlyComparison);
    
    // Update skills availability chart (Horas potenciales disponibles por perfil)
    updateSkillsAvailabilityChart(charts.skillsAvailability);
    
    console.log('Charts updated');
}

/**
 * Update monthly comparison chart
 */
function updateMonthlyComparisonChart(monthlyData) {
    const chartCanvas = document.getElementById('monthly-comparison-chart');
    if (!chartCanvas || !monthlyData) return;
    
    const ctx = chartCanvas.getContext('2d');
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Destroy existing chart if it exists
    if (window.monthlyComparisonChart) {
        window.monthlyComparisonChart.destroy();
    }
    
    window.monthlyComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthNames,
            datasets: [
                {
                    label: 'Horas Comprometidas',
                    data: monthlyData.map(m => m.committedHours),
                    backgroundColor: '#6b7280',
                    borderColor: '#4b5563',
                    borderWidth: 1
                },
                {
                    label: 'Horas Disponibles',
                    data: monthlyData.map(m => m.availableHours),
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Horas Comprometidas vs Disponibles'
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
            }
        }
    });
}

/**
 * Update skills availability chart
 */
function updateSkillsAvailabilityChart(skillsData) {
    const chartCanvas = document.getElementById('skills-availability-chart');
    if (!chartCanvas || !skillsData) return;
    
    const ctx = chartCanvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.skillsAvailabilityChart) {
        window.skillsAvailabilityChart.destroy();
    }
    
    window.skillsAvailabilityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: skillsData.map(s => s.skill),
            datasets: [
                {
                    label: 'Mes Actual',
                    data: skillsData.map(s => s.currentMonth),
                    backgroundColor: '#059669',
                    borderColor: '#047857',
                    borderWidth: 1
                },
                {
                    label: 'Meses Futuros',
                    data: skillsData.map(s => s.futureMonths),
                    backgroundColor: '#86efac',
                    borderColor: '#4ade80',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Horas Potenciales Disponibles por Perfil'
                }
            },
            scales: {
                x: {
                    stacked: true,
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

/**
 * Update capacity matrix table
 */
function updateCapacityMatrix(resources, currentMonth) {
    const tableBody = document.getElementById('capacity-table-body');
    if (!tableBody) {
        console.warn('Capacity table body not found');
        return;
    }
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Check if there are no resources
    if (!resources || resources.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="16" style="text-align: center; padding: 2rem; color: #6b7280;">
                No hay recursos disponibles para tu equipo.
            </td>
        `;
        tableBody.appendChild(row);
        console.log('No resources to display');
        return;
    }
    
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Populate table with resources
    resources.forEach(resource => {
        // Create main resource row
        const row = document.createElement('tr');
        row.className = 'resource-row';
        row.setAttribute('data-resource-id', resource.id);
        
        // Create expand icon cell
        const expandTd = document.createElement('td');
        expandTd.style.textAlign = 'center';
        const expandIcon = document.createElement('span');
        expandIcon.className = 'expand-icon';
        expandIcon.setAttribute('data-resource', resource.id);
        expandIcon.style.cursor = 'pointer';
        expandIcon.style.fontWeight = 'bold';
        expandIcon.style.fontSize = '1.2em';
        expandIcon.textContent = '+';
        expandTd.appendChild(expandIcon);
        row.appendChild(expandTd);
        
        // Create resource name cell
        const nameTd = document.createElement('td');
        nameTd.style.textAlign = 'left';
        const nameStrong = document.createElement('strong');
        nameStrong.textContent = resource.name;
        nameTd.appendChild(nameStrong);
        row.appendChild(nameTd);
        
        // Create utilization cell
        const utilizationTd = document.createElement('td');
        utilizationTd.style.textAlign = 'center';
        utilizationTd.textContent = `${resource.avgUtilization}%`;
        row.appendChild(utilizationTd);
        
        // Create skills cell
        const skillsTd = document.createElement('td');
        skillsTd.style.textAlign = 'left';
        if (resource.skills && resource.skills.length > 0) {
            resource.skills.forEach(skill => {
                const abbr = getSkillAbbreviation(skill.name);
                const badge = document.createElement('span');
                badge.className = 'skill-badge';
                badge.title = skill.name;
                badge.textContent = abbr;
                skillsTd.appendChild(badge);
                skillsTd.appendChild(document.createTextNode(' '));
            });
        } else {
            skillsTd.textContent = '-';
        }
        row.appendChild(skillsTd);
        
        // Create capacity cells for each month
        resource.monthlyData.forEach((monthData, index) => {
            const month = index + 1;
            const isCurrentMonth = month === currentMonth;
            let bgColor = getUtilizationColor(monthData.utilizationRate);
            
            // Darken background for current month
            if (isCurrentMonth) {
                bgColor = darkenColor(bgColor);
            }
            
            const capacityTd = document.createElement('td');
            capacityTd.className = 'capacity-cell';
            capacityTd.setAttribute('data-resource', resource.id);
            capacityTd.setAttribute('data-month', month);
            capacityTd.style.textAlign = 'center';
            capacityTd.style.backgroundColor = bgColor;
            
            const committedDiv = document.createElement('div');
            committedDiv.style.fontSize = '0.9em';
            committedDiv.style.fontWeight = 'bold';
            committedDiv.textContent = monthData.committedHours;
            
            const availableDiv = document.createElement('div');
            availableDiv.style.fontSize = '0.75em';
            availableDiv.style.color = '#059669';
            availableDiv.textContent = `(${monthData.availableHours})`;
            
            capacityTd.appendChild(committedDiv);
            capacityTd.appendChild(availableDiv);
            row.appendChild(capacityTd);
        });
        
        tableBody.appendChild(row);
        
        // Create project assignment rows (initially hidden)
        const projectsMap = new Map();
        resource.monthlyData.forEach(monthData => {
            monthData.assignments.forEach(assignment => {
                const key = assignment.projectCode;
                if (!projectsMap.has(key)) {
                    projectsMap.set(key, {
                        code: assignment.projectCode,
                        title: assignment.projectTitle,
                        type: assignment.projectType,
                        monthlyHours: new Array(12).fill(0)
                    });
                }
                projectsMap.get(key).monthlyHours[monthData.month - 1] += assignment.hours;
            });
        });
        
        // Add project rows
        projectsMap.forEach(project => {
            const projectRow = document.createElement('tr');
            projectRow.className = 'project-row';
            projectRow.setAttribute('data-resource', resource.id);
            projectRow.style.display = 'none';
            projectRow.style.backgroundColor = '#f9fafb';
            
            let projectCells = `
                <td></td>
                <td colspan="2" style="text-align: left; padding-left: 2rem; font-style: italic;">
                    ${project.code} - ${project.title}
                </td>
                <td style="text-align: center; font-size: 0.8em;">${project.type || '-'}</td>
            `;
            
            // Add monthly hours for this project
            project.monthlyHours.forEach((hours, index) => {
                const month = index + 1;
                const isCurrentMonth = month === currentMonth;
                const bgStyle = isCurrentMonth ? 'background-color: #d1d5db;' : '';
                projectCells += `
                    <td style="text-align: center; font-size: 0.85em; ${bgStyle}">
                        ${hours > 0 ? hours : '-'}
                    </td>
                `;
            });
            
            projectRow.innerHTML = projectCells;
            tableBody.appendChild(projectRow);
        });
    });
    
    // Add event listeners for expand icons
    addExpandIconListeners();
    
    console.log(`Capacity matrix updated with ${resources.length} resources`);
}

/**
 * Get skill abbreviation
 */
function getSkillAbbreviation(skillName) {
    const abbreviations = {
        'Project Management': 'PM',
        'Análisis': 'Ana',
        'Diseño': 'Dis',
        'Construcción': 'Cons',
        'QA': 'QA',
        'General': 'Gen'
    };
    return abbreviations[skillName] || skillName.substring(0, 3);
}

/**
 * Get background color based on utilization rate
 */
function getUtilizationColor(utilizationRate) {
    if (utilizationRate === 0) return '#ffffff';
    if (utilizationRate < 50) return '#d1fae5'; // Light green
    if (utilizationRate < 75) return '#fef3c7'; // Light yellow
    if (utilizationRate < 100) return '#fed7aa'; // Light orange
    return '#fecaca'; // Light red
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex) {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Darken by 20%
    const factor = 0.8;
    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Add event listeners for expand/collapse icons
 */
function addExpandIconListeners() {
    const expandIcons = document.querySelectorAll('.expand-icon[data-resource]');
    
    expandIcons.forEach(icon => {
        // Remove any existing listeners to avoid duplicates
        icon.replaceWith(icon.cloneNode(true));
    });
    
    // Re-query after cloning
    const newExpandIcons = document.querySelectorAll('.expand-icon[data-resource]');
    
    newExpandIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const resourceId = this.getAttribute('data-resource');
            toggleResourceProjects(resourceId, this);
        });
    });
}

/**
 * Toggle visibility of project rows for a resource
 */
function toggleResourceProjects(resourceId, expandIcon) {
    // Find all project rows for this resource
    const projectRows = document.querySelectorAll(`.project-row[data-resource="${resourceId}"]`);
    
    if (projectRows.length === 0) {
        console.log(`No project rows found for resource ${resourceId}`);
        return;
    }
    
    // Check current state (if first row is hidden, we want to show all)
    const isHidden = projectRows[0].style.display === 'none';
    
    // Toggle visibility
    projectRows.forEach(row => {
        row.style.display = isHidden ? 'table-row' : 'none';
    });
    
    // Toggle icon
    expandIcon.textContent = isHidden ? '−' : '+';
    
    console.log(`Toggled projects for resource ${resourceId}: ${isHidden ? 'expanded' : 'collapsed'}`);
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
    console.error(message);
    alert(message);
}

/**
 * Export function to reload capacity data (can be called from other modules)
 */
export function reloadCapacityData() {
    loadCapacityData();
}
