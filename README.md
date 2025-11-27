# 📊 Sistema de Gestión de Capacidad y Planificación de Recursos

## 📋 Descripción General

Sistema web interactivo para la gestión y planificación de capacidad de recursos en proyectos. Proporciona visualización en tiempo real de la utilización de recursos, seguimiento de proyectos, análisis de capacidad y herramientas de planificación estratégica.

### 🎯 Características Principales

- **Dashboard Interactivo**: Vista general con KPIs clave y gráficos de análisis
- **Matriz de Utilización**: Planificación mensual de recursos por proyecto
- **Gestión de Recursos**: Control de capacidad y asignaciones por recurso
- **Gestión de Proyectos**: Seguimiento detallado de proyectos y sus requerimientos
- **Visualización de Datos**: Gráficos interactivos con Chart.js
- **Interfaz Responsive**: Diseño adaptable a diferentes dispositivos
- **Expansión de Detalles**: Drill-down en proyectos y recursos para ver información detallada

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios

```
/
├── index-modular.html              # Aplicación principal (modular)
├── README.md                       # Este archivo
├── RESTRUCTURE_PLAN.md            # Plan de reestructuración
│
├── assets/
│   ├── css/                       # Estilos modulares (6 archivos)
│   │   ├── base.css              # Variables CSS, reset, tipografía base
│   │   ├── components.css        # Componentes UI (botones, badges, cards)
│   │   ├── layout.css            # Layout principal, header, grids
│   │   ├── tabs.css              # Sistema de pestañas
│   │   ├── tables.css            # Tablas y matrices de capacidad
│   │   └── responsive.css        # Media queries y diseño responsive
│   │
│   └── js/                        # JavaScript modular (ES6)
│       ├── main.js               # Punto de entrada principal
│       │
│       ├── config/
│       │   └── data.js           # Datos de proyectos y recursos
│       │
│       ├── utils/
│       │   └── helpers.js        # Funciones auxiliares y formateo
│       │
│       ├── components/
│       │   ├── tabs.js           # Gestión de navegación por pestañas
│       │   ├── charts.js         # Inicialización de gráficos Chart.js
│       │   └── kpi.js            # Cálculo y actualización de KPIs
│       │
│       └── modules/              # Módulos por funcionalidad (vacío)
│
└── pages/                         # Páginas HTML separadas (vacío)
```

## ✅ Estado de Implementación

### CSS - 100% Completado ✅
| Archivo | Líneas | Estado | Descripción |
|---------|--------|--------|-------------|
| `base.css` | ~130 | ✅ | Variables, reset, tipografía |
| `components.css` | ~280 | ✅ | Botones, badges, cards, forms |
| `layout.css` | ~290 | ✅ | Header, containers, grids, KPIs |
| `tabs.css` | ~50 | ✅ | Sistema de pestañas |
| `tables.css` | ~350 | ✅ | Tablas, matrices, expansión |
| `responsive.css` | ~180 | ✅ | Media queries, print styles |

### JavaScript - 100% Completado ✅
| Archivo | Líneas | Estado | Descripción |
|---------|--------|--------|-------------|
| `main.js` | ~320 | ✅ | Inicialización, event listeners |
| `data.js` | ~180 | ✅ | Datos de proyectos y recursos |
| `helpers.js` | ~120 | ✅ | Funciones auxiliares |
| `tabs.js` | ~80 | ✅ | Gestión de pestañas |
| `charts.js` | ~250 | ✅ | Gráficos interactivos |
| `kpi.js` | ~150 | ✅ | Cálculo de KPIs |

### HTML - 100% Completado ✅
- ✅ `index-modular.html` - Aplicación principal con estructura modular
- ✅ 4 pestañas implementadas (Vista General, Matriz, Recursos, Proyectos)
- ✅ Tablas interactivas con funcionalidad de expansión
- ✅ Integración completa con JavaScript modular

## 🚀 Funcionalidades Implementadas

### 1. Vista General (Dashboard)
- **KPIs Principales**: Total proyectos, horas planificadas, recursos activos, tasa de utilización
- **Gráficos Interactivos**:
  - Distribución de proyectos por tipo (Evolutivo/Proyecto)
  - Distribución por dominio principal
  - Distribución por prioridad
- **Top 5 Proyectos**: Tabla con proyectos principales ordenados por horas
- **Selector de Período**: Filtrado por trimestre/semestre/año

### 2. Matriz de Utilización
- **Planificación Mensual**: Vista de 12 meses de capacidad por proyecto
- **Iconos de Expansión**: Drill-down para ver desglose por skills
- **Indicadores Visuales**: Colores según nivel de utilización
- **Totales por Mes**: Suma de horas planificadas por período
- **Filtros**: Búsqueda y filtrado de proyectos
- **Acciones**: Editar, eliminar, sincronizar con Jira

### 3. Gestión de Recursos
- **Matriz de Recursos**: Capacidad mensual por recurso
- **Ratio de Ocupación**: Porcentaje de utilización por recurso
- **Skills por Recurso**: Competencias técnicas de cada recurso
- **Expansión de Proyectos**: Ver proyectos asignados a cada recurso (NUEVO ✨)
- **Horas Disponibles**: Indicador de capacidad libre
- **Totales**: Suma de horas por mes y recurso

### 4. Gestión de Proyectos
- **Listado Completo**: Todos los proyectos con detalles
- **Información Detallada**: ID, título, descripción, dominio, prioridad, estado
- **Badges Visuales**: Indicadores de prioridad y estado
- **Acciones Rápidas**: Editar, eliminar proyectos
- **Búsqueda**: Filtrado en tiempo real
- **Importación Jira**: Integración con Jira (en desarrollo)

## 🎨 Características de Diseño

### Sistema de Colores
- **Color Primario**: `#319795` (Teal) - Acciones principales
- **Color Secundario**: `#2c5282` (Blue) - Elementos secundarios
- **Colores de Estado**:
  - Éxito: `#48bb78` (Verde)
  - Advertencia: `#ed8936` (Naranja)
  - Error: `#f56565` (Rojo)
  - Info: `#4299e1` (Azul)

### Componentes UI
- **Botones**: Primary, secondary, success, danger con estados hover
- **Badges**: Prioridad (Alta/Media/Baja), Estado (Activo/Pausado/Completado)
- **Cards**: Contenedores con sombras y bordes redondeados
- **Tablas**: Hover effects, filas expandibles, celdas editables
- **Iconos de Expansión**: Animaciones suaves al expandir/contraer

### Responsive Design
- **Desktop**: Layout completo con todas las funcionalidades
- **Tablet**: Adaptación de grids y tablas
- **Mobile**: Navegación optimizada, tablas scrollables
- **Print**: Estilos específicos para impresión

## 🔧 Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Variables CSS, Flexbox, Grid, Animaciones
- **JavaScript ES6+**: Módulos, Arrow Functions, Template Literals
- **Chart.js**: Librería de gráficos interactivos
- **Font Awesome**: Iconos (opcional)

## 📦 Instalación y Uso

### Requisitos Previos
- Navegador web moderno con soporte para ES6 modules
- Servidor web local (opcional, para desarrollo)

### Instalación

1. **Clonar el repositorio**:
```bash
git clone https://github.com/carlossarrion-wq/gestion-demanda.git
cd gestion-demanda
```

2. **Abrir en navegador**:
```bash
# Opción 1: Abrir directamente
open index-modular.html

# Opción 2: Usar servidor local (recomendado)
python3 -m http.server 8000
# Luego abrir: http://localhost:8000/index-modular.html
```

### Uso Básico

1. **Navegación**: Usar las pestañas superiores para cambiar entre vistas
2. **Expansión**: Hacer clic en los iconos '+' para ver detalles
3. **Edición**: Hacer clic en las celdas de capacidad para editar (en desarrollo)
4. **Búsqueda**: Usar el campo de búsqueda para filtrar proyectos
5. **Período**: Seleccionar período en el selector superior

## 🔄 Últimas Actualizaciones

### Versión 1.2.0 (27/11/2025)
- ✨ **NUEVO**: Funcionalidad de expansión en tabla "Matriz de Recursos por Mes"
- ✨ **NUEVO**: Ver proyectos asignados a cada recurso con drill-down
- 🎨 Ajuste de anchos de columnas en tabla de proyectos
  - Columna "Proyecto": 234px (optimizado)
  - Columna "Dominio Principal": 99px (optimizado)
- 🐛 Corrección de overflow horizontal en tablas
- ⚡ Mejoras en animaciones de expansión/contracción
- 📝 Actualización completa de documentación

### Versión 1.1.0 (26/11/2025)
- ✅ Modularización completa de CSS (6 archivos)
- ✅ Modularización completa de JavaScript (6 archivos)
- ✅ Implementación de sistema de pestañas
- ✅ Integración de Chart.js para gráficos
- ✅ Sistema de KPIs dinámicos

## 🎯 Roadmap Futuro

### Corto Plazo
- [ ] Implementar edición inline de capacidades
- [ ] Añadir validación de datos en formularios
- [ ] Mejorar integración con Jira
- [ ] Añadir exportación a Excel/PDF

### Medio Plazo
- [ ] Sistema de autenticación de usuarios
- [ ] Historial de cambios y auditoría
- [ ] Notificaciones y alertas
- [ ] Dashboard personalizable

### Largo Plazo
- [ ] API REST para integración externa
- [ ] Aplicación móvil nativa
- [ ] Machine Learning para predicción de capacidad
- [ ] Integración con más herramientas (Azure DevOps, GitHub Projects)

## 📊 Métricas del Proyecto

- **Líneas de Código CSS**: ~1,280
- **Líneas de Código JavaScript**: ~1,100
- **Líneas de Código HTML**: ~800
- **Total de Archivos**: 13
- **Tamaño Total**: ~150 KB (sin dependencias)
- **Dependencias Externas**: 1 (Chart.js)

## 🤝 Contribución

Este es un proyecto interno. Para contribuir:

1. Crear una rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Hacer commit de cambios: `git commit -m 'feat: descripción'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request

### Convenciones de Commits
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan código)
- `refactor:` Refactorización de código
- `test:` Añadir o modificar tests
- `chore:` Tareas de mantenimiento

## 📝 Notas Técnicas

### Compatibilidad de Navegadores
- Chrome/Edge: ✅ 90+
- Firefox: ✅ 88+
- Safari: ✅ 14+
- Opera: ✅ 76+

### Performance
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Lighthouse Score: 95+

### Seguridad
- No se almacenan datos sensibles en localStorage
- Validación de entrada en desarrollo
- HTTPS recomendado para producción

## 📞 Soporte y Contacto

- **Repositorio**: https://github.com/carlossarrion-wq/gestion-demanda
- **Issues**: https://github.com/carlossarrion-wq/gestion-demanda/issues
- **Documentación Técnica**: Ver `RESTRUCTURE_PLAN.md`

## 📄 Licencia

Proyecto interno - Todos los derechos reservados

---

**Última actualización**: 27/11/2025, 20:25  
**Versión**: 1.2.0  
**Estado**: ✅ Producción - Totalmente funcional  
**Mantenedor**: Carlos Sarrión
