/**
 * Dropdown Loader Utility
 * Provides static domain and status data for dropdowns
 */

/**
 * Get domains - Static data (no API calls)
 * @returns {Array} Array of domain objects with numeric IDs
 */
function getDomains() {
    return [
        { id: 1, name: 'Atención' },
        { id: 2, name: 'Datos' },
        { id: 3, name: 'Facturación y Cobros' },
        { id: 4, name: 'Ciclo de Vida y Producto' },
        { id: 5, name: 'Operación de Sistemas y Ciberseguridad' },
        { id: 6, name: 'Ventas | Contratación y SW' },
        { id: 7, name: 'Portabilidad' },
        { id: 8, name: 'Integración' },
        { id: 9, name: 'Industrial' },
        { id: 10, name: 'Gen. Distribuida' },
        { id: 11, name: 'IA Gen' },
        { id: 12, name: 'Ninguno' }
    ];
}

/**
 * Get statuses - Static data (no API calls)
 * @returns {Array} Array of status objects with numeric IDs
 */
function getStatuses() {
    return [
        { id: 1, name: 'Idea', order: 1 },
        { id: 2, name: 'Concepto', order: 2 },
        { id: 3, name: 'Viabilidad (TEC-ECO)', order: 3 },
        { id: 4, name: 'Diseño Detallado', order: 4 },
        { id: 5, name: 'Desarrollo', order: 5 },
        { id: 6, name: 'Implantado', order: 6 },
        { id: 7, name: 'Finalizado', order: 7 },
        { id: 8, name: 'On Hold', order: 8 },
        { id: 9, name: 'Cancelado', order: 9 }
    ];
}

/**
 * Populate domain dropdown
 * @param {string} selectId - ID of the select element
 * @param {number} selectedValue - Currently selected value (optional)
 */
export function populateDomainDropdown(selectId = 'projectDomain', selectedValue = null) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.error(`Select element with ID '${selectId}' not found`);
        return;
    }
    
    const domains = getDomains();
    
    // Clear existing options except the first one (placeholder)
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add domain options
    domains.forEach(domain => {
        const option = document.createElement('option');
        option.value = domain.id;
        option.textContent = domain.name;
        if (selectedValue && domain.id === selectedValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

/**
 * Populate status dropdown
 * @param {string} selectId - ID of the select element
 * @param {number} selectedValue - Currently selected value (optional)
 */
export function populateStatusDropdown(selectId = 'projectStatus', selectedValue = null) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.error(`Select element with ID '${selectId}' not found`);
        return;
    }
    
    const statuses = getStatuses();
    
    // Sort by order
    statuses.sort((a, b) => a.order - b.order);
    
    // Clear existing options except the first one (placeholder)
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add status options
    statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status.id;
        option.textContent = status.name;
        if (selectedValue && status.id === selectedValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

/**
 * Initialize all dropdowns on page load
 */
export function initializeDropdowns() {
    console.log('Initializing dropdowns...');
    populateDomainDropdown();
    populateStatusDropdown();
    console.log('Dropdowns initialized successfully');
}

/**
 * Get domain name by ID
 * @param {number} domainId - Domain ID
 * @returns {string} Domain name
 */
export function getDomainName(domainId) {
    const domains = getDomains();
    const domain = domains.find(d => d.id === domainId);
    return domain ? domain.name : 'Unknown';
}

/**
 * Get status name by ID
 * @param {number} statusId - Status ID
 * @returns {string} Status name
 */
export function getStatusName(statusId) {
    const statuses = getStatuses();
    const status = statuses.find(s => s.id === statusId);
    return status ? status.name : 'Unknown';
}
