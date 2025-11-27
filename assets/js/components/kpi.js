// KPI Calculations Component

import { projectSkillBreakdown, monthKeys, currentMonthIndex } from '../config/data.js';
import { hoursToFTEs } from '../utils/helpers.js';

/**
 * Calculate active projects for a given month
 */
export function calculateActiveProjects(monthIndex, months = monthKeys) {
    const month = months[monthIndex];
    let activeProjects = 0;
    
    Object.keys(projectSkillBreakdown).forEach(projectId => {
        const project = projectSkillBreakdown[projectId];
        let projectHours = 0;
        
        Object.keys(project.skills).forEach(skill => {
            projectHours += project.skills[skill][month] || 0;
        });
        
        if (projectHours > 0) {
            activeProjects++;
        }
    });
    
    return activeProjects;
}

/**
 * Calculate active resources for a given month
 */
export function calculateActiveResources(monthIndex, months = monthKeys) {
    const month = months[monthIndex];
    
    const committedHours = {
        'Construcción': 0,
        'Diseño': 0,
        'Project Management': 0,
        'QA': 0,
        'Análisis': 0,
        'General': 0
    };
    
    // Sum up committed hours from all projects for the month
    Object.keys(projectSkillBreakdown).forEach(projectId => {
        const project = projectSkillBreakdown[projectId];
        Object.keys(project.skills).forEach(skillName => {
            const hours = project.skills[skillName][month] || 0;
            if (committedHours[skillName] !== undefined) {
                committedHours[skillName] += hours;
            }
        });
    });
    
    // Count resources with committed hours > 0
    let activeResources = 0;
    Object.keys(committedHours).forEach(profile => {
        if (committedHours[profile] > 0) {
            activeResources++;
        }
    });
    
    return activeResources;
}

/**
 * Update Recursos Activos KPI sub-items
 */
export function updateRecursosActivosKPI() {
    const month = monthKeys[currentMonthIndex];
    
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
    
    const availableHours = {
        'Construcción': 720,
        'Diseño': 180,
        'Project Management': 35,
        'QA': 80,
        'Análisis': 380,
        'General': 50
    };
    
    let recursosAsignados = 0;
    let recursosAsignados80 = 0;
    
    Object.keys(committedHours).forEach(profile => {
        const committed = committedHours[profile];
        const available = availableHours[profile] || 1;
        
        if (committed > 0) {
            recursosAsignados++;
        }
        
        const utilization = (committed / available) * 100;
        if (utilization > 80) {
            recursosAsignados80++;
        }
    });
    
    const recursosAsignadosElement = document.getElementById('recursos-asignados');
    const recursosAsignados80Element = document.getElementById('recursos-asignados-80');
    
    if (recursosAsignadosElement) {
        recursosAsignadosElement.textContent = recursosAsignados;
    }
    
    if (recursosAsignados80Element) {
        recursosAsignados80Element.textContent = recursosAsignados80;
    }
}

/**
 * Update Utilización Actual FTEs Equivalentes
 */
export function updateUtilizacionActualFTEs() {
    const month = monthKeys[currentMonthIndex];
    let totalCommittedHours = 0;
    
    Object.keys(projectSkillBreakdown).forEach(projectId => {
        const project = projectSkillBreakdown[projectId];
        Object.keys(project.skills).forEach(skillName => {
            totalCommittedHours += project.skills[skillName][month] || 0;
        });
    });
    
    const ftesEquivalentes = hoursToFTEs(totalCommittedHours);
    
    const ftesElement = document.getElementById('utilizacion-ftes-equivalentes');
    if (ftesElement) {
        ftesElement.textContent = ftesEquivalentes;
    }
}

/**
 * Update FTEs Ineficiencia Equivalentes
 * Formula: (Total Capacity Hours - Committed Hours) / 160
 */
export function updateFTEsIneficienciaEquivalentes() {
    const month = monthKeys[currentMonthIndex];
    
    // Calculate total committed hours
    let totalCommittedHours = 0;
    Object.keys(projectSkillBreakdown).forEach(projectId => {
        const project = projectSkillBreakdown[projectId];
        Object.keys(project.skills).forEach(skillName => {
            totalCommittedHours += project.skills[skillName][month] || 0;
        });
    });
    
    // Total capacity hours (from KPI card: 1,920 hours/month)
    const totalCapacityHours = 1920;
    
    // Calculate inefficiency in FTEs
    const inefficiencyHours = totalCapacityHours - totalCommittedHours;
    const ftesIneficiencia = (inefficiencyHours / 160).toFixed(2);
    
    const ftesIneficienciaElement = document.getElementById('ftes-ineficiencia-equivalentes');
    if (ftesIneficienciaElement) {
        ftesIneficienciaElement.textContent = ftesIneficiencia;
    }
}

/**
 * Update KPI trend indicators
 */
export function updateKPITrends() {
    const previousMonthIndex = currentMonthIndex - 1;
    
    if (previousMonthIndex < 0) return;
    
    const currentProjects = calculateActiveProjects(currentMonthIndex, monthKeys);
    const previousProjects = calculateActiveProjects(previousMonthIndex, monthKeys);
    updateTrendIndicator('proyectos-activos-trend', currentProjects, previousProjects);
    
    const currentResources = calculateActiveResources(currentMonthIndex, monthKeys);
    const previousResources = calculateActiveResources(previousMonthIndex, monthKeys);
    updateTrendIndicator('recursos-activos-trend', currentResources, previousResources);
}

/**
 * Update trend indicator element
 */
function updateTrendIndicator(elementId, currentValue, previousValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let percentageChange = 0;
    if (previousValue > 0) {
        percentageChange = ((currentValue - previousValue) / previousValue) * 100;
    } else if (currentValue > 0) {
        percentageChange = 100;
    }
    
    const formattedPercentage = percentageChange >= 0 
        ? `+${Math.round(percentageChange)}%` 
        : `${Math.round(percentageChange)}%`;
    
    element.textContent = formattedPercentage;
    
    element.classList.remove('positive', 'negative', 'warning');
    if (percentageChange > 0) {
        element.classList.add('positive');
    } else if (percentageChange < 0) {
        element.classList.add('negative');
    } else {
        element.classList.add('warning');
    }
}

/**
 * Initialize all KPIs
 */
export function initializeKPIs() {
    updateRecursosActivosKPI();
    updateUtilizacionActualFTEs();
    updateFTEsIneficienciaEquivalentes();
    updateKPITrends();
    console.log('KPIs initialized');
}
