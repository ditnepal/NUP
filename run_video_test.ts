import prisma from './src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function runTest() {
  const formData = new FormData();
  formData.append('mobile', '9876543210');
  formData.append('orgUnitId', '3d4c032f-a943-42e6-b61b-c40cdd409047');
  formData.append('identityDocumentType', 'CITIZENSHIP');
  formData.append('applicationMode', 'VIDEO');
  
  // Create dummy files
  const idDocPath = path.join(process.cwd(), 'idDoc.txt');
  fs.writeFileSync(idDocPath, 'dummy id doc');
  const videoPath = path.join(process.cwd(), 'video.mp4');
  fs.writeFileSync(videoPath, 'dummy video');
  
  formData.append('identityDocument', new Blob([fs.readFileSync(idDocPath)]), 'idDoc.txt');
  formData.append('video', new Blob([fs.readFileSync(videoPath)]), 'video.mp4');

  const response = await fetch('http://0.0.0.0:3000/api/v1/members/apply', {
    method: 'POST',
    body: formData,
  });
  
  console.log('Response status:', response.status);
  console.log('Response body:', await response.text());
  
  const members = await prisma.member.findMany();
  console.log('Members count:', members.length);
  const videoMember = members.find(m => m.applicationMode === 'VIDEO');
  console.log('Video Member found:', !!videoMember);
  if (videoMember) {
    console.log('Video Member status:', videoMember.status);
    console.log('Video Member videoUrl:', videoMember.videoUrl);
  }
  
  // Cleanup
  fs.unlinkSync(idDocPath);
  fs.unlinkSync(videoPath);
}

runTest().catch(console.error);
