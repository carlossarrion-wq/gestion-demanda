// Helper Functions and Utilities

/**
 * Format number with thousands separator (using period)
 */
export function formatNumber(num) {
    return num.toLocaleString('de-DE'); // German locale uses period as thousand separator
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
}

/**
 * Get month name from index
 */
export function getMonthName(index) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[index];
}

/**
 * Get short month name from index
 */
export function getShortMonthName(index) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[index];
}

/**
 * Convert hours to FTEs (1 FTE = 160 hours)
 */
export function hoursToFTEs(hours) {
    return (hours / 160).toFixed(2);
}

/**
 * Convert FTEs to hours
 */
export function ftesToHours(ftes) {
    return Math.round(ftes * 160);
}

/**
 * Get priority class name
 */
export function getPriorityClass(priority) {
    const priorityMap = {
        'muy-alta': 'muy-alta',
        'alta': 'alta',
        'media': 'media',
        'baja': 'baja',
        'muy-baja': 'muy-baja'
    };
    return priorityMap[priority] || 'media';
}

/**
 * Get priority display text
 */
export function getPriorityText(priority) {
    const priorityMap = {
        'muy-alta': 'Muy Alta',
        'alta': 'Alta',
        'media': 'Media',
        'baja': 'Baja',
        'muy-baja': 'Muy Baja'
    };
    return priorityMap[priority] || 'Media';
}

/**
 * Get status class name
 */
export function getStatusClass(status) {
    const statusMap = {
        'idea': 'idea',
        'conceptualizacion': 'conceptualizacion',
        'concepto': 'conceptualizacion',
        'diseno-detallado': 'diseno-detallado',
        'viabilidad': 'viabilidad',
        'desarrollo': 'desarrollo',
        'implantado': 'implantado',
        'finalizado': 'finalizado',
        'cancelado': 'cancelado'
    };
    return statusMap[status] || 'desarrollo';
}

/**
 * Get status display text
 */
export function getStatusText(status) {
    const statusMap = {
        'idea': 'Idea',
        'conceptualizacion': 'Conceptualización',
        'concepto': 'Concepto',
        'diseno-detallado': 'Diseño Detallado',
        'viabilidad': 'Viabilidad',
        'desarrollo': 'Desarrollo',
        'implantado': 'Implantado',
        'finalizado': 'Finalizado',
        'cancelado': 'Cancelado'
    };
    return statusMap[status] || 'Desarrollo';
}

/**
 * Get domain display text
 */
export function getDomainText(domain) {
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
    return domainMap[domain] || domain;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show notification/alert
 */
export function showNotification(message, type = 'info') {
    alert(message); // Simple implementation, can be enhanced with custom notifications
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Generate unique ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Sort array of objects by property
 */
export function sortByProperty(array, property, ascending = true) {
    return array.sort((a, b) => {
        const aVal = a[property];
        const bVal = b[property];
        
        if (aVal < bVal) return ascending ? -1 : 1;
        if (aVal > bVal) return ascending ? 1 : -1;
        return 0;
    });
}
