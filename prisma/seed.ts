import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding strategic analytics data...');

  // 1. Create some Organization Units if they don't exist
  const units = [
    { name: 'Bagmati Province', level: 'PROVINCE' },
    { name: 'Gandaki Province', level: 'PROVINCE' },
    { name: 'Lumbini Province', level: 'PROVINCE' },
    { name: 'Koshi Province', level: 'PROVINCE' },
    { name: 'Madhesh Province', level: 'PROVINCE' },
    { name: 'Karnali Province', level: 'PROVINCE' },
    { name: 'Sudurpashchim Province', level: 'PROVINCE' },
  ];

  for (const unit of units) {
    const existing = await prisma.organizationUnit.findFirst({ where: { name: unit.name } });
    if (!existing) {
      const newUnit = await prisma.organizationUnit.create({ data: unit });
      
      // Add Area Strength Score
      await prisma.areaStrengthScore.create({
        data: {
          orgUnitId: newUnit.id,
          partyStrength: Math.floor(Math.random() * 40) + 30,
          oppositionStrength: Math.floor(Math.random() * 30) + 20,
          swingVoters: Math.floor(Math.random() * 20) + 10,
        }
      });
    }
  }

  // 2. Create some Ground Intelligence Reports
  const reports = [
    { type: 'SENTIMENT', content: 'Strong support for NUP in Kathmandu urban areas due to recent infrastructure policy.', sentimentScore: 80 },
    { type: 'PUBLIC_ISSUE', content: 'Concerns about water supply in Lalitpur ward 4. Opposition capitalizing on this.', sentimentScore: -20 },
    { type: 'BOOTH_READINESS', content: 'Booth 102 in Pokhara is fully staffed and ready for polling day.', sentimentScore: 90 },
    { type: 'COMPETITOR_ACTIVITY', content: 'Opposition party holding a large rally in Biratnagar. High turnout reported.', sentimentScore: -40 },
  ];

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) {
    for (const report of reports) {
      await prisma.groundIntelligenceReport.create({
        data: {
          ...report,
          reporterId: admin.id,
        }
      });
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
