// Test para ver qué custom fields tiene Jira
const fetch = require('node-fetch');

const jiraUrl = 'https://naturgy-adn.atlassian.net';
const email = process.argv[2]; // Pasar como argumento
const apiToken = process.argv[3]; // Pasar como argumento

if (!email || !apiToken) {
  console.log('Uso: node test-jira-fields.js EMAIL API_TOKEN');
  process.exit(1);
}

async function testJiraFields() {
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  
  // Obtener un issue específico para ver sus campos
  const url = `${jiraUrl}/rest/api/3/search?jql=project='NC'&maxResults=1`;
  
  console.log('Consultando Jira...\n');
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    console.error('Error:', response.status, response.statusText);
    return;
  }
  
  const data = await response.json();
  
  if (data.issues && data.issues.length > 0) {
    const issue = data.issues[0];
    console.log(`Issue: ${issue.key}`);
    console.log(`Summary: ${issue.fields.summary}\n`);
    
    console.log('=== CUSTOM FIELDS ===\n');
    
    // Buscar todos los customfield_
    Object.keys(issue.fields).forEach(key => {
      if (key.startsWith('customfield_')) {
        const value = issue.fields[key];
        console.log(`${key}:`, JSON.stringify(value, null, 2));
      }
    });
  } else {
    console.log('No se encontraron issues');
  }
}

testJiraFields().catch(console.error);
