// Charts Initialization Component

import { projectSkillBreakdown, monthKeys, monthLabels } from '../config/data.js';
import { formatNumber } from '../utils/helpers.js';

/**
 * Initialize all charts in the application
 */
export function initializeAllCharts() {
    // Overview tab charts
    initializeOverviewCommittedHoursChart();
    initializeOverviewSkillDistributionChart();
    initializeOverviewCapacityByProfileChart();
    
    // Projects tab charts
    initializeProjectsByStatusChart();
    initializeProjectsByDomainChart();
    initializeProjectsByPriorityChart();
    
    // Matrix tab charts
    initializeMatrixCommittedHoursChart();
    initializeCommittedHoursChart();
    initializeSkillDistributionChart();
    initializeMatrixHoursByTypeChart();
    initializeMatrixHoursByDomainChart();
    
    // Resources tab charts
    initializeResourcesCommittedHoursChart();
    initializeResourcesHoursBySkillChart();
    
    console.log('All charts initialized');
}

/**
 * Initialize Overview Committed Hours Chart
 */
function initializeOverviewCommittedHoursChart() {
    const ctx = document.getElementById('overview-committed-hours-chart');
    if (!ctx) return;
    
    const committedHours = calculateCommittedHoursByMonth();
    const horasProyectos = committedHours.map(hours => Math.round(hours * 0.8));
    const horasEvolutivos = committedHours.map(hours => Math.round(hours * 0.2));
    const availableHours = [1750, 1720, 1760, 1740, 1700, 1780, 1750, 1730, 1760, 1770, 1750, 1740];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Horas Comprometidas Proyectos',
                    data: horasProyectos,
                    backgroundColor: 'rgba(49, 151, 149, 0.8)',
                    borderColor: '#319795',
                    borderWidth: 1,
                    stack: 'comprometidas',
                    order: 2
                },
                {
                    label: 'Horas Comprometidas Evolutivos',
                    data: horasEvolutivos,
                    backgroundColor: 'rgba(49, 151, 149, 0.4)',
                    borderColor: '#4db8b5',
                    borderWidth: 1,
                    stack: 'comprometidas',
                    order: 2
                },
                {
                    label: 'Capacidad Real Disponible',
                    data: availableHours,
                    type: 'line',
                    borderColor: '#dc2626',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 4,
                    order: 1
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
                    labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatNumber(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { stacked: true },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    stacked: true,
                    title: { display: true, text: 'Horas' },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize Overview Skill Distribution Chart
 */
function initializeOverviewSkillDistributionChart() {
    const ctx = document.getElementById('overview-skill-distribution-chart');
    if (!ctx) return;
    
    const skillTotals = calculateSkillTotalsByMonth();
    const skillColors = {
        'Construcción': '#4db6ac',
        'Análisis': '#64b5f6',
        'Diseño': '#ffb74d',
        'QA': '#81c784',
        'Project Management': '#ba68c8',
        'General': '#90a4ae'
    };
    
    const datasets = Object.keys(skillTotals).map(skill => ({
        label: skill,
        data: skillTotals[skill],
        backgroundColor: skillColors[skill],
        borderColor: skillColors[skill],
        borderWidth: 1,
        stack: 'skills',
        order: 2
    }));
    
    // Add the red capacity line
    const availableHours = [1750, 1720, 1760, 1740, 1700, 1780, 1750, 1730, 1760, 1770, 1750, 1740];
    datasets.push({
        label: 'Capacidad Real Disponible',
        data: availableHours,
        type: 'line',
        borderColor: '#dc2626',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 4,
        order: 1
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatNumber(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: { display: true, text: 'Horas' },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize Overview Capacity by Profile Chart
 */
function initializeOverviewCapacityByProfileChart() {
    const ctx = document.getElementById('overview-capacity-by-profile-chart');
    if (!ctx) return;
    
    const profiles = ['Project Management', 'Análisis', 'Diseño', 'Construcción', 'QA', 'General'];
    const currentMonth = 'jul';
    
    const committedHours = calculateCommittedHoursByProfile(currentMonth);
    const horasProyectos = profiles.map(profile => Math.round(committedHours[profile] * 0.8));
    const horasEvolutivos = profiles.map(profile => Math.round(committedHours[profile] * 0.2));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: profiles,
            datasets: [
                {
                    label: 'Horas Comprometidas Proyectos',
                    data: horasProyectos,
                    backgroundColor: 'rgba(49, 151, 149, 0.8)',
                    borderColor: '#319795',
                    borderWidth: 1,
                    stack: 'comprometidas'
                },
                {
                    label: 'Horas Comprometidas Evolutivos',
                    data: horasEvolutivos,
                    backgroundColor: 'rgba(49, 151, 149, 0.4)',
                    borderColor: '#4db8b5',
                    borderWidth: 1,
                    stack: 'comprometidas'
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
                    labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatNumber(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { stacked: true },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    title: { display: true, text: 'Horas' },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize Projects by Status Chart
 */
function initializeProjectsByStatusChart() {
    const ctx = document.getElementById('projects-by-status-chart');
    if (!ctx) return;
    
    const statusData = {
        'Idea': 8, 'Conceptualización': 5, 'Viabilidad': 4,
        'Diseño Detallado': 3, 'Desarrollo': 2, 'Implantado': 1, 'Finalizado': 1
    };
    
    const labels = Object.keys(statusData);
    const values = Object.values(statusData);
    const total = values.reduce((a, b) => a + b, 0);
    
    const funnelData = [];
    let cumulative = total;
    values.forEach(value => {
        funnelData.push(cumulative);
        cumulative -= value;
    });
    
    const colors = ['#e0f2f1', '#b2dfdb', '#80cbc4', '#4db6ac', '#26a69a', '#009688', '#00796b'];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Proyectos en Fase',
                data: funnelData,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    beginAtZero: true,
                    max: total + 1,
                    title: { display: true, text: 'Proyectos Acumulados' }
                }
            }
        }
    });
}

/**
 * Initialize Projects by Domain Chart
 */
function initializeProjectsByDomainChart() {
    const ctx = document.getElementById('projects-by-domain-chart');
    if (!ctx) return;
    
    const domainData = {
        'Atención': 1, 'Tecnología': 3, 'Facturación y Cobros': 1,
        'Contratación': 1, 'Operaciones': 1
    };
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(domainData),
            datasets: [{
                data: Object.values(domainData),
                backgroundColor: ['#4db6ac', '#64b5f6', '#ffb74d', '#81c784', '#ba68c8'],
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
                    labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                }
            }
        }
    });
}

/**
 * Initialize Projects by Priority Chart
 */
function initializeProjectsByPriorityChart() {
    const ctx = document.getElementById('projects-by-priority-chart');
    if (!ctx) return;
    
    const priorityData = { 'Muy Alta': 2, 'Alta': 2, 'Media': 2, 'Baja': 1 };
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(priorityData),
            datasets: [{
                data: Object.values(priorityData),
                backgroundColor: ['#ef5350', '#ff9800', '#ffca28', '#66bb6a'],
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
                    labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                }
            }
        }
    });
}

/**
 * Initialize Matrix Committed Hours Chart (new chart in Matrix tab)
 */
function initializeMatrixCommittedHoursChart() {
    const ctx = document.getElementById('matrix-committed-hours-chart');
    if (!ctx) return;
    
    const committedHours = calculateCommittedHoursByMonth();
    const horasProyectos = committedHours.map(hours => Math.round(hours * 0.8));
    const horasEvolutivos = committedHours.map(hours => Math.round(hours * 0.2));
    const availableHours = [1750, 1720, 1760, 1740, 1700, 1780, 1750, 1730, 1760, 1770, 1750, 1740];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Horas Comprometidas Proyectos',
                    data: horasProyectos,
                    backgroundColor: 'rgba(49, 151, 149, 0.8)',
                    borderColor: '#319795',
                    borderWidth: 1,
                    stack: 'comprometidas',
                    order: 2
                },
                {
                    label: 'Horas Comprometidas Evolutivos',
                    data: horasEvolutivos,
                    backgroundColor: 'rgba(49, 151, 149, 0.4)',
                    borderColor: '#4db8b5',
                    borderWidth: 1,
                    stack: 'comprometidas',
                    order: 2
                },
                {
                    label: 'Capacidad Real Disponible',
                    data: availableHours,
                    type: 'line',
                    borderColor: '#dc2626',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 4,
                    order: 1
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
                    labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatNumber(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { stacked: true },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    stacked: true,
                    title: { display: true, text: 'Horas' },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize Committed Hours Chart (Matrix tab)
 */
function initializeCommittedHoursChart() {
    const ctx = document.getElementById('committed-hours-chart');
    if (!ctx) return;
    
    // Similar implementation to overview chart
    initializeOverviewCommittedHoursChart();
}

/**
 * Initialize Skill Distribution Chart (Matrix tab)
 */
function initializeSkillDistributionChart() {
    const ctx = document.getElementById('skill-distribution-chart');
    if (!ctx) return;
    
    // Similar implementation to overview chart
    initializeOverviewSkillDistributionChart();
}

/**
 * Helper: Calculate committed hours by month
 */
function calculateCommittedHoursByMonth() {
    const committedHours = new Array(12).fill(0);
    
    Object.keys(projectSkillBreakdown).forEach(projectId => {
        const project = projectSkillBreakdown[projectId];
        monthKeys.forEach((monthKey, index) => {
            let monthTotal = 0;
            Object.keys(project.skills).forEach(skillName => {
                monthTotal += project.skills[skillName][monthKey] || 0;
            });
            committedHours[index] += monthTotal;
        });
    });
    
    return committedHours;
}

/**
 * Helper: Calculate skill totals by month
 */
function calculateSkillTotalsByMonth() {
    const skillTotals = {
        'Construcción': new Array(12).fill(0),
        'Análisis': new Array(12).fill(0),
        'Diseño': new Array(12).fill(0),
        'QA': new Array(12).fill(0),
        'Project Management': new Array(12).fill(0),
        'General': new Array(12).fill(0)
    };
    
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
    
    return skillTotals;
}

/**
 * Helper: Calculate committed hours by profile for a specific month
 */
function calculateCommittedHoursByProfile(month) {
    const committedHours = {
        'Construcción': 0,
        'Diseño': 0,
        'Project Management': 0,
        'QA': 0,
        'Análisis': 0,
        'General': 0
    };
    
    Object.keys(projectSkillBreakdown).forEach(projectId => {
        const project = projectSkillBreakdown[projectId];
        Object.keys(project.skills).forEach(skillName => {
            const hours = project.skills[skillName][month] || 0;
            if (committedHours[skillName] !== undefined) {
                committedHours[skillName] += hours;
            }
        });
    });
    
    return committedHours;
}

/**
 * Initialize Matrix Hours by Type Chart (Vertical Bar Chart)
 */
function initializeMatrixHoursByTypeChart() {
    const ctx = document.getElementById('matrix-hours-by-type-chart');
    if (!ctx) return;
    
    // Import projectMetadata to get tipo information
    import('../config/data.js').then(module => {
        const { projectMetadata } = module;
        
        const hoursByType = calculateHoursByType(projectMetadata);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Proyecto', 'Evolutivo'],
                datasets: [{
                    label: 'Horas Totales',
                    data: [hoursByType.Proyecto, hoursByType.Evolutivo],
                    backgroundColor: ['#4db6ac', '#64b5f6'],
                    borderColor: ['#26a69a', '#42a5f5'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Horas: ' + formatNumber(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Horas' },
                        ticks: {
                            callback: function(value) {
                                return formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    });
}

/**
 * Initialize Matrix Hours by Domain Chart (Horizontal Bar Chart)
 */
function initializeMatrixHoursByDomainChart() {
    const ctx = document.getElementById('matrix-hours-by-domain-chart');
    if (!ctx) return;
    
    // Import projectMetadata to get dominiosPrincipales information
    import('../config/data.js').then(module => {
        const { projectMetadata } = module;
        
        const hoursByDomain = calculateHoursByDomain(projectMetadata);
        const domains = Object.keys(hoursByDomain).sort((a, b) => hoursByDomain[b] - hoursByDomain[a]);
        const hours = domains.map(domain => hoursByDomain[domain]);
        
        const colors = ['#4db6ac', '#64b5f6', '#ffb74d', '#81c784', '#ba68c8', '#90a4ae', '#ef5350'];
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: domains,
                datasets: [{
                    label: 'Horas Totales',
                    data: hours,
                    backgroundColor: colors.slice(0, domains.length),
                    borderColor: colors.slice(0, domains.length).map(c => c),
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Horas: ' + formatNumber(context.parsed.x);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: { display: true, text: 'Horas' },
                        ticks: {
                            callback: function(value) {
                                return formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    });
}

/**
 * Helper: Calculate total hours by project type
 */
function calculateHoursByType(projectMetadata) {
    const hoursByType = {
        'Proyecto': 0,
        'Evolutivo': 0
    };
    
    Object.keys(projectSkillBreakdown).forEach(projectId => {
        const project = projectSkillBreakdown[projectId];
        const metadata = projectMetadata[projectId];
        
        if (!metadata) return;
        
        let totalHours = 0;
        Object.keys(project.skills).forEach(skillName => {
            monthKeys.forEach(month => {
                totalHours += project.skills[skillName][month] || 0;
            });
        });
        
        const tipo = metadata.tipo || 'Proyecto';
        hoursByType[tipo] += totalHours;
    });
    
    return hoursByType;
}

/**
 * Helper: Calculate total hours by domain
 */
function calculateHoursByDomain(projectMetadata) {
    const hoursByDomain = {};
    
    Object.keys(projectSkillBreakdown).forEach(projectId => {
        const project = projectSkillBreakdown[projectId];
        const metadata = projectMetadata[projectId];
        
        if (!metadata) return;
        
        let totalHours = 0;
        Object.keys(project.skills).forEach(skillName => {
            monthKeys.forEach(month => {
                totalHours += project.skills[skillName][month] || 0;
            });
        });
        
        const domain = metadata.dominiosPrincipales || metadata.domain || 'Sin Dominio';
        if (!hoursByDomain[domain]) {
            hoursByDomain[domain] = 0;
        }
        hoursByDomain[domain] += totalHours;
    });
    
    return hoursByDomain;
}

/**
 * Initialize Resources Committed Hours Chart (Vertical Bar Chart)
 */
function initializeResourcesCommittedHoursChart() {
    const ctx = document.getElementById('resources-committed-hours-chart');
    if (!ctx) return;
    
    const tableData = extractResourceTableData();
    const committedHours = tableData.committedByMonth;
    const availableHours = tableData.availableByMonth;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Horas Comprometidas',
                    data: committedHours,
                    backgroundColor: '#9ca3af',
                    borderColor: '#6b7280',
                    borderWidth: 1
                },
                {
                    label: 'Horas Disponibles',
                    data: availableHours,
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
                    display: true,
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatNumber(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { stacked: false },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Horas' },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize Resources Hours by Skill Chart (Stacked Vertical Bar Chart - Potential Available Hours by Profile)
 */
function initializeResourcesHoursBySkillChart() {
    const ctx = document.getElementById('resources-hours-by-skill-chart');
    if (!ctx) return;
    
    const tableData = extractResourceTableData();
    const availableBySkill = tableData.availableBySkill;
    const availableBySkillByMonth = tableData.availableBySkillByMonth;
    
    // Order skills in the specified order
    const skillOrder = ['Project Management', 'Análisis', 'Diseño', 'Construcción', 'QA', 'General'];
    const sortedSkills = skillOrder.filter(skill => availableBySkill[skill] !== undefined);
    
    // Current month index (July = 6)
    const currentMonthIdx = 6;
    
    // Calculate available hours for current month and future months for each skill
    const currentMonthHours = sortedSkills.map(skill => {
        return availableBySkillByMonth[skill] ? availableBySkillByMonth[skill][currentMonthIdx] : 0;
    });
    
    const futureMonthsHours = sortedSkills.map(skill => {
        if (!availableBySkillByMonth[skill]) return 0;
        let total = 0;
        for (let i = currentMonthIdx + 1; i < 12; i++) {
            total += availableBySkillByMonth[skill][i] || 0;
        }
        return total;
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedSkills,
            datasets: [
                {
                    label: 'Mes Actual (Jul)',
                    data: currentMonthHours,
                    backgroundColor: '#4db6ac',
                    borderColor: '#26a69a',
                    borderWidth: 1,
                    stack: 'availability'
                },
                {
                    label: 'Meses Futuros (Ago-Dic)',
                    data: futureMonthsHours,
                    backgroundColor: '#80cbc4',
                    borderColor: '#4db6ac',
                    borderWidth: 1,
                    stack: 'availability'
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
                    labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatNumber(context.parsed.y) + ' horas';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { stacked: true },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    title: { display: true, text: 'Horas Disponibles' },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Helper: Extract data from the Resources table in the DOM
 * Reads the black numbers (committed hours) and green numbers in parentheses (available hours)
 */
function extractResourceTableData() {
    const result = {
        committedByMonth: new Array(12).fill(0),
        availableByMonth: new Array(12).fill(0),
        committedBySkill: {},
        availableBySkill: {},
        availableBySkillByMonth: {}
    };
    
    // Find the resources table in the Resources tab
    const resourcesTab = document.getElementById('resources-tab');
    if (!resourcesTab) return result;
    
    const table = resourcesTab.querySelector('.capacity-matrix table');
    if (!table) return result;
    
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        // Get the skill badge for this resource
        const skillBadge = row.querySelector('.skill-badge');
        if (!skillBadge) return;
        
        const skillName = skillBadge.textContent.trim();
        
        // Initialize skill totals if not exists
        if (!result.committedBySkill[skillName]) {
            result.committedBySkill[skillName] = 0;
            result.availableBySkill[skillName] = 0;
            result.availableBySkillByMonth[skillName] = new Array(12).fill(0);
        }
        
        // Get all capacity cells (skip first three columns: name, ratio, and skills)
        const cells = row.querySelectorAll('td');
        
        // Start from index 3 (first three are name, ratio, and skills columns)
        for (let i = 3; i < cells.length && i < 15; i++) {
            const cell = cells[i];
            const capacityCell = cell.querySelector('.capacity-cell');
            
            if (capacityCell) {
                // Extract the main number (committed hours) - the text before the span
                const fullText = capacityCell.childNodes[0]?.textContent?.trim() || '0';
                const committedHours = parseInt(fullText) || 0;
                
                // Extract the available hours from the green span
                const availableSpan = capacityCell.querySelector('.available-hours');
                let availableHours = 0;
                if (availableSpan) {
                    const availableText = availableSpan.textContent.trim();
                    // Remove parentheses and parse
                    availableHours = parseInt(availableText.replace(/[()]/g, '')) || 0;
                }
                
                // Add to month totals (i-3 because we skip first three columns)
                const monthIndex = i - 3;
                result.committedByMonth[monthIndex] += committedHours;
                result.availableByMonth[monthIndex] += availableHours;
                
                // Add to skill totals
                result.committedBySkill[skillName] += committedHours;
                result.availableBySkill[skillName] += availableHours;
                result.availableBySkillByMonth[skillName][monthIndex] += availableHours;
            }
        }
    });
    
    return result;
}
