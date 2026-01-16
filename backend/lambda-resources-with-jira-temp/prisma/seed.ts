import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Domains
  console.log('📁 Creating domains...');
  const domains = await Promise.all([
    prisma.domain.create({
      data: {
        name: 'Atención',
        description: 'Proyectos relacionados con atención al cliente'
      }
    }),
    prisma.domain.create({
      data: {
        name: 'Facturación y Cobros',
        description: 'Proyectos de facturación y gestión de cobros'
      }
    }),
    prisma.domain.create({
      data: {
        name: 'Tecnología',
        description: 'Proyectos de infraestructura y tecnología'
      }
    }),
    prisma.domain.create({
      data: {
        name: 'Contratación',
        description: 'Proyectos de contratación y gestión de contratos'
      }
    }),
    prisma.domain.create({
      data: {
        name: 'Integración',
        description: 'Proyectos de integración de sistemas'
      }
    }),
    prisma.domain.create({
      data: {
        name: 'Datos',
        description: 'Proyectos de análisis y gestión de datos'
      }
    })
  ]);
  console.log(`✅ Created ${domains.length} domains`);

  // 2. Create Statuses
  console.log('📊 Creating statuses...');
  const statuses = await Promise.all([
    prisma.status.create({ data: { name: 'Idea', order: 1 } }),
    prisma.status.create({ data: { name: 'Análisis', order: 2 } }),
    prisma.status.create({ data: { name: 'Diseño Detallado', order: 3 } }),
    prisma.status.create({ data: { name: 'Desarrollo', order: 4 } }),
    prisma.status.create({ data: { name: 'Pruebas', order: 5 } }),
    prisma.status.create({ data: { name: 'Despliegue', order: 6 } }),
    prisma.status.create({ data: { name: 'Finalizado', order: 7 } })
  ]);
  console.log(`✅ Created ${statuses.length} statuses`);

  // 3. Create Skills
  console.log('🎯 Creating skills...');
  const skills = await Promise.all([
    prisma.skill.create({
      data: {
        name: 'Project Management',
        description: 'Gestión de proyectos y coordinación'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Análisis',
        description: 'Análisis de requisitos y diseño funcional'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Diseño',
        description: 'Diseño UX/UI y arquitectura'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Construcción',
        description: 'Desarrollo y programación'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'QA',
        description: 'Testing y aseguramiento de calidad'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'General',
        description: 'Tareas generales y soporte'
      }
    })
  ]);
  console.log(`✅ Created ${skills.length} skills`);

  // Create skill lookup map
  const skillMap = skills.reduce((acc, skill) => {
    acc[skill.name] = skill.id;
    return acc;
  }, {} as Record<string, string>);

  // 4. Create Projects
  console.log('📋 Creating projects...');
  const projectsData = [
    {
      code: 'NC-249',
      title: 'Migración Sistema Legacy',
      description: 'Migración completa del sistema legacy a nueva arquitectura cloud',
      type: 'Proyecto',
      priority: 'muy-alta',
      domain: 'Tecnología',
      status: 'Desarrollo'
    },
    {
      code: 'NC-15',
      title: 'Portal Cliente Web',
      description: 'Desarrollo de nuevo portal web para clientes con funcionalidades avanzadas',
      type: 'Proyecto',
      priority: 'alta',
      domain: 'Atención',
      status: 'Desarrollo'
    },
    {
      code: 'NC-16',
      title: 'Sistema Facturación Automática',
      description: 'Implementación de sistema automatizado de facturación y cobros',
      type: 'Proyecto',
      priority: 'muy-alta',
      domain: 'Facturación y Cobros',
      status: 'Desarrollo'
    },
    {
      code: 'NC-17',
      title: 'App Mobile Clientes',
      description: 'Aplicación móvil nativa para iOS y Android',
      type: 'Proyecto',
      priority: 'alta',
      domain: 'Atención',
      status: 'Diseño Detallado'
    },
    {
      code: 'NC-18',
      title: 'Integración CRM',
      description: 'Integración con sistema CRM corporativo',
      type: 'Evolutivo',
      priority: 'media',
      domain: 'Tecnología',
      status: 'Desarrollo'
    },
    {
      code: 'NC-19',
      title: 'Plataforma Analytics',
      description: 'Plataforma de análisis de datos y reporting avanzado',
      type: 'Proyecto',
      priority: 'media',
      domain: 'Tecnología',
      status: 'Diseño Detallado'
    },
    {
      code: 'NC-20',
      title: 'Sistema Gestión Contratos',
      description: 'Sistema integral de gestión y seguimiento de contratos',
      type: 'Evolutivo',
      priority: 'alta',
      domain: 'Contratación',
      status: 'Desarrollo'
    }
  ];

  const projects = [];
  for (const projectData of projectsData) {
    const domain = domains.find(d => d.name === projectData.domain);
    const status = statuses.find(s => s.name === projectData.status);
    
    if (!domain || !status) {
      console.error(`❌ Missing domain or status for project ${projectData.code}`);
      continue;
    }

    const project = await prisma.project.create({
      data: {
        code: projectData.code,
        title: projectData.title,
        description: projectData.description,
        type: projectData.type,
        priority: projectData.priority,
        domainId: domain.id,
        statusId: status.id
      }
    });
    projects.push(project);
  }
  console.log(`✅ Created ${projects.length} projects`);

  // Create project lookup map
  const projectMap = projects.reduce((acc, project) => {
    acc[project.code] = project.id;
    return acc;
  }, {} as Record<string, string>);

  // 5. Create Project Skill Breakdown
  console.log('📊 Creating project skill breakdowns...');
  const projectSkillBreakdownData = {
    'NC-249': {
      'Construcción': { jun: 200, jul: 100 },
      'Análisis': { jun: 80, jul: 40 },
      'QA': { jun: 40, jul: 20 }
    },
    'NC-15': {
      'Construcción': { jun: 80, jul: 160, ago: 80 },
      'Análisis': { jun: 50, jul: 100, ago: 50 },
      'Diseño': { jun: 30, jul: 60, ago: 30 }
    },
    'NC-16': {
      'Construcción': { jun: 160, jul: 240, ago: 240, sep: 160 },
      'Análisis': { jun: 100, jul: 150, ago: 150, sep: 100 },
      'Diseño': { jun: 40, jul: 60, ago: 60, sep: 40 },
      'QA': { jun: 20, jul: 30, ago: 30, sep: 20 }
    },
    'NC-17': {
      'Construcción': { jun: 80, jul: 160 },
      'Análisis': { jun: 50, jul: 100 },
      'Diseño': { jun: 30, jul: 60 }
    },
    'NC-18': {
      'Construcción': { jun: 80, jul: 80, ago: 160 },
      'Análisis': { jun: 50, jul: 50, ago: 100 },
      'General': { jun: 30, jul: 30, ago: 60 }
    },
    'NC-19': {
      'Construcción': { ago: 80, sep: 160, oct: 240 },
      'Análisis': { ago: 50, sep: 100, oct: 150 },
      'QA': { ago: 30, sep: 60, oct: 90 }
    },
    'NC-20': {
      'Construcción': { jul: 80, ago: 160, sep: 240, oct: 240, nov: 160 },
      'Análisis': { jul: 50, ago: 100, sep: 150, oct: 150, nov: 100 },
      'Project Management': { jul: 20, ago: 40, sep: 60, oct: 60, nov: 40 },
      'QA': { jul: 10, ago: 20, sep: 30, oct: 30, nov: 20 }
    }
  };

  const monthMap: Record<string, number> = {
    ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
    jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12
  };

  let breakdownCount = 0;
  for (const [projectCode, skillsData] of Object.entries(projectSkillBreakdownData)) {
    const projectId = projectMap[projectCode];
    if (!projectId) continue;

    for (const [skillName, monthsData] of Object.entries(skillsData)) {
      const skillId = skillMap[skillName];
      if (!skillId) continue;

      for (const [monthKey, hours] of Object.entries(monthsData)) {
        const month = monthMap[monthKey];
        if (!month || hours === 0) continue;

        await prisma.projectSkillBreakdown.create({
          data: {
            projectId,
            skillId,
            month,
            year: 2025,
            hours: Number(hours)
          }
        });
        breakdownCount++;
      }
    }
  }
  console.log(`✅ Created ${breakdownCount} project skill breakdown entries`);

  // 6. Create Sample Resources
  console.log('👥 Creating sample resources...');
  const resources = await Promise.all([
    prisma.resource.create({
      data: {
        code: 'RES-001',
        name: 'Juan Pérez',
        email: 'juan.perez@naturgy.com',
        defaultCapacity: 160,
        active: true
      }
    }),
    prisma.resource.create({
      data: {
        code: 'RES-002',
        name: 'María García',
        email: 'maria.garcia@naturgy.com',
        defaultCapacity: 160,
        active: true
      }
    }),
    prisma.resource.create({
      data: {
        code: 'RES-003',
        name: 'Carlos López',
        email: 'carlos.lopez@naturgy.com',
        defaultCapacity: 160,
        active: true
      }
    }),
    prisma.resource.create({
      data: {
        code: 'RES-004',
        name: 'Ana Martín',
        email: 'ana.martin@naturgy.com',
        defaultCapacity: 160,
        active: true
      }
    }),
    prisma.resource.create({
      data: {
        code: 'RES-005',
        name: 'Pedro Sánchez',
        email: 'pedro.sanchez@naturgy.com',
        defaultCapacity: 160,
        active: true
      }
    })
  ]);
  console.log(`✅ Created ${resources.length} resources`);

  // 7. Create Resource Skills
  console.log('🎯 Assigning skills to resources...');
  const resourceSkillsData = [
    { resource: 'RES-001', skills: ['Construcción', 'Análisis'], proficiency: 'senior' },
    { resource: 'RES-002', skills: ['Diseño', 'Análisis'], proficiency: 'mid' },
    { resource: 'RES-003', skills: ['Project Management', 'Análisis'], proficiency: 'senior' },
    { resource: 'RES-004', skills: ['QA', 'Análisis'], proficiency: 'mid' },
    { resource: 'RES-005', skills: ['Construcción', 'QA'], proficiency: 'mid' }
  ];

  let resourceSkillCount = 0;
  for (const rsData of resourceSkillsData) {
    const resource = resources.find(r => r.code === rsData.resource);
    if (!resource) continue;

    for (const skillName of rsData.skills) {
      const skillId = skillMap[skillName];
      if (!skillId) continue;

      await prisma.resourceSkill.create({
        data: {
          resourceId: resource.id,
          skillId,
          proficiency: rsData.proficiency
        }
      });
      resourceSkillCount++;
    }
  }
  console.log(`✅ Created ${resourceSkillCount} resource-skill assignments`);

  // 8. Create Capacity for 2025 (all 12 months)
  console.log('📅 Creating capacity entries for 2025...');
  let capacityCount = 0;
  for (const resource of resources) {
    for (let month = 1; month <= 12; month++) {
      await prisma.capacity.create({
        data: {
          resourceId: resource.id,
          month,
          year: 2025,
          totalHours: resource.defaultCapacity
        }
      });
      capacityCount++;
    }
  }
  console.log(`✅ Created ${capacityCount} capacity entries`);

  console.log('✨ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
