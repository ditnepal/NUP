import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:/app/applet/prisma/dev.db',
    },
  },
});

async function main() {
  console.log('Adding sample candidates...');

  const nationalUnit = await prisma.organizationUnit.findUnique({
    where: { code: 'NAT-001' }
  });

  if (!nationalUnit) {
    console.error('National Unit not found. Please run seed.ts first.');
    return;
  }

  const cycle = await prisma.electionCycle.create({
    data: {
      name: 'General Election 2026',
      year: 2026,
      type: 'GENERAL',
      status: 'UPCOMING',
      startDate: new Date('2026-11-20'),
      orgUnitId: nationalUnit.id
    }
  });

  const constituency = await prisma.constituency.create({
    data: {
      name: 'Kathmandu-1',
      code: 'KTM-1',
      type: 'HOUSE_OF_REPRESENTATIVES',
      province: 'Bagmati',
      district: 'Kathmandu',
      orgUnitId: nationalUnit.id
    }
  });

  const candidates = [
    {
      name: 'Resham Chaudhary',
      position: 'Member of Parliament',
      electionType: 'GENERAL',
      electionYear: 2026,
      province: 'Lumbini',
      district: 'Kailali',
      status: 'ACTIVE',
      orgUnitId: nationalUnit.id,
      electionCycleId: cycle.id,
      constituencyId: constituency.id
    },
    {
      name: 'Ranjeeta Shrestha',
      position: 'Member of Parliament',
      electionType: 'GENERAL',
      electionYear: 2026,
      province: 'Lumbini',
      district: 'Kailali',
      status: 'ACTIVE',
      orgUnitId: nationalUnit.id,
      electionCycleId: cycle.id,
      constituencyId: constituency.id
    }
  ];

  for (const candidate of candidates) {
    await prisma.candidate.create({
      data: candidate
    });
  }

  console.log('Candidates added successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
