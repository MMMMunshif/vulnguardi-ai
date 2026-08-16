import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const organization = await prisma.organization.upsert({
    where: {
      email: 'admin@vulnguard.ai',
    },
    update: {},
    create: {
      name: 'VulnGuard AI',
      email: 'admin@vulnguard.ai',
      phone: '+94 771234567',
      website: 'https://vulnguard.ai',
      industry: 'Cyber Security',
      country: 'Sri Lanka',
      status: 'ACTIVE',
    },
  });

  const superAdminRole = await prisma.role.upsert({
    where: {
      roleName: 'Super Admin',
    },
    update: {},
    create: {
      roleName: 'Super Admin',
      description: 'Full system administrator access',
    },
  });

  await prisma.role.upsert({
    where: {
      roleName: 'Organization Admin',
    },
    update: {},
    create: {
      roleName: 'Organization Admin',
      description: 'Manages users and organization resources',
    },
  });

  await prisma.role.upsert({
    where: {
      roleName: 'Security Analyst',
    },
    update: {},
    create: {
      roleName: 'Security Analyst',
      description: 'Reviews vulnerabilities and remediation tasks',
    },
  });

  await prisma.role.upsert({
    where: {
      roleName: 'IT Technician',
    },
    update: {},
    create: {
      roleName: 'IT Technician',
      description: 'Handles assigned remediation tasks',
    },
  });

  const existingDepartment = await prisma.department.findFirst({
    where: {
      name: 'IT Security',
      organizationId: organization.id,
    },
  });

  if (!existingDepartment) {
    await prisma.department.create({
      data: {
        name: 'IT Security',
        description: 'Cyber security and vulnerability management team',
        organizationId: organization.id,
      },
    });
  }

  console.log('✅ Seed completed successfully');
  console.log('Organization:', organization.name);
  console.log('Default Role:', superAdminRole.roleName);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });