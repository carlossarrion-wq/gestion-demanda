"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePaginationParams = exports.validateUUID = exports.validateCapacityData = exports.validateAssignmentData = exports.validateResourceData = exports.validateProjectData = exports.DEFAULT_CAPACITY_HOURS = exports.PROFICIENCY_LEVELS = exports.VALID_DOMAIN_IDS = exports.DOMAIN_MAP = exports.SKILLS = exports.VALID_STATUS_IDS = exports.STATUS_MAP = exports.VALID_TEAMS = exports.PROJECT_PRIORITIES = exports.PROJECT_TYPES = void 0;
const errors_1 = require("./errors");
exports.PROJECT_TYPES = ['Proyecto', 'Evolutivo'];
exports.PROJECT_PRIORITIES = ['Muy Alta', 'Alta', 'Media', 'Baja', 'Muy Baja'];
exports.VALID_TEAMS = ['darwin', 'mulesoft', 'sap', 'saplcorp'];
exports.STATUS_MAP = {
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
exports.VALID_STATUS_IDS = Object.keys(exports.STATUS_MAP).map(Number);
exports.SKILLS = [
    'PM',
    'Conceptualización',
    'Análisis',
    'Construcción',
    'QA',
    'General',
    'Diseño',
    'Project Management'
];
exports.DOMAIN_MAP = {
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
exports.VALID_DOMAIN_IDS = Object.keys(exports.DOMAIN_MAP).map(Number);
exports.PROFICIENCY_LEVELS = ['junior', 'mid', 'senior'];
exports.DEFAULT_CAPACITY_HOURS = 160;
const validateProjectData = (data) => {
    const errors = [];
    if (!data.code) {
        errors.push({ field: 'code', message: 'Project code is required' });
    }
    else if (data.code.length > 50) {
        errors.push({ field: 'code', message: 'Project code must be 50 characters or less' });
    }
    if (!data.title) {
        errors.push({ field: 'title', message: 'Project title is required' });
    }
    else if (data.title.length > 255) {
        errors.push({ field: 'title', message: 'Project title must be 255 characters or less' });
    }
    if (data.type !== null && data.type !== undefined && typeof data.type === 'string') {
        const trimmedType = data.type.trim();
        if (trimmedType !== '' && !exports.PROJECT_TYPES.includes(trimmedType)) {
            errors.push({
                field: 'type',
                message: `Project type must be one of: ${exports.PROJECT_TYPES.join(', ')}`
            });
        }
    }
    if (!data.priority) {
        errors.push({ field: 'priority', message: 'Project priority is required' });
    }
    else if (!exports.PROJECT_PRIORITIES.includes(data.priority)) {
        errors.push({
            field: 'priority',
            message: `Project priority must be one of: ${exports.PROJECT_PRIORITIES.join(', ')}`
        });
    }
    if (data.domain === undefined || data.domain === null) {
        errors.push({ field: 'domain', message: 'Domain is required' });
    }
    else if (!exports.VALID_DOMAIN_IDS.includes(data.domain)) {
        errors.push({
            field: 'domain',
            message: `Domain must be a valid ID between 1 and ${exports.VALID_DOMAIN_IDS.length}`
        });
    }
    if (data.status === undefined || data.status === null) {
        errors.push({ field: 'status', message: 'Status is required' });
    }
    else if (!exports.VALID_STATUS_IDS.includes(data.status)) {
        errors.push({
            field: 'status',
            message: `Status must be a valid ID between 1 and ${exports.VALID_STATUS_IDS.length}`
        });
    }
    if (!data.team) {
        errors.push({ field: 'team', message: 'Team is required' });
    }
    else if (!exports.VALID_TEAMS.includes(data.team)) {
        errors.push({
            field: 'team',
            message: `Team must be one of: ${exports.VALID_TEAMS.join(', ')}`
        });
    }
    if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (isNaN(start.getTime())) {
            errors.push({ field: 'startDate', message: 'Invalid start date format' });
        }
        if (isNaN(end.getTime())) {
            errors.push({ field: 'endDate', message: 'Invalid end date format' });
        }
        if (start > end) {
            errors.push({ field: 'endDate', message: 'End date must be after start date' });
        }
    }
    if (errors.length > 0) {
        throw new errors_1.ValidationError('Project validation failed', errors);
    }
};
exports.validateProjectData = validateProjectData;
const validateResourceData = (data) => {
    const errors = [];
    if (!data.code) {
        errors.push({ field: 'code', message: 'Resource code is required' });
    }
    else if (data.code.length > 50) {
        errors.push({ field: 'code', message: 'Resource code must be 50 characters or less' });
    }
    if (!data.name) {
        errors.push({ field: 'name', message: 'Resource name is required' });
    }
    else if (data.name.length > 255) {
        errors.push({ field: 'name', message: 'Resource name must be 255 characters or less' });
    }
    if (!data.team) {
        errors.push({ field: 'team', message: 'Team is required' });
    }
    else if (!exports.VALID_TEAMS.includes(data.team)) {
        errors.push({
            field: 'team',
            message: `Team must be one of: ${exports.VALID_TEAMS.join(', ')}`
        });
    }
    if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.push({ field: 'email', message: 'Invalid email format' });
        }
        if (data.email.length > 255) {
            errors.push({ field: 'email', message: 'Email must be 255 characters or less' });
        }
    }
    if (data.defaultCapacity !== undefined) {
        if (data.defaultCapacity < 0) {
            errors.push({ field: 'defaultCapacity', message: 'Default capacity must be non-negative' });
        }
        if (data.defaultCapacity > 744) {
            errors.push({ field: 'defaultCapacity', message: 'Default capacity exceeds maximum hours in a month' });
        }
    }
    if (errors.length > 0) {
        throw new errors_1.ValidationError('Resource validation failed', errors);
    }
};
exports.validateResourceData = validateResourceData;
const validateAssignmentData = (data) => {
    const errors = [];
    if (!data.projectId) {
        errors.push({ field: 'projectId', message: 'Project ID is required' });
    }
    if (!data.resourceId) {
        errors.push({ field: 'resourceId', message: 'Resource ID is required' });
    }
    if (!data.skillId) {
        errors.push({ field: 'skillId', message: 'Skill ID is required' });
    }
    if (data.month === undefined) {
        errors.push({ field: 'month', message: 'Month is required' });
    }
    else if (data.month < 1 || data.month > 12) {
        errors.push({ field: 'month', message: 'Month must be between 1 and 12' });
    }
    if (data.year === undefined) {
        errors.push({ field: 'year', message: 'Year is required' });
    }
    else if (data.year < 2000 || data.year > 2100) {
        errors.push({ field: 'year', message: 'Year must be between 2000 and 2100' });
    }
    if (data.hours === undefined) {
        errors.push({ field: 'hours', message: 'Hours is required' });
    }
    else if (data.hours < 0) {
        errors.push({ field: 'hours', message: 'Hours must be non-negative' });
    }
    else if (data.hours > 744) {
        errors.push({ field: 'hours', message: 'Hours exceeds maximum hours in a month' });
    }
    if (errors.length > 0) {
        throw new errors_1.ValidationError('Assignment validation failed', errors);
    }
};
exports.validateAssignmentData = validateAssignmentData;
const validateCapacityData = (data) => {
    const errors = [];
    if (!data.resourceId) {
        errors.push({ field: 'resourceId', message: 'Resource ID is required' });
    }
    if (data.month === undefined) {
        errors.push({ field: 'month', message: 'Month is required' });
    }
    else if (data.month < 1 || data.month > 12) {
        errors.push({ field: 'month', message: 'Month must be between 1 and 12' });
    }
    if (data.year === undefined) {
        errors.push({ field: 'year', message: 'Year is required' });
    }
    else if (data.year < 2000 || data.year > 2100) {
        errors.push({ field: 'year', message: 'Year must be between 2000 and 2100' });
    }
    if (data.totalHours === undefined) {
        errors.push({ field: 'totalHours', message: 'Total hours is required' });
    }
    else if (data.totalHours < 0) {
        errors.push({ field: 'totalHours', message: 'Total hours must be non-negative' });
    }
    else if (data.totalHours > 744) {
        errors.push({ field: 'totalHours', message: 'Total hours exceeds maximum hours in a month' });
    }
    if (errors.length > 0) {
        throw new errors_1.ValidationError('Capacity validation failed', errors);
    }
};
exports.validateCapacityData = validateCapacityData;
const validateUUID = (uuid, fieldName) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
        throw new errors_1.ValidationError(`${fieldName} must be a valid UUID`);
    }
};
exports.validateUUID = validateUUID;
const validatePaginationParams = (page, limit) => {
    const parsedPage = typeof page === 'string' ? parseInt(page, 10) : (page || 1);
    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : (limit || 50);
    if (isNaN(parsedPage) || parsedPage < 1) {
        throw new errors_1.ValidationError('Page must be a positive integer');
    }
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        throw new errors_1.ValidationError('Limit must be between 1 and 100');
    }
    return { page: parsedPage, limit: parsedLimit };
};
exports.validatePaginationParams = validatePaginationParams;
//# sourceMappingURL=validators.js.map