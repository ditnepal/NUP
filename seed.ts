import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function main() {
  console.log('Seeding database...');

  // Create National Unit
  const nationalUnit = await prisma.organizationUnit.upsert({
    where: { code: 'NAT-001' },
    update: {},
    create: {
      name: 'National Headquarters',
      level: 'NATIONAL',
      code: 'NAT-001',
    },
  });

  // Create Regional Units
  const regionalUnit1 = await prisma.organizationUnit.upsert({
    where: { code: 'REG-001' },
    update: {},
    create: {
      name: 'Bagmati Regional Office',
      level: 'PROVINCE',
      code: 'REG-001',
      parentId: nationalUnit.id,
    },
  });

  const regionalUnit2 = await prisma.organizationUnit.upsert({
    where: { code: 'REG-002' },
    update: {},
    create: {
      name: 'Gandaki Regional Office',
      level: 'PROVINCE',
      code: 'REG-002',
      parentId: nationalUnit.id,
    },
  });

  // Create Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nup.org.np' },
    update: {
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@nup.org.np',
      passwordHash,
      displayName: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
      orgUnitId: nationalUnit.id,
    },
  });

  // Create Member User
  const memberPasswordHash = await bcrypt.hash('member123', salt);
  const memberUser = await prisma.user.upsert({
    where: { email: 'member@nup.org.np' },
    update: {
      passwordHash: memberPasswordHash,
      role: 'MEMBER',
      isActive: true,
    },
    create: {
      email: 'member@nup.org.np',
      passwordHash: memberPasswordHash,
      displayName: 'John Member',
      role: 'MEMBER',
      isActive: true,
      orgUnitId: nationalUnit.id,
    },
  });

  // Create Member Profile for the member user
  await prisma.member.upsert({
    where: { userId: memberUser.id },
    update: {
      status: 'ACTIVE',
    },
    create: {
      userId: memberUser.id,
      fullName: 'John Member',
      trackingCode: 'T-MEMBER001',
      membershipId: 'NUP-2026-0001',
      status: 'ACTIVE',
      province: 'Bagmati Province',
      district: 'Kathmandu',
      localLevel: 'Kathmandu Metro',
      ward: 1,
      orgUnitId: nationalUnit.id,
      joinedDate: new Date(),
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  // Create Donor Profile for the member user
  await prisma.donorProfile.upsert({
    where: { userId: memberUser.id },
    update: {
      totalDonated: 5200,
      donationCount: 3,
    },
    create: {
      userId: memberUser.id,
      fullName: 'John Member',
      email: 'member@nup.org.np',
      totalDonated: 5200,
      donationCount: 3,
    },
  });

  // Create Sample News
  const newsCategory = await prisma.cmsCategory.upsert({
    where: { slug: 'news' },
    update: {},
    create: {
      name: 'News',
      slug: 'news',
      type: 'POST',
    },
  });

  await prisma.cmsPost.upsert({
    where: { slug: 'new-economic-policy-2026' },
    update: {},
    create: {
      title: 'New Economic Policy 2026 Released',
      slug: 'new-economic-policy-2026',
      content: 'The National Unity Party has officially released its economic roadmap for the next five years...',
      excerpt: 'A comprehensive guide to our economic vision.',
      type: 'NEWS',
      status: 'PUBLISHED',
      authorId: adminUser.id,
      categoryId: newsCategory.id,
      publishedAt: new Date(),
    },
  });

  await prisma.cmsPost.upsert({
    where: { slug: 'membership-drive-success' },
    update: {},
    create: {
      title: 'Membership Drive Hits 1 Million Milestone',
      slug: 'membership-drive-success',
      content: 'We are proud to announce that our party has reached a historic milestone of 1 million active members...',
      excerpt: 'A historic achievement for the party.',
      type: 'NEWS',
      status: 'PUBLISHED',
      authorId: adminUser.id,
      categoryId: newsCategory.id,
      publishedAt: new Date(),
    },
  });

  // Create Sample Events
  await prisma.event.upsert({
    where: { id: 'event-1' },
    update: {},
    create: {
      id: 'event-1',
      title: 'National Convention 2026',
      description: 'The annual gathering of all party members to discuss future strategies.',
      type: 'MEETING',
      status: 'PLANNED',
      startDate: new Date('2026-04-15T09:00:00Z'),
      location: 'Kathmandu City Hall',
      organizerId: adminUser.id,
    },
  });

  await prisma.event.upsert({
    where: { id: 'event-2' },
    update: {},
    create: {
      id: 'event-2',
      title: 'Local Outreach Program',
      description: 'Connecting with local communities to understand their needs.',
      type: 'RALLY',
      status: 'PLANNED',
      startDate: new Date('2026-03-28T10:00:00Z'),
      location: 'Pokhara Lakeside',
      organizerId: adminUser.id,
    },
  });

  // Create Sample Members
  const testMembers = [
    { fullName: 'Pending Member 1', trackingCode: 'T-PENDING001', status: 'PENDING', province: 'Bagmati', district: 'Kathmandu', localLevel: 'KMC', ward: 1 },
    { fullName: 'Verified Member 1', trackingCode: 'T-VERIFIED001', status: 'VERIFIED', province: 'Bagmati', district: 'Kathmandu', localLevel: 'KMC', ward: 2 },
    { fullName: 'Active Member 1', trackingCode: 'T-ACTIVE001', status: 'ACTIVE', province: 'Bagmati', district: 'Kathmandu', localLevel: 'KMC', ward: 3 },
  ];

  for (const memberData of testMembers) {
    await prisma.member.upsert({
      where: { trackingCode: memberData.trackingCode },
      update: { status: memberData.status },
      create: {
        ...memberData,
        membershipId: `NUP-${memberData.trackingCode}`,
        orgUnitId: nationalUnit.id,
      },
    });
  }

  console.log('Seeding completed.');
  console.log('Admin User:', adminUser.email);
  console.log('Admin Password: admin123');
  console.log('Member User:', memberUser.email);
  console.log('Member Password: member123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
