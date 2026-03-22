import prisma from './src/lib/prisma';

async function checkCms() {
  const pages = await prisma.cmsPage.findMany();
  console.log('CMS Pages:', pages.length);
  
  const posts = await prisma.cmsPost.findMany();
  console.log('CMS Posts:', JSON.stringify(posts, null, 2));
}

checkCms().catch(console.error).finally(() => prisma.$disconnect());
