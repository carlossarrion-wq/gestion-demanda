# Plan de Reestructuración del Proyecto

## Estructura Actual
- index.html (>1000 líneas)
- styles.css (>1000 líneas)
- script.js (>2000 líneas)

## Nueva Estructura Propuesta

```
/
├── index.html (archivo principal simplificado)
├── assets/
│   ├── css/
│   │   ├── base.css (estilos base y variables)
│   │   ├── components.css (componentes reutilizables)
│   │   ├── layout.css (estructura y grid)
│   │   ├── tabs.css (estilos de pestañas)
│   │   ├── tables.css (estilos de tablas)
│   │   ├── charts.css (estilos de gráficos)
│   │   └── responsive.css (media queries)
│   └── js/
│       ├── config/
│       │   └── data.js (datos y configuración)
│       ├── utils/
│       │   └── helpers.js (funciones auxiliares)
│       ├── components/
│       │   ├── tabs.js (gestión de pestañas)
│       │   ├── charts.js (inicialización de gráficos)
│       │   ├── kpi.js (cálculos de KPIs)
│       │   └── tables.js (gestión de tablas)
│       ├── modules/
│       │   ├── overview.js (vista general)
│       │   ├── matrix.js (matriz de utilización)
│       │   ├── resources.js (gestión de recursos)
│       │   └── projects.js (gestión de proyectos)
│       └── main.js (inicialización principal)
├── pages/
│   ├── overview.html (contenido de vista general)
│   ├── matrix.html (contenido de matriz)
│   ├── resources.html (contenido de recursos)
│   └── projects.html (contenido de proyectos)
└── README.md

## Beneficios
- Archivos más pequeños y manejables (<300 líneas cada uno)
- Mejor organización y mantenibilidad
- Carga más rápida y eficiente
- Facilita el trabajo en equipo
- Reutilización de componentes
