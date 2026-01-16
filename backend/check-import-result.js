const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkImportResult() {
    try {
        // Buscar proyecto NC para team darwin
        const project = await prisma.project.findFirst({
            where: {
                code: 'NC',
                team: 'darwin'
            },
            include: {
                assignments: true
            }
        });

        if (!project) {
            console.log('❌ Proyecto NC no encontrado para team darwin');
            return;
        }

        console.log('='.repeat(80));
        console.log('📊 RESULTADO DE LA IMPORTACIÓN');
        console.log('='.repeat(80));
        console.log('\n✅ Proyecto encontrado:');
        console.log('  - Code:', project.code);
        console.log('  - Title:', project.title);
        console.log('  - Team:', project.team);
        console.log('  - Type:', project.type);
        console.log('  - Priority:', project.priority);
        console.log('  - Status:', project.status);
        console.log('  - Start Date:', project.startDate);
        console.log('  - End Date:', project.endDate);
        console.log('  - Jira Project Key:', project.jiraProjectKey);
        console.log('  - Jira URL:', project.jiraUrl);
        console.log('  - Created At:', project.createdAt);

        console.log('\n📋 Assignments (Tareas):');
        console.log('  - Total creados:', project.assignments.length);
        
        if (project.assignments.length > 0) {
            console.log('\n  Primeros 5 assignments:');
            project.assignments.slice(0, 5).forEach((a, i) => {
                console.log(`\n  ${i + 1}. ${a.title}`);
                console.log(`     Jira Issue: ${a.jiraIssueKey}`);
                console.log(`     Horas: ${a.hours}`);
                console.log(`     Fecha: ${a.date}`);
            });
        }

        console.log('\n' + '='.repeat(80));
        console.log('📦 RESPUESTA QUE SE RETORNARÍA:');
        console.log('='.repeat(80));
        console.log(JSON.stringify({
            success: true,
            data: {
                message: `Importados 1 proyectos con éxito`,
                imported: [
                    {
                        code: project.code,
                        title: project.title,
                        assignmentsCount: project.assignments.length
                    }
                ],
                totalIssues: 5000
            }
        }, null, 2));
        console.log('='.repeat(80));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkImportResult();
