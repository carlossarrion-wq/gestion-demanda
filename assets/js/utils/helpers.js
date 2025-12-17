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
        'Muy Alta': 'muy-alta',
        'Alta': 'alta',
        'Media': 'media',
        'Baja': 'baja',
        'Muy Baja': 'muy-baja',
        // Legacy support
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
    // Handle null/undefined
    if (!priority) return 'Media';
    
    // Already in correct format from API
    if (priority === 'Muy Alta' || priority === 'Alta' || priority === 'Media' || 
        priority === 'Baja' || priority === 'Muy Baja') {
        return priority;
    }
    
    // Convert to lowercase for comparison
    const lowerPriority = priority.toLowerCase();
    
    // Legacy format conversion (with or without hyphens)
    const priorityMap = {
        'muy-alta': 'Muy Alta',
        'muy alta': 'Muy Alta',
        'alta': 'Alta',
        'media': 'Media',
        'baja': 'Baja',
        'muy-baja': 'Muy Baja',
        'muy baja': 'Muy Baja'
    };
    
    return priorityMap[lowerPriority] || 'Media';
}

/**
 * Get status class name
 * Accepts both numeric IDs and string keys
 */
export function getStatusClass(status) {
    // Numeric mapping (from database)
    const numericStatusMap = {
        1: 'idea',
        2: 'concepto',
        3: 'viabilidad',
        4: 'diseno-detallado',
        5: 'desarrollo',
        6: 'implantado',
        7: 'finalizado',
        8: 'on-hold',
        9: 'cancelado'
    };
    
    // String mapping (legacy)
    const stringStatusMap = {
        'idea': 'idea',
        'conceptualizacion': 'conceptualizacion',
        'concepto': 'concepto',
        'diseno-detallado': 'diseno-detallado',
        'viabilidad': 'viabilidad',
        'desarrollo': 'desarrollo',
        'implantado': 'implantado',
        'finalizado': 'finalizado',
        'on-hold': 'on-hold',
        'cancelado': 'cancelado'
    };
    
    // Try numeric first, then string
    if (typeof status === 'number') {
        return numericStatusMap[status] || 'desarrollo';
    }
    return stringStatusMap[status] || 'desarrollo';
}

/**
 * Get status display text
 * Accepts both numeric IDs and string keys
 */
export function getStatusText(status) {
    // Numeric mapping (from database - matches validators.ts)
    const numericStatusMap = {
        1: 'Idea',
        2: 'Concepto',
        3: 'Viabilidad (TEC-ECO)',
        4: 'Diseño Detallado',
        5: 'Desarrollo',
        6: 'Implantado',
        7: 'Finalizado',
        8: 'On Hold',
        9: 'Cancelado'
    };
    
    // String mapping (legacy)
    const stringStatusMap = {
        'idea': 'Idea',
        'conceptualizacion': 'Conceptualización',
        'concepto': 'Concepto',
        'diseno-detallado': 'Diseño Detallado',
        'viabilidad': 'Viabilidad',
        'desarrollo': 'Desarrollo',
        'implantado': 'Implantado',
        'finalizado': 'Finalizado',
        'on-hold': 'On Hold',
        'cancelado': 'Cancelado'
    };
    
    // Try numeric first, then string
    if (typeof status === 'number') {
        return numericStatusMap[status] || 'Desarrollo';
    }
    return stringStatusMap[status] || 'Desarrollo';
}

/**
 * Get domain display text
 * Accepts both numeric IDs and string keys
 */
export function getDomainText(domain) {
    // Numeric mapping (from database - matches validators.ts)
    const numericDomainMap = {
        1: 'Atención',
        2: 'Datos',
        3: 'Facturación y Cobros',
        4: 'Ciclo de Vida y Producto',
        5: 'Operación de Sistemas y Ciberseguridad',
        6: 'Ventas | Contratación y SW',
        7: 'Portabilidad',
        8: 'Integración',
        9: 'Industrial',
        10: 'Gen. Distribuida',
        11: 'IA Gen',
        12: 'Ninguno'
    };
    
    // String mapping (legacy)
    const stringDomainMap = {
        'atencion': 'Atención',
        'facturacion': 'Facturación y Cobros',
        'contratacion': 'Contratación',
        'tecnologia': 'Tecnología',
        'marketing': 'Marketing',
        'rrhh': 'Recursos Humanos',
        'finanzas': 'Finanzas',
        'operaciones': 'Operaciones'
    };
    
    // Try numeric first, then string, then return as-is
    if (typeof domain === 'number') {
        return numericDomainMap[domain] || 'Ninguno';
    }
    return stringDomainMap[domain] || domain;
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
