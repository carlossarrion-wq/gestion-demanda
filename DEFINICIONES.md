## DEFINICIONES PRELIMINARES ##

**Proyecto**: es una iniciativa de desarrollo, que tiene un ciclo de vida propio. Este ciclo de vida está compuesto por una serie de etapas, como son:
* Idea
* Conceptualización
* Diseño Técnico
* Viabilidad Técnico-Económica
* Construcción y Pruebas
* Implantación
* Finalizado. 

Existen **2 categorías** de proyecto: 
* Proyecto (propiamente dicho), se corresponden con iniciativas de una cierta magnitud en número de horas o bien iniciativas que implican a varios sistemas.
* Evolutivos, que se corresponden con pequeños desarrollos correctivos o evolutivos, normalmente asociados a un único sistema.

---

**Sistemas Newco**. Newco es un nuevo Stack tecnológico mediante el cual Naturgy Comercializadora gestiona a sus clientes. Este Stack cubre funciones de atención al cliente, ventas y facturación. Newco está compuesto por varios sistemas:
* Salesforce para atención al cliente
* SAP-ISU para facturación
* Mulesoft como middleware de integración
* Omega, aplicación desarrollada a medida con React, que es el frontal web de atención
* Darwin, aplicación desarrollada a medida con React, que es el frontal web de comercialización
* Finalmente SAP-Commissions o Callidus, para gestión de comisiones.

De los anteriores, SAP-ISU, Mulesoft, Darwin y SAP Commissions son mantenidos por LCS (Lean Customer Services) mientras que el resto son mantenidos por proveedores diferentes. 

---

**Recurso**: se corresponde con una persona física. Cada recurso está asociado a uno o varios skills. Los skills de un recurso determinarán el tipo de tareas que puede acometer en un proyecto.
* Los **skills* disponibles son: PM (Project Management), Conceptualización, Análisis, Construcción, QA y General
* Las tareas de los proyectos son las mismas que los skills. Un recurso no podrá ser asignado a una tarea specífica si no dispone del skill equivalente. 

---

**Capacidad**: Se refiere a las horas que están habilitadas para un recurso concreto. Por defecto, cada recurso podrá trabajar 160 horas al mes. Esas horas podrán reducirse si en el mes hay días festivos o el recurso tiene ausencias planificadas (bajas, vacaciones, etc.).

Hay varios tipos de capacidad: 
* Capacidad **Total**: es el número de horas disponibles en un recursos.
* Capacidad **Comprometida**: Es la capacidad de un recurso que ya se encuentra asignada a proyectos.
* Capacidad **Libre o Disponible**: Es la capacidad de un recurso que se encuentra disponible y que por tanto no ha sido asignada a ningún proyecto.

---

## A CONTINUACIÓN SE DETALLA LA DEFINICIÓN DE LOS DIFERENTES KPIs y GRÁFICOS EN CADA UNA DE LAS PESTAÑAS DE LA APLICACIÓN DE PLANIFICACIÓN DE CAPACIDAD##:

# PESTAÑA "Vista General - Dashboard de Capacidad" #

**SELECTOR** "Mes en curso" -> Determina el ámbito de los datos que se muestran en esa región del informe, esto atañe a: los KPIs de la primera fila y los 3 gráficos de la segunda fila. 

---

**DEFINICIÓN DE KPIs**:

PROYECTOS ACTIVOS: Se define como el número de proyectos que tienen horas comprometidas > 0 para el periodo de muestreo.

* Sub-item Evolutivos: Idem para los proyectos de tipo Proyecto
* Sub-item Proyectos: Idem para los proyectos de tipo Proyecto

RECURSOS ACTIVOS: Se define como el número de recursos que tienen capacidad > 0 para el periodo de muestreo, independientemente de que esos recursos tengan toda o parte de su capacidad comprometida. 

* Sub-item "Recursos Asignados": número de recursos que tienen capacidad comprometida > 0 para el periodo de muestreo.
* Sub-item "Recursos Asignados >80%": número de recursos que tienen capacidad comprometida por encima de un 80% para el periodo de muestreo.


CAPACIDAD TOTAL: Se define como la suma de las capacidades totales de los recursos para el periodo de muestreo. Los FTEs equivalentes se calcularán a razón de 160 horas por FTE.

UTILIZACIÓN ACTUAL: Se define como la suma de las capacidades comprometidas de los recursos para el periodo de muestreo. Los FTEs equivalentes se calcularán a razón de 160 horas por FTE.

EFICIENCIA: Se define como el porcentaje equivalente al a división UTILIZACIÓN ACTUAL / CAPACIDAD TOTAL. El sub-item “FTEs Ineficiencia Equivalentes” se calculará como la diferencia entre CAPACIDAD TOTAL - UTILIZACIÓN ACTUAL, dividido por 160. 

**DEFINICIÓN DE GRÁFICOS**:

GRÁFICO Horas Comprometidas vs Disponibles: Este gráfico de barras apiladas muestra las horas mensuales comprometidas, diferenciando entre Proyectos y Evolutivos. La suma de las barras representa la capacidad comprometida. La línea superior muestra la capacidad total.

GRÁFICO Horas Comprometidas por Perfil: Este gráfico de barras horizontales muestra las horas mensuales comprometidas, diferenciando (o apilando) por skill o perfil.

GRÁFICO Horas Comprometidas vs Disponibles por Perfil: Este gráfico de barras apiladas muestra las horas comprometidas en el periodo seleccionado por skill o perfil, diferenciando entre Proyectos y Evolutivos.  La línea superior muestra la capacidad total del equipo.

**DEFINICIÓN DE TABLAS**:

TABLA Top 5 Proyectos por Volumen de Horas: Muestra los 5 proyectos con mayor número de horas comprometidas. Para cada uno de ellos se calculan también las horas incurridas y el ratio entre INCURRIDAS / COMPROMETIDAS en porcentaje.  La tabla está ordenada en orden descendente en base al número de horas comprometidas. 

**OTROS ELEMENTOS**:

Insights de Capacidad y Recomendaciones Estratégicas: En estas secciones del cuadro de mando se pretende mostrar insights obtenidos a partir de la inteligencia artificial y recomendaciones para optimizar los recursos y la capacidad. Estas secciones se desarrollarán en fases futuras. 

---

# PESTAÑA "Matriz de Utilización" #

Esta pestaña proporciona una vista matricial detallada de la planificación de recursos por proyecto y mes, permitiendo visualizar la distribución temporal de las horas comprometidas a lo largo del año.

**DEFINICIÓN DE KPIs**:

PROYECTOS REGISTRADOS: Se define como el número total de proyectos que están registrados en el sistema de planificación, independientemente de su estado o periodo de ejecución.

* Sub-item "Evolutivos": Número de proyectos de tipo Evolutivo registrados en el sistema.
* Sub-item "Proyectos": Número de proyectos de tipo Proyecto registrados en el sistema.

MEDIA HORAS POR PROYECTO: Se define como el promedio de horas totales comprometidas por proyecto. Se calcula dividiendo la suma total de horas comprometidas entre el número de proyectos.

* Sub-item "Media Evolutivos": Promedio de horas comprometidas específicamente para proyectos de tipo Evolutivo.
* Sub-item "Media Proyectos": Promedio de horas comprometidas específicamente para proyectos de tipo Proyecto.

**DEFINICIÓN DE GRÁFICOS**:

GRÁFICO Horas Comprometidas vs Disponibles: Este gráfico de barras apiladas muestra la evolución mensual de las horas comprometidas (diferenciando entre Proyectos y Evolutivos) versus la capacidad total disponible del equipo. La línea superior representa la capacidad total.

GRÁFICO Volumen de Horas por Tipo: Este gráfico de 2 barras muestra el número de horas comprometidas para Proyectos y Evolutivos.

GRÁFICO Volumen de Horas por Dominio: Este gráfico de tipo barras verticales muestra la volumetría de horas comprometidas para los diferentes dominios de negocio (Atención, Facturación y Cobros, Integración, Datos, Ventas | Contratación y SW, Operación de Sistemas y Ciberseguridad).

**DEFINICIÓN DE TABLA MATRIZ**:

TABLA Planificación de Recursos por Proyecto y Mes: Esta tabla matricial muestra la distribución mensual de horas comprometidas para cada proyecto a lo largo de 12 meses (Enero a Diciembre 2025). 

* Cada fila representa un proyecto, mostrando su ID, Tipo (Proyecto/Evolutivo) y Dominio Principal.
* Las columnas mensuales muestran las horas comprometidas para ese mes específico.
* La fila "TOTAL HORAS" al final de la tabla suma las horas comprometidas de todos los proyectos para cada mes.

**FUNCIONALIDAD DE DRILL-DOWN**:

Al hacer clic en el icono expandible (+) de un proyecto, se despliega una sección de "Detalle por Tipología de Recursos" que muestra:
* Desglose de las horas mensuales por cada skill o perfil asignado al proyecto (PM, Conceptualización, Análisis, Construcción, QA, General).
* Recurso o recursos nominales asociado al skill. 
* Un skill puede tener asociado varios recursos (1..N)

---

# PESTAÑA "Gestión de Proyectos" #

Esta pestaña proporciona una vista completa de todos los proyectos registrados en el sistema, permitiendo su gestión integral y análisis por diferentes dimensiones.

**DEFINICIÓN DE KPIs**:

PROYECTOS REGISTRADOS: Se define como el número total de proyectos registrados en el sistema de planificación.

* Sub-item "Evolutivos": Número de proyectos de tipo Evolutivo.
* Sub-item "Proyectos": Número de proyectos de tipo Proyecto.

**DEFINICIÓN DE GRÁFICOS**:

GRÁFICO Por Estado: Este gráfico de tipo barras horizontales muestra el número de proyectos según su estado en el ciclo de vida:
* Idea
* Conceptualización
* Diseño Detallado
* Viabilidad Técnico-Económica
* Construcción y Pruebas / Desarrollo
* Implantación
* Finalizado

GRÁFICO Por Dominio Principal: Este gráfico de tipo tarta muestra la distribución de número de proyectos según su dominio funcional principal:
* Atención
* Facturación y Cobros
* Integración
* Datos
* Ventas | Contratación y SW
* Operación de Sistemas y Ciberseguridad
* Otros dominios según la organización

GRÁFICO Por Prioridad: Este gráfico de tipo tarta muestra la distribución de número de proyectos según su prioridad de negocio:
* Muy Alta
* Alta
* Media
* Baja
* Muy Baja

**DEFINICIÓN DE TABLA**:

TABLA Proyectos Planificados: Esta tabla muestra el listado completo de todos los proyectos registrados en el sistema con la siguiente información:

* **ID**: Identificador único del proyecto (ej: NC-249, NC-15, etc.)
* **Título**: Nombre descriptivo del proyecto
* **Descripción**: Breve descripción del alcance y objetivos del proyecto. Substring de 30 caracteres.
* **Dominio Principal**: Área funcional principal a la que pertenece el proyecto
* **Prioridad Negocio**: Nivel de prioridad asignado por el negocio (Muy Alta, Alta, Media, Baja y Muy Baja)
* **Fecha Inicio**: Fecha de inicio planificada del proyecto
* **Fecha Fin**: Fecha de finalización planificada del proyecto
* **Estado**: Estado actual del proyecto en su ciclo de vida
* **Tipo**: Categoría del proyecto (Proyecto o Evolutivo)
* **Acciones**: Iconos de acción para:
  - Editar: Modificar los datos del proyecto
  - Eliminar: Borrar el proyecto del sistema

**FUNCIONALIDADES ADICIONALES**:

* **Buscador**: Campo de búsqueda que permite filtrar proyectos por ID, título o descripción en tiempo real.
* **Botón "Añadir Proyecto"**: Permite crear un nuevo proyecto manualmente en el sistema.
* **Botón "Importar desde Jira"**: Permite importar proyectos directamente desde Jira mediante integración con la API, utilizando consultas JQL para filtrar los proyectos a importar. A la hora de importa un proyecto desde Jira, se cargarán ciertos campos en el modal de creación de proyectos y desde ahí se podrán editar los campos que se consideren, para finalmente crear el proyecto. Los campos que vendrán de Jira serán los siguientes:
* **ID**
* **Título**
* **Descripción**
* **Dominio Principal**
* **Prioridad Negocio**
* **Estado**

El resto de campos (fecha inicio, fecha fin, tipo) deberán ser cumplimentados por el usuario.

---

# PESTAÑA "Gestión de Capacidad" #

Esta pestaña proporciona una vista detallada de los recursos humanos disponibles, su capacidad, ocupación y asignación a proyectos a lo largo del tiempo.

**DEFINICIÓN DE KPIs**:

RECURSOS REGISTRADOS: Se define como el número total de recursos (personas) registrados en el sistema de planificación.

* Sub-item "Asignados": Número de recursos que tienen al menos una asignación a un proyecto (capacidad comprometida > 0) en el mes actual o en los meses futuros. 
* Sub-item "Sin asignar": Número de recursos que no tienen ninguna asignación a proyectos (capacidad comprometida = 0) en el mes actual o en los meses futuros.

RATIO DE OCUPACIÓN MEDIO: Se define como el porcentaje promedio de ocupación de todos los recursos del equipo en el mes actual y meses futuros. No se deben contemplar meses pasados en este cálculo.

Se calcula como la media de los ratios individuales de ocupación de cada recurso. El ratio de ocupación de un recurso se calcula como: (Capacidad Comprometida / Capacidad Total) * 100 para el mes actual y futuros.

* Sub-item "Ratio más alto": El ratio de ocupación más alto entre todos los recursos del equipo.
* Sub-item "Ratio más bajo": El ratio de ocupación más bajo entre todos los recursos del equipo.

**DEFINICIÓN DE GRÁFICOS**:

GRÁFICO Horas Comprometidas vs Disponibles: Este gráfico de barras apiladas muestra la evolución mensual de las horas comprometidas versus las horas disponibles del equipo completo. Permite identificar periodos de sobrecarga o subutilización.

GRÁFICO Horas Comprometidas vs Disponibles por Skill: Este gráfico de barras apiladas muestra la distribución de horas comprometidas versus disponibles, desglosado por cada skill o perfil (PM, Conceptualización, Análisis, Construcción, QA, General). Permite identificar cuellos de botella por tipo de recurso.

**DEFINICIÓN DE TABLA MATRIZ**:

TABLA Matriz de Recursos por Mes: Esta tabla matricial muestra la planificación de capacidad de cada recurso a lo largo de 12 meses (Enero a Diciembre 2025).

* Cada fila representa un recurso individual, mostrando:
  - **Nombre del Recurso**: Nombre completo de la persona
  - **Ratio de Ocupación**: Porcentaje promedio de ocupación del recurso a lo largo del periodo
  - **Skills**: Badges visuales que indican los skills o perfiles del recurso (PM, Análisis, Construcción, Diseño, QA, General)
  
* Las columnas mensuales muestran para cada mes:
  - **Horas Comprometidas**: Número de horas asignadas a proyectos (número principal en negrita)
  - **Horas Disponibles**: Número de horas libres sin asignar (número verde entre paréntesis)
  
* Cada recurso tiene un icono expandible (+) que permite visualizar el desglose de sus asignaciones a proyectos.

**FUNCIONALIDAD DE DRILL-DOWN**:

Al hacer clic en el icono expandible (+) de un recurso, se despliegan filas adicionales que muestran:
* Listado de todos los proyectos a los que está asignado el recurso
* Para cada proyecto se muestra:
  - ID y nombre del proyecto
  - Tipo de proyecto (Proyecto/Evolutivo)
  - Distribución mensual de horas asignadas a ese proyecto específico
* Esto permite entender en detalle cómo se distribuye el tiempo de cada recurso entre sus diferentes asignaciones.

**FUNCIONALIDADES ADICIONALES**:

* **Botón "Añadir Recurso"**: Permite registrar un nuevo recurso en el sistema, especificando su nombre, skills, capacidad mensual y otros atributos.
* **Edición de Capacidad**: Al hacer clic en cualquier fila de la matriz, se abrirá un cuadro modal mediante el cual se podrá editar las características del recurso (nombre, skills) y la capacidad total del recurso para los diferentes meses. 
