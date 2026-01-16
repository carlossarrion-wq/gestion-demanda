/**
 * Jira Integration Modal
 * Handles configuration and import from Jira
 */

import { API_CONFIG } from '../config/data.js';

export class JiraModal {
    constructor() {
        this.modal = null;
        this.jiraConfig = {
            url: 'https://naturgy-adn.atlassian.net',
            apiToken: '', // Token debe ser ingresado por el usuario
            email: ''
        };
        this.selectedProjects = [];
    }

    init() {
        this.createModal();
        console.log('Jira Modal initialized');
    }

    createModal() {
        const modalHTML = `
            <div id="jira-modal" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999;">
                <div class="modal-container" style="max-width: 700px; background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <div class="modal-header">
                        <h2><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 24px; height: 24px; display: inline-block; vertical-align: middle; margin-right: 8px;">
  <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
</svg> Importar desde Jira</h2>
                        <button class="modal-close" onclick="window.jiraModal.close()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="jira-step-1" class="jira-step">
                            <h3 style="margin-top: 0; color: #2563eb;">Configuración</h3>
                            
                            <div class="form-group">
                                <label>URL de Jira *</label>
                                <input type="text" id="jira-url" class="form-input" 
                                       value="https://naturgy-adn.atlassian.net" readonly
                                       style="background-color: #f3f4f6;">
                            </div>

                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" id="jira-email" class="form-input" 
                                       placeholder="tu.email@naturgy.com">
                            </div>

                            <div class="form-group">
                                <label>API Token *</label>
                                <input type="password" id="jira-token" class="form-input" 
                                       placeholder="Tu API Token de Jira">
                                <small style="color: #6b7280;">
                                    <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" style="color: #2563eb;">
                                        Genera tu token aquí
                                    </a>
                                </small>
                            </div>

                            <div class="form-group">
                                <label>Consulta JQL (Opcional)</label>
                                <textarea id="jira-jql" class="form-input" rows="3" 
                                          placeholder="project = 'TU_PROYECTO' AND status != 'Closed'"></textarea>
                                <small style="color: #6b7280;">Ejemplo: project = 'NC' AND status != 'Closed'</small>
                            </div>

                            <div style="margin-top: 1.5rem; padding: 1rem; background-color: #dbeafe; border-left: 4px solid #2563eb; border-radius: 4px;">
                                <p style="margin: 0; font-size: 0.9rem; color: #1e40af;">
                                    <strong>🔐 Seguridad:</strong> Tu API Token no se guarda y solo se usa para esta importación.
                                </p>
                            </div>

                            <div class="modal-actions" style="margin-top: 1.5rem;">
                                <button onclick="window.jiraModal.importProjects()" class="btn btn-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 0.5rem;">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    Importar
                                </button>
                                <button onclick="window.jiraModal.close()" class="btn btn-secondary">
                                    Cancelar
                                </button>
                            </div>
                        </div>

                        <div id="jira-selection" class="jira-step" style="display: none;">
                            <h3 style="margin-top: 0; color: #2563eb;">Selecciona Issues para Importar</h3>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 0.75rem; background-color: #f3f4f6; border-radius: 6px;">
                                <span id="jira-selection-count" style="font-weight: 600; color: #374151;">0 de 0 seleccionados</span>
                                <div>
                                    <button onclick="window.jiraModal.selectAllIssues()" class="btn btn-secondary" style="margin-right: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem;">
                                        Seleccionar Todos
                                    </button>
                                    <button onclick="window.jiraModal.deselectAllIssues()" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                                        Deseleccionar Todos
                                    </button>
                                </div>
                            </div>

                            <div id="jira-issues-list" style="max-height: 400px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 6px; padding: 1rem; background-color: #fafafa;">
                                <!-- Issues will be populated here -->
                            </div>

                            <div class="modal-actions" style="margin-top: 1.5rem;">
                                <button id="jira-import-selected-btn" onclick="window.jiraModal.importSelectedIssues()" class="btn btn-primary" disabled>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 0.5rem;">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    Importar Seleccionados
                                </button>
                                <button onclick="window.jiraModal.showStep(1)" class="btn btn-secondary">
                                    Volver
                                </button>
                            </div>
                        </div>

                        <div id="jira-importing" class="jira-step" style="display: none;">
                            <h3 style="margin-top: 0; color: #2563eb;">Importando...</h3>
                            <div style="text-align: center; padding: 2rem;">
                                <div class="spinner"></div>
                                <p id="jira-import-status" style="margin-top: 1rem; color: #6b7280;">
                                    Importando proyectos desde Jira...
                                </p>
                            </div>
                        </div>

                        <div id="jira-success" class="jira-step" style="display: none;">
                            <h3 style="margin-top: 0; color: #10b981;">✓ Importación Completada</h3>
                            <div id="jira-results" style="padding: 1rem; background-color: #f0fdf4; border-radius: 4px; margin-top: 1rem;">
                                <!-- Results will be shown here -->
                            </div>
                            <div class="modal-actions" style="margin-top: 1.5rem;">
                                <button onclick="window.jiraModal.close(); window.location.reload();" class="btn btn-primary">
                                    Cerrar y Recargar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('jira-modal');
    }

    open() {
        console.log('JiraModal.open() called');
        if (this.modal) {
            console.log('Modal element found, showing...');
            this.modal.style.display = 'flex';
            this.modal.style.alignItems = 'center';
            this.modal.style.justifyContent = 'center';
            this.modal.style.opacity = '1';
            this.modal.style.visibility = 'visible';
            
            // También asegurar que el container sea visible
            const container = this.modal.querySelector('.modal-container');
            if (container) {
                container.style.visibility = 'visible';
                container.style.opacity = '1';
            }
            
            this.showStep(1);
            console.log('Modal visibility forced: opacity=1, visibility=visible');
        } else {
            console.error('Modal element not found!');
        }
    }

    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    showStep(step) {
        document.querySelectorAll('.jira-step').forEach(el => el.style.display = 'none');
        
        if (step === 1) {
            document.getElementById('jira-step-1').style.display = 'block';
        } else if (step === 'importing') {
            document.getElementById('jira-importing').style.display = 'block';
        } else if (step === 'success') {
            document.getElementById('jira-success').style.display = 'block';
        }
    }

    async importProjects() {
        const email = document.getElementById('jira-email').value.trim();
        const apiToken = document.getElementById('jira-token').value.trim();
        const jqlQuery = document.getElementById('jira-jql').value.trim() || "project = 'NC' AND status != 'Closed'";

        if (!email) {
            alert('Por favor ingresa tu email de Jira');
            return;
        }

        if (!apiToken) {
            alert('Por favor ingresa tu API Token de Jira');
            return;
        }

        // Guardar credenciales para usar después
        this.tempCredentials = {
            email,
            apiToken,
            jqlQuery
        };

        this.showStep('importing');
        document.getElementById('jira-import-status').textContent = 'Buscando issues en Jira...';

        try {
            // Paso 1: Listar issues disponibles
            const listUrl = `${API_CONFIG.BASE_URL}/jira/issues?jiraUrl=${encodeURIComponent(this.jiraConfig.url)}&email=${encodeURIComponent(email)}&apiToken=${encodeURIComponent(apiToken)}&jqlQuery=${encodeURIComponent(jqlQuery)}`;
            
            console.log('Listando issues desde Jira...');

            const response = await fetch(listUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || result.error || 'Error consultando Jira');
            }

            console.log('Respuesta de Jira:', result);

            // Manejar nueva estructura: {success: true, data: {issues: [...], total: X}}
            let issues;
            if (result.success && result.data) {
                issues = result.data.issues;
            } else if (Array.isArray(result)) {
                issues = result;
            } else {
                issues = result.issues;
            }

            // Mostrar modal de selección
            this.showIssueSelection(issues);
        } catch (error) {
            console.error('Error:', error);
            alert(`Error al consultar Jira: ${error.message}`);
            this.showStep(1);
        }
    }

    showIssueSelection(issues) {
        if (!issues || issues.length === 0) {
            alert('No se encontraron issues con el JQL proporcionado');
            this.showStep(1);
            return;
        }

        // Guardar issues originales para filtrado
        this.allIssues = issues;

        // Mostrar paso de selección
        document.getElementById('jira-importing').style.display = 'none';
        document.getElementById('jira-selection').style.display = 'block';

        // Añadir controles de búsqueda y filtros antes de la lista
        const selectionDiv = document.getElementById('jira-selection');
        const existingFilters = selectionDiv.querySelector('.jira-filters');
        
        if (!existingFilters) {
            const filtersHTML = `
                <div class="jira-filters" style="background-color: #f9fafb; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; border: 1px solid #e5e7eb;">
                    <div style="margin-bottom: 0.75rem;">
                        <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">
                            🔍 Buscar por título
                        </label>
                        <input type="text" id="jira-search-input" class="form-input" 
                               placeholder="Buscar en título o key..." 
                               style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">
                                📂 Dominio
                            </label>
                            <select id="jira-filter-domain" class="form-input" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
                                <option value="">Todos</option>
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">
                                🔄 Estado
                            </label>
                            <select id="jira-filter-status" class="form-input" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
                                <option value="">Todos</option>
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">
                                📋 Tipo
                            </label>
                            <select id="jira-filter-type" class="form-input" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
                                <option value="">Todos</option>
                                <option value="Si">Proyecto</option>
                                <option value="No">No Proyecto</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="margin-top: 0.75rem; text-align: right;">
                        <button id="jira-clear-filters" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            `;
            
            // Insertar antes del contador
            const countDiv = selectionDiv.querySelector('[style*="flex"]');
            countDiv.insertAdjacentHTML('beforebegin', filtersHTML);
            
            // Poblar opciones de filtros
            this.populateFilterOptions(issues);
            
            // Añadir event listeners
            document.getElementById('jira-search-input').addEventListener('input', () => this.applyFilters());
            document.getElementById('jira-filter-domain').addEventListener('change', () => this.applyFilters());
            document.getElementById('jira-filter-status').addEventListener('change', () => this.applyFilters());
            document.getElementById('jira-filter-type').addEventListener('change', () => this.applyFilters());
            document.getElementById('jira-clear-filters').addEventListener('click', () => this.clearFilters());
        }

        // Renderizar issues
        this.renderIssues(issues);
    }

    populateFilterOptions(issues) {
        // Obtener valores únicos
        const domains = [...new Set(issues.map(i => i.dominioPrincipal || 'Sin dominio'))].sort();
        const statuses = [...new Set(issues.map(i => i.status))].sort();
        
        // Poblar select de dominios
        const domainSelect = document.getElementById('jira-filter-domain');
        domains.forEach(domain => {
            const option = document.createElement('option');
            option.value = domain;
            option.textContent = domain;
            domainSelect.appendChild(option);
        });
        
        // Poblar select de estados
        const statusSelect = document.getElementById('jira-filter-status');
        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        });
    }

    applyFilters() {
        const searchText = document.getElementById('jira-search-input').value.toLowerCase();
        const filterDomain = document.getElementById('jira-filter-domain').value;
        const filterStatus = document.getElementById('jira-filter-status').value;
        const filterType = document.getElementById('jira-filter-type').value;
        
        const filtered = this.allIssues.filter(issue => {
            // Filtro de búsqueda
            const matchesSearch = !searchText || 
                issue.key.toLowerCase().includes(searchText) || 
                issue.summary.toLowerCase().includes(searchText);
            
            // Filtro de dominio
            const matchesDomain = !filterDomain || 
                (issue.dominioPrincipal || 'Sin dominio') === filterDomain;
            
            // Filtro de estado
            const matchesStatus = !filterStatus || issue.status === filterStatus;
            
            // Filtro de tipo
            const matchesType = !filterType || issue.esProyecto === filterType;
            
            return matchesSearch && matchesDomain && matchesStatus && matchesType;
        });
        
        this.renderIssues(filtered);
        
        // Actualizar mensaje si no hay resultados
        if (filtered.length === 0) {
            const container = document.getElementById('jira-issues-list');
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No se encontraron issues con los filtros aplicados</p>';
        }
    }

    clearFilters() {
        document.getElementById('jira-search-input').value = '';
        document.getElementById('jira-filter-domain').value = '';
        document.getElementById('jira-filter-status').value = '';
        document.getElementById('jira-filter-type').value = '';
        this.applyFilters();
    }

    renderIssues(issues) {
        const issuesContainer = document.getElementById('jira-issues-list');
        issuesContainer.innerHTML = '';

        // Crear lista de issues con checkboxes
        issues.forEach(issue => {
            const issueDiv = document.createElement('div');
            issueDiv.className = 'jira-issue-item';
            issueDiv.style.cssText = 'padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s;';
            issueDiv.setAttribute('data-issue-key', issue.key);
            
            issueDiv.innerHTML = `
                <label style="display: flex; align-items: start; cursor: pointer; width: 100%;">
                    <input type="checkbox" value="${issue.key}" style="margin-top: 4px; margin-right: 12px; cursor: pointer;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                            ${issue.key} - ${issue.summary}
                        </div>
                        <div style="font-size: 0.875rem; color: #6b7280;">
                            <span style="margin-right: 12px;">📋 ${issue.esProyecto}</span>
                            <span style="margin-right: 12px;">⚡ ${issue.prioridadNegocio}</span>
                            <span style="margin-right: 12px;">📂 ${issue.dominioPrincipal || 'Sin dominio'}</span>
                            <span>🔄 ${issue.status}</span>
                        </div>
                    </div>
                </label>
            `;

            // Click en el div selecciona/deselecciona
            issueDiv.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    const checkbox = issueDiv.querySelector('input[type="checkbox"]');
                    checkbox.checked = !checkbox.checked;
                    this.updateSelectionCount();
                }
            });

            // Hover effect
            issueDiv.addEventListener('mouseenter', () => {
                issueDiv.style.backgroundColor = '#f9fafb';
            });
            issueDiv.addEventListener('mouseleave', () => {
                issueDiv.style.backgroundColor = 'white';
            });

            issuesContainer.appendChild(issueDiv);
        });

        // Añadir event listener para actualizar contador al cambiar checkboxes
        issuesContainer.addEventListener('change', () => {
            this.updateSelectionCount();
        });

        // Actualizar contador inicial
        this.updateSelectionCount();
    }

    updateSelectionCount() {
        const checkboxes = document.querySelectorAll('#jira-issues-list input[type="checkbox"]');
        const checked = document.querySelectorAll('#jira-issues-list input[type="checkbox"]:checked');
        const counter = document.getElementById('jira-selection-count');
        const importBtn = document.getElementById('jira-import-selected-btn');
        
        counter.textContent = `${checked.length} de ${checkboxes.length} seleccionados`;
        importBtn.disabled = checked.length === 0;
        importBtn.style.opacity = checked.length === 0 ? '0.5' : '1';
        importBtn.style.cursor = checked.length === 0 ? 'not-allowed' : 'pointer';
    }

    selectAllIssues() {
        const checkboxes = document.querySelectorAll('#jira-issues-list input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
        this.updateSelectionCount();
    }

    deselectAllIssues() {
        const checkboxes = document.querySelectorAll('#jira-issues-list input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        this.updateSelectionCount();
    }

    async importSelectedIssues() {
        const selectedCheckboxes = document.querySelectorAll('#jira-issues-list input[type="checkbox"]:checked');
        const issueKeys = Array.from(selectedCheckboxes).map(cb => cb.value);

        if (issueKeys.length === 0) {
            alert('Por favor selecciona al menos un issue para importar');
            return;
        }

        const userTeam = sessionStorage.getItem('user_team');
        if (!userTeam) {
            alert('No se pudo obtener el equipo del usuario. Por favor inicia sesión de nuevo.');
            return;
        }

        this.showStep('importing');
        document.getElementById('jira-import-status').textContent = `Importando ${issueKeys.length} issue(s) seleccionado(s)...`;

        try {
            const requestBody = {
                jiraUrl: this.jiraConfig.url,
                apiToken: this.tempCredentials.apiToken,
                email: this.tempCredentials.email,
                team: userTeam,
                issueKeys: issueKeys
            };

            console.log('Importando issues seleccionados:', { ...requestBody, apiToken: '***', issueKeys });

            const response = await fetch(`${API_CONFIG.BASE_URL}/jira/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error importando desde Jira');
            }

            this.showImportResults(result);
        } catch (error) {
            console.error('Error:', error);
            alert(`Error al importar: ${error.message}`);
            this.showStep(1);
        }
    }

    showImportResults(result) {
        const resultsContainer = document.getElementById('jira-results');
        
        let html = `
            <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">
                ${result.message}
            </p>
        `;

        if (result.imported && result.imported.length > 0) {
            html += `
                <div style="margin-top: 1rem;">
                    <strong>Proyectos importados:</strong>
                    <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
            `;
            
            result.imported.forEach(proj => {
                html += `
                    <li>
                        <strong>${proj.code}</strong> - ${proj.title}
                        <span style="color: #6b7280;">(${proj.assignmentsCount} tareas)</span>
                    </li>
                `;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }

        html += `
            <p style="margin-top: 1rem; color: #6b7280; font-size: 0.9rem;">
                Total de issues procesados: ${result.totalIssues || 0}
            </p>
        `;

        resultsContainer.innerHTML = html;
        this.showStep('success');
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.JiraModal = JiraModal;
}
