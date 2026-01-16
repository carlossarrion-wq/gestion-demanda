export declare const PROJECT_TYPES: readonly ["Proyecto", "Evolutivo"];
export type ProjectType = typeof PROJECT_TYPES[number];
export declare const PROJECT_PRIORITIES: readonly ["Muy Alta", "Alta", "Media", "Baja", "Muy Baja"];
export type ProjectPriority = typeof PROJECT_PRIORITIES[number];
export declare const VALID_TEAMS: readonly ["darwin", "mulesoft", "sap", "saplcorp"];
export type TeamName = typeof VALID_TEAMS[number];
export declare const STATUS_MAP: Record<number, string>;
export declare const VALID_STATUS_IDS: number[];
export type StatusId = keyof typeof STATUS_MAP;
export declare const SKILLS: readonly ["PM", "Conceptualización", "Análisis", "Construcción", "QA", "General", "Diseño", "Project Management"];
export type SkillName = typeof SKILLS[number];
export declare const DOMAIN_MAP: Record<number, string>;
export declare const VALID_DOMAIN_IDS: number[];
export type DomainId = keyof typeof DOMAIN_MAP;
export declare const PROFICIENCY_LEVELS: readonly ["junior", "mid", "senior"];
export type ProficiencyLevel = typeof PROFICIENCY_LEVELS[number];
export declare const DEFAULT_CAPACITY_HOURS = 160;
export interface ProjectData {
    code: string;
    title: string;
    description?: string;
    type?: string | null;
    priority: string;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    status: number;
    domain: number;
    team: string;
}
export interface ResourceData {
    code: string;
    name: string;
    email?: string;
    team: string;
    defaultCapacity?: number;
    active?: boolean;
}
export interface AssignmentData {
    projectId: string;
    resourceId: string;
    skillId: string;
    month: number;
    year: number;
    hours: number;
}
export interface CapacityData {
    resourceId: string;
    month: number;
    year: number;
    totalHours: number;
}
export declare const validateProjectData: (data: Partial<ProjectData>) => void;
export declare const validateResourceData: (data: Partial<ResourceData>) => void;
export declare const validateAssignmentData: (data: Partial<AssignmentData>) => void;
export declare const validateCapacityData: (data: Partial<CapacityData>) => void;
export declare const validateUUID: (uuid: string, fieldName: string) => void;
export declare const validatePaginationParams: (page?: string | number, limit?: string | number) => {
    page: number;
    limit: number;
};
//# sourceMappingURL=validators.d.ts.map