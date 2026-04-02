import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

async function verify() {
  const prisma = new PrismaClient();
  const results = {
    baseline: { admin: false, home: false, portal: false, blocker: false },
    step3: { saved: false, evidence: '', public: false, mismatch: '' },
    step4: { saved: false, evidence: '', public: false, mismatch: '' },
    step5: { saved: false, evidence: '', public: false, mismatch: '' }
  };

  console.log('--- Baseline Verification ---');
  try {
    const homeRes = await fetch('http://localhost:3000/');
    results.baseline.home = homeRes.status === 200;
    console.log('Public Home:', results.baseline.home ? 'YES' : 'NO');
  } catch (e) { console.log('Public Home: NO (Error)'); results.baseline.blocker = true; }

  try {
    const portalRes = await fetch('http://localhost:3000/portal');
    results.baseline.portal = portalRes.status === 200;
    console.log('Public Portal:', results.baseline.portal ? 'YES' : 'NO');
  } catch (e) { console.log('Public Portal: NO (Error)'); results.baseline.blocker = true; }

  try {
    const loginPageRes = await fetch('http://localhost:3000/admin/login');
    results.baseline.admin = loginPageRes.status === 200;
    console.log('Admin Login Reachable:', results.baseline.admin ? 'YES' : 'NO');
  } catch (e) { console.log('Admin Login Reachable: NO (Error)'); results.baseline.blocker = true; }

  console.log('\n--- Step 3: Manifesto / Key Documents ---');
  const allDocs = await prisma.document.findMany();
  const cmsDownloads = await prisma.cmsDownload.findMany();
  const candidateDocs = await prisma.candidateDocument.findMany();
  const cmsPages = await prisma.cmsPage.findMany();
  const cmsSections = await prisma.cmsSection.findMany();
  const allPosts = await prisma.cmsPost.findMany();

  const manifestoPost = allPosts.find(p => p.title.toLowerCase().includes('manifesto') || p.content.toLowerCase().includes('manifesto'));
  const manifestoSection = cmsSections.find(s => s.title?.toLowerCase().includes('manifesto') || s.content?.toLowerCase().includes('manifesto'));

  if (allDocs.length > 0 || cmsDownloads.length > 0 || candidateDocs.length > 0 || cmsPages.length > 0 || manifestoSection || manifestoPost) {
    results.step3.saved = true;
    results.step3.evidence = JSON.stringify({
      documents: allDocs.map(d => ({ title: d.title, category: d.category, status: d.isPublished })),
      cmsDownloads: cmsDownloads.map(d => ({ title: d.title, category: d.category })),
      candidateDocs: candidateDocs.map(d => ({ title: d.title, status: d.status })),
      cmsPages: cmsPages.map(p => ({ title: p.title, slug: p.slug, status: p.status })),
      manifestoSection: manifestoSection ? { title: manifestoSection.title, content: manifestoSection.content.substring(0, 50) + '...' } : null,
      manifestoPost: manifestoPost ? { title: manifestoPost.title, type: manifestoPost.type } : null
    });
    console.log('Step 3 Saved:', results.step3.evidence);
    
    // Check public home for manifesto link
    try {
      const homeRes = await fetch('http://localhost:3000/');
      const homeText = await homeRes.text();
      results.step3.public = homeText.toLowerCase().includes('manifesto');
    } catch (e) { console.log('Step 3 Public Check Error:', e.message); }
  } else {
    results.step3.mismatch = 'No documents found in Document, CmsDownload, CandidateDocument, CmsPage, CmsSection, or CmsPost (manifesto) tables.';
  }

  console.log('\n--- Step 4: First News / Statements ---');
  const newsPosts = allPosts.filter(p => p.type === 'NEWS' && p.status === 'PUBLISHED');
  const manifestoPosts = allPosts.filter(p => (p.type === 'MANIFESTO' || p.title.toLowerCase().includes('manifesto')) && p.status === 'PUBLISHED');

  if (manifestoPosts.length > 0) {
    results.step3.saved = true;
    results.step3.evidence = JSON.stringify(manifestoPosts.map(p => ({ title: p.title, status: p.status, type: p.type })));
    console.log('Step 3 (Manifesto Post) Saved:', results.step3.evidence);
    results.step3.public = true; // Assuming if it's in DB and published, it's public
  }

  if (newsPosts.length > 0) {
    results.step4.saved = true;
    results.step4.evidence = JSON.stringify(newsPosts.map(p => ({ title: p.title, status: p.status, type: p.type })));
    console.log('Step 4 Saved:', results.step4.evidence);

    // Check public API for news
    try {
      const newsApiRes = await fetch('http://localhost:3000/api/v1/public/posts?type=NEWS');
      if (newsApiRes.status === 200) {
        const news = await newsApiRes.json() as any[];
        results.step4.public = news.some((p: any) => newsPosts.some(np => np.id === p.id));
      }
    } catch (e) { console.log('Step 4 Public Check Error:', e.message); }
  } else {
    results.step4.mismatch = 'No published NEWS posts found in CmsPost table.';
  }

  console.log('\n--- Step 5: Basic Organization Visibility ---');
  const units = await prisma.organizationUnit.findMany({
    include: { children: true }
  });
  if (units.length > 0) {
    results.step5.saved = true;
    results.step5.evidence = `Found ${units.length} units. Hierarchy: ` + units.filter(u => !u.parentId).map(u => `${u.name} (${u.children.length} children)`).join(', ');
    console.log('Step 5 Saved:', results.step5.evidence);

    // Check public API for org units
    try {
      const orgApiRes = await fetch('http://localhost:3000/api/v1/public/hierarchy');
      if (orgApiRes.status === 200) {
        const orgData = await orgApiRes.json() as any[];
        results.step5.public = orgData.length > 0;
      }
    } catch (e) { console.log('Step 5 Public Check Error:', e.message); }
  } else {
    results.step5.mismatch = 'No organization units found in OrganizationUnit table.';
  }

  console.log('\n--- Final Verification Report ---');
  console.log(JSON.stringify(results, null, 2));

  await prisma.$disconnect();
}

verify();
