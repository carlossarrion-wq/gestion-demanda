# Sistema de Planificación de Capacidad - Proyecto Modular

## 📋 Descripción
Sistema de gestión de capacidad y recursos para proyectos, con dashboard interactivo, matriz de utilización, gestión de recursos y proyectos.

## 🏗️ Estructura del Proyecto

```
/
├── index.html                          # Archivo principal (simplificado)
├── assets/
│   ├── css/                           # Estilos modulares
│   │   ├── base.css                   # Variables y estilos base
│   │   ├── components.css             # Componentes reutilizables
│   │   ├── layout.css                 # Estructura y layout
│   │   ├── tabs.css                   # Estilos de pestañas
│   │   ├── tables.css                 # Estilos de tablas y matrices
│   │   └── responsive.css             # Media queries y responsive
│   └── js/                            # JavaScript modular
│       ├── config/
│       │   └── data.js                # Configuración y datos
│       ├── utils/
│       │   └── helpers.js             # Funciones auxiliares
│       ├── components/
│       │   ├── tabs.js                # Gestión de pestañas
│       │   ├── charts.js              # Inicialización de gráficos
│       │   ├── kpi.js                 # Cálculos de KPIs
│       │   └── tables.js              # Gestión de tablas
│       ├── modules/
│       │   ├── overview.js            # Vista general
│       │   ├── matrix.js              # Matriz de utilización
│       │   ├── resources.js           # Gestión de recursos
│       │   └── projects.js            # Gestión de proyectos
│       └── main.js                    # Inicialización principal
├── pages/                             # Contenido HTML de páginas
│   ├── overview.html                  # Vista general
│   ├── matrix.html                    # Matriz de utilización
│   ├── resources.html                 # Gestión de recursos
│   └── projects.html                  # Gestión de proyectos
├── styles.css                         # [LEGACY] Archivo original
├── script.js                          # [LEGACY] Archivo original
└── README.md                          # Este archivo

```

## ✅ Reestructuración Completada

### CSS Modularizado (6 archivos)
- ✅ **base.css** (130 líneas) - Variables CSS, reset, tipografía
- ✅ **components.css** (280 líneas) - Botones, cards, badges, forms, alerts
- ✅ **layout.css** (290 líneas) - Header, containers, grids, KPIs, charts
- ✅ **tabs.css** (50 líneas) - Sistema de pestañas
- ✅ **tables.css** (170 líneas) - Tablas y matrices
- ✅ **responsive.css** (180 líneas) - Media queries y print

### JavaScript Modularizado (En progreso)
- ✅ **data.js** (180 líneas) - Configuración y datos del proyecto
- ⏳ **helpers.js** - Funciones auxiliares
- ⏳ **tabs.js** - Gestión de pestañas
- ⏳ **charts.js** - Inicialización de gráficos
- ⏳ **kpi.js** - Cálculos de KPIs
- ⏳ **tables.js** - Gestión de tablas
- ⏳ **overview.js** - Módulo vista general
- ⏳ **matrix.js** - Módulo matriz
- ⏳ **resources.js** - Módulo recursos
- ⏳ **projects.js** - Módulo proyectos
- ⏳ **main.js** - Inicialización

### HTML Modularizado (Pendiente)
- ⏳ Dividir index.html en componentes
- ⏳ Crear páginas separadas para cada sección

## 🚀 Próximos Pasos

### Fase 1: Completar JavaScript (Estimado: 2-3 horas)
1. Crear archivos de utilidades y helpers
2. Modularizar componentes (tabs, charts, kpi, tables)
3. Dividir módulos por funcionalidad (overview, matrix, resources, projects)
4. Crear archivo main.js de inicialización

### Fase 2: Modularizar HTML (Estimado: 1-2 horas)
1. Extraer contenido de pestañas a archivos separados
2. Crear sistema de carga dinámica de contenido
3. Simplificar index.html principal

### Fase 3: Integración y Testing (Estimado: 1 hora)
1. Actualizar referencias en index.html
2. Probar todas las funcionalidades
3. Verificar responsive design
4. Optimizar carga de recursos

## 📦 Beneficios de la Modularización

### Mantenibilidad
- ✅ Archivos más pequeños (<300 líneas cada uno)
- ✅ Código organizado por responsabilidad
- ✅ Fácil localización de bugs
- ✅ Mejor documentación del código

### Performance
- ✅ Carga selectiva de módulos
- ✅ Mejor cacheo de recursos
- ✅ Reducción de código duplicado

### Escalabilidad
- ✅ Fácil agregar nuevas funcionalidades
- ✅ Reutilización de componentes
- ✅ Trabajo en equipo facilitado

### Desarrollo
- ✅ Separación de concerns
- ✅ Testing más sencillo
- ✅ Versionado granular

## 🔧 Uso del Sistema Modular

### Importar CSS
```html
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/components.css">
<link rel="stylesheet" href="assets/css/layout.css">
<link rel="stylesheet" href="assets/css/tabs.css">
<link rel="stylesheet" href="assets/css/tables.css">
<link rel="stylesheet" href="assets/css/responsive.css">
```

### Importar JavaScript (ES6 Modules)
```html
<script type="module" src="assets/js/main.js"></script>
```

### Importar en JavaScript
```javascript
import { resources, projects } from './config/data.js';
import { initializeCharts } from './components/charts.js';
import { showTab } from './components/tabs.js';
```

## 📝 Notas Importantes

1. **Archivos Legacy**: Los archivos originales (styles.css, script.js, index.html) se mantienen como respaldo
2. **ES6 Modules**: El nuevo código usa módulos ES6 para mejor organización
3. **Compatibilidad**: Requiere navegadores modernos con soporte para ES6 modules
4. **Variables CSS**: Se usan custom properties (CSS variables) para temas consistentes

## 🎯 Estado Actual

- **CSS**: ✅ 100% Completado (6/6 archivos)
- **JavaScript**: 🔄 10% Completado (1/11 archivos)
- **HTML**: ⏳ 0% Completado (0/5 archivos)
- **Testing**: ⏳ Pendiente

## 📞 Soporte

Para continuar con la modularización o resolver dudas, consultar el archivo `RESTRUCTURE_PLAN.md`.

---

**Última actualización**: 27/11/2025
**Versión**: 1.0.0 (Modularización en progreso)
