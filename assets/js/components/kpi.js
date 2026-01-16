// KPI Calculations Component - Using Real API Data

import { API_CONFIG } from '../config/data.js';
import { hoursToFTEs } from '../utils/helpers.js';

/**
 * Calculate all KPIs from real API data
 */
async function calculateRealKPIs() {
    try {
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            console.warn('No authentication for KPIs');
            return null;
        }
        
        // Fetch assignments, resources, and projects in parallel
        const [assignmentsRes, resourcesRes] = await Promise.all([
            fetch(`${API_CONFIG.BASE_URL}/assignments`, {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            }),
            fetch(`${API_CONFIG.BASE_URL}/resources`, {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            })
        ]);
        
        if (!assignmentsRes.ok || !resourcesRes.ok) {
            throw new Error('Error loading data for KPIs');
        }
        
        const assignmentsData = await assignmentsRes.json();
        const resourcesData = await resourcesRes.json();
        
        const allAssignments = assignmentsData.data?.assignments || assignmentsData.assignments || [];
        const allResources = resourcesData.data?.resources || resourcesData.resources || [];
        
        // FILTRAR recursos por equipo
        const resources = allResources.filter(r => r.team === userTeam);
        
        // Crear Set de IDs de recursos del equipo
        const teamResourceIds = new Set(resources.map(r => r.id));
        
        // FILTRAR assignments: solo los que pertenecen a recursos del equipo
        const assignments = allAssignments.filter(a => {
            // Si tiene resourceId, verificar que sea del equipo
            if (a.resourceId) {
                return teamResourceIds.has(a.resourceId);
            }
            // Si no tiene resourceId asignado aún, NO contar
            return false;
        });
        
        console.log(`KPIs: Filtered by team "${userTeam}" - Resources: ${resources.length}, Assignments: ${assignments.length} (of ${allAssignments.length} total)`);
        
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();
        
        console.log('=== KPI Calculation Debug ===');
        console.log('Current date:', now);
        console.log('Current month:', currentMonth, 'Current year:', currentYear);
        console.log('Total assignments:', assignments.length);
        
        // Filter assignments for current month
        const currentMonthAssignments = assignments.filter(a => 
            a.month === currentMonth && a.year === currentYear
        );
        
        console.log('Assignments for current month:', currentMonthAssignments.length);
        console.log('Sample assignments:', currentMonthAssignments.slice(0, 3));
        
        // 1. PROYECTOS ACTIVOS - Proyectos únicos con assignments este mes
        const activeProjectIds = new Set();
        currentMonthAssignments.forEach(a => {
            if (a.projectId) {
                activeProjectIds.add(a.projectId);
            }
        });
        const proyectosActivos = activeProjectIds.size;
        
        // Count by type from window.allProjects
        let evolutivos = 0;
        let proyectos = 0;
        if (window.allProjects && Array.isArray(window.allProjects)) {
            window.allProjects.forEach(p => {
                if (activeProjectIds.has(p.id)) {
                    if (p.type === 'Evolutivo') evolutivos++;
                    else if (p.type === 'Proyecto') proyectos++;
                }
            });
        }
        
        // 2. RECURSOS ACTIVOS - Recursos con horas asignadas este mes
        const resourceHoursMap = new Map();
        currentMonthAssignments.forEach(assignment => {
            if (assignment.resourceId) {
                const hours = parseFloat(assignment.hours) || 0;
                if (!resourceHoursMap.has(assignment.resourceId)) {
                    resourceHoursMap.set(assignment.resourceId, 0);
                }
                resourceHoursMap.set(assignment.resourceId, 
                    resourceHoursMap.get(assignment.resourceId) + hours
                );
            }
        });
        
        const recursosActivos = resourceHoursMap.size;
        
        // Count resources with >50% and >80% utilization
        let recursosAsignados50 = 0;
        let recursosAsignados80 = 0;
        resourceHoursMap.forEach((hours) => {
            const utilization = (hours / 160) * 100; // 160 hours = 1 FTE
            if (utilization > 50) recursosAsignados50++;
            if (utilization > 80) recursosAsignados80++;
        });
        
        // 3. CAPACIDAD TOTAL
        const totalCapacityHours = resources.length * 160; // Each resource = 160h/month
        const ftesCapacidad = hoursToFTEs(totalCapacityHours);
        
        console.log('Total resources:', resources.length);
        console.log('Total capacity hours:', totalCapacityHours);
        
        // 4. UTILIZACIÓN ACTUAL (hours committed)
        let totalCommittedHours = 0;
        currentMonthAssignments.forEach(a => {
            const hours = parseFloat(a.hours) || 0;
            console.log(`Assignment hours: ${a.hours} → ${hours}h`);
            totalCommittedHours += hours;
        });
        const ftesUtilizacion = hoursToFTEs(totalCommittedHours);
        
        console.log('Total committed hours:', totalCommittedHours);
        
        // 5. EFICIENCIA
        const utilizacionPercentage = totalCapacityHours > 0
            ? ((totalCommittedHours / totalCapacityHours) * 100).toFixed(0)
            : '0';
        
        console.log('Efficiency calculation:', {
            totalCommittedHours,
            totalCapacityHours,
            efficiency: `${utilizacionPercentage}%`,
            formula: `(${totalCommittedHours} / ${totalCapacityHours}) * 100`
        });
        
        const inefficiencyHours = Math.max(0, totalCapacityHours - totalCommittedHours);
        const ftesIneficiencia = (inefficiencyHours / 160).toFixed(2);
        
        return {
            // Proyectos Activos
            proyectosActivos,
            evolutivos,
            proyectos,
            
            // Recursos Activos
            recursosActivos,
            recursosAsignados50,
            recursosAsignados80,
            
            // Capacidad Total
            capacidadTotal: totalCapacityHours,
            ftesCapacidad,
            
            // Utilización Actual
            utilizacionActual: totalCommittedHours,
            ftesUtilizacion,
            
            // Eficiencia
            eficienciaPercentage: utilizacionPercentage,
            ftesIneficiencia
        };
        
    } catch (error) {
        console.error('Error calculating KPIs:', error);
        return null;
    }
}

/**
 * Update all KPI displays with real data
 */
export async function initializeKPIs() {
    console.log('Initializing KPIs with real API data...');
    
    const kpis = await calculateRealKPIs();
    
    if (!kpis) {
        console.warn('Could not calculate KPIs, using defaults');
        return;
    }
    
    // 1. PROYECTOS ACTIVOS
    const proyectosActivosElement = document.getElementById('proyectos-activos');
    if (proyectosActivosElement) {
        proyectosActivosElement.textContent = kpis.proyectosActivos;
    }
    
    const evolutivosElement = document.getElementById('evolutivos');
    if (evolutivosElement) {
        evolutivosElement.textContent = kpis.evolutivos;
    }
    
    const proyectosElement = document.getElementById('proyectos');
    if (proyectosElement) {
        proyectosElement.textContent = kpis.proyectos;
    }
    
    // 2. RECURSOS ACTIVOS
    const recursosActivosElement = document.getElementById('recursos-activos');
    if (recursosActivosElement) {
        recursosActivosElement.textContent = kpis.recursosActivos;
    }
    
    const recursosAsignadosElement = document.getElementById('recursos-asignados');
    if (recursosAsignadosElement) {
        recursosAsignadosElement.textContent = kpis.recursosAsignados50;
    }
    
    const recursosAsignados80Element = document.getElementById('recursos-asignados-80');
    if (recursosAsignados80Element) {
        recursosAsignados80Element.textContent = kpis.recursosAsignados80;
    }
    
    // 3. CAPACIDAD TOTAL
    const capacidadTotalElement = document.getElementById('capacidad-total');
    if (capacidadTotalElement) {
        capacidadTotalElement.textContent = kpis.capacidadTotal.toLocaleString();
    }
    
    const ftesCapacidadElement = document.getElementById('capacidad-ftes-equivalentes');
    if (ftesCapacidadElement) {
        ftesCapacidadElement.textContent = kpis.ftesCapacidad;
    }
    
    // 4. UTILIZACIÓN ACTUAL
    const utilizacionActualElement = document.getElementById('utilizacion-actual');
    if (utilizacionActualElement) {
        utilizacionActualElement.textContent = kpis.utilizacionActual.toLocaleString();
    }
    
    const ftesUtilizacionElement = document.getElementById('utilizacion-ftes-equivalentes');
    if (ftesUtilizacionElement) {
        ftesUtilizacionElement.textContent = kpis.ftesUtilizacion;
    }
    
    // 5. EFICIENCIA
    const eficienciaElement = document.getElementById('eficiencia');
    if (eficienciaElement) {
        eficienciaElement.textContent = `${kpis.eficienciaPercentage}%`;
    }
    
    const ftesIneficienciaElement = document.getElementById('ftes-ineficiencia-equivalentes');
    if (ftesIneficienciaElement) {
        ftesIneficienciaElement.textContent = kpis.ftesIneficiencia;
    }
    
    console.log('KPIs updated with real data:', kpis);
}

/**
 * Legacy function - kept for backward compatibility
 */
export function updateRecursosActivosKPI() {
    // Now handled by initializeKPIs
}

/**
 * Legacy function - kept for backward compatibility
 */
export function updateUtilizacionActualFTEs() {
    // Now handled by initializeKPIs
}

/**
 * Legacy function - kept for backward compatibility
 */
export function updateFTEsIneficienciaEquivalentes() {
    // Now handled by initializeKPIs
}

/**
 * Legacy function - kept for backward compatibility
 */
export function updateKPITrends() {
    // Trends not yet implemented with real data
}

/**
 * Calculate active projects from real API data
 */
export async function calculateActiveProjects() {
    try {
        if (window.allProjects && Array.isArray(window.allProjects)) {
            return window.allProjects.length;
        }
        return 0;
    } catch (error) {
        console.error('Error calculating active projects:', error);
        return 0;
    }
}

/**
 * Calculate active resources - legacy function
 */
export function calculateActiveResources() {
    // Now calculated in real-time by initializeKPIs
    return 0;
}
