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
        const jqlQuery = document.getElementById('jira-jql').value.trim();

        if (!email) {
            alert('Por favor ingresa tu email de Jira');
            return;
        }

        if (!apiToken) {
            alert('Por favor ingresa tu API Token de Jira');
            return;
        }

        // Get team from sessionStorage
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!userTeam) {
            alert('No se pudo obtener el equipo del usuario. Por favor inicia sesión de nuevo.');
            return;
        }

        this.showStep('importing');

        try {
            const requestBody = {
                jiraUrl: this.jiraConfig.url,
                apiToken: apiToken,
                email: email,
                team: userTeam,
                jqlQuery: jqlQuery || undefined
            };

            console.log('Importando desde Jira:', { ...requestBody, apiToken: '***' });

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
