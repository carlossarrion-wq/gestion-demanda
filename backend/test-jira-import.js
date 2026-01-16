/**
 * Script de prueba para simular importación de Jira
 * Muestra un ejemplo de respuesta de la función
 */

// Datos de prueba
const testData = {
    jiraUrl: 'https://naturgy-adn.atlassian.net',
    email: 'carlos.sarrion@es.ibm.com',
    apiToken: 'ATATT3xFfGF0LY-nh6cEDdIGhTzWxGNe5812qq7LAnMoKlwSJm3LC05mOYKd0hjtNKPKmh5QQNp65dk5TRICYDmIqsIm9dZ_on-sl1xAT4W_jKsVlcwCbRpayob3ZoTPK3_O6KhV3qqORG48VjOcK9dlfFTRmbsOV-AvyqJYIYoStl1nCz1NlNA=6FE13DB2',
    jqlQuery: "project = 'NC' AND status != 'Closed'",
    team: 'darwin' // ✅ Valores válidos: darwin, mulesoft, sap, saplcorp
};

// URL del endpoint de Lambda
const LAMBDA_URL = 'https://xrqo2gedpl.execute-api.eu-west-1.amazonaws.com/prod/jira/import';

console.log('='.repeat(80));
console.log('🧪 PRUEBA DE IMPORTACIÓN DE JIRA');
console.log('='.repeat(80));
console.log('\n📋 Parámetros de prueba:');
console.log('  - Email:', testData.email);
console.log('  - Jira URL:', testData.jiraUrl);
console.log('  - JQL Query:', testData.jqlQuery);
console.log('  - Team:', testData.team);
console.log('  - API Token: ***' + testData.apiToken.slice(-10));

console.log('\n🚀 Iniciando importación...\n');

// Hacer la petición
fetch(LAMBDA_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
})
.then(async response => {
    const data = await response.json();
    
    console.log('='.repeat(80));
    console.log('📊 RESPUESTA DE LA LAMBDA');
    console.log('='.repeat(80));
    console.log('\n🔢 Status Code:', response.status);
    console.log('✅ Status:', response.ok ? 'SUCCESS' : 'ERROR');
    
    console.log('\n📦 Datos de respuesta:\n');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok && data.success && data.data) {
        console.log('\n='.repeat(80));
        console.log('📈 RESUMEN DE IMPORTACIÓN');
        console.log('='.repeat(80));
        
        const result = data.data;
        
        console.log('\n✅ Mensaje:', result.message);
        console.log('📊 Total de issues procesados:', result.totalIssues);
        
        if (result.imported && result.imported.length > 0) {
            console.log('\n📂 Proyectos importados:');
            result.imported.forEach((proj, index) => {
                console.log(`\n  ${index + 1}. Proyecto: ${proj.code}`);
                console.log(`     Título: ${proj.title}`);
                console.log(`     Tareas: ${proj.assignmentsCount}`);
            });
        } else {
            console.log('\n⚠️ No se importaron nuevos proyectos (posiblemente ya existen)');
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ EJEMPLO DE RESPUESTA EXITOSA:');
        console.log('='.repeat(80));
        console.log(`
{
  "success": true,
  "data": {
    "message": "Importados X proyectos con éxito",
    "imported": [
      {
        "code": "NC",
        "title": "NC",
        "assignmentsCount": 45
      }
    ],
    "totalIssues": 45
  }
}
        `);
    } else {
        console.log('\n' + '='.repeat(80));
        console.log('❌ ERROR EN LA IMPORTACIÓN');
        console.log('='.repeat(80));
        console.log('\nDetalles del error:');
        console.log('  - Mensaje:', data.error || data.message || 'Error desconocido');
        
        if (data.error) {
            console.log('\n💡 Posibles causas:');
            console.log('  1. Credenciales incorrectas');
            console.log('  2. Token de API expirado');
            console.log('  3. Permisos insuficientes en Jira');
            console.log('  4. JQL query inválido');
            console.log('  5. Problemas de conexión con Jira');
            console.log('  6. Timeout (más de 120 segundos)');
        }
    }
    
    console.log('\n' + '='.repeat(80));
    
})
.catch(error => {
    console.error('\n' + '='.repeat(80));
    console.error('💥 ERROR DE CONEXIÓN');
    console.error('='.repeat(80));
    console.error('\nError:', error.message);
    console.error('\n💡 Posibles causas:');
    console.error('  1. CORS no configurado correctamente');
    console.error('  2. Lambda no disponible');
    console.error('  3. Timeout de red');
    console.error('  4. API Gateway caído');
    console.error('\n' + '='.repeat(80));
});

// Mostrar ejemplo de estructura de datos que retorna la Lambda
console.log('\n' + '='.repeat(80));
console.log('📚 ESTRUCTURA DE DATOS ESPERADA');
console.log('='.repeat(80));
console.log(`
CASO EXITOSO:
{
  "success": true,
  "data": {
    "message": "Importados 1 proyectos con éxito",
    "imported": [
      {
        "code": "NC",
        "title": "NC",
        "assignmentsCount": 45
      }
    ],
    "totalIssues": 45
  }
}

CASO DE ERROR:
{
  "success": false,
  "error": {
    "message": "Error de Jira: 401 Unauthorized",
    "statusCode": 500
  }
}

CASO SIN NUEVOS PROYECTOS:
{
  "success": true,
  "data": {
    "message": "Importados 0 proyectos con éxito",
    "imported": [],
    "totalIssues": 45
  }
}
`);

console.log('='.repeat(80));
console.log('⏱️ Esperando respuesta de la Lambda...');
console.log('   (Puede tardar hasta 120 segundos dependiendo del número de issues)');
console.log('='.repeat(80));
