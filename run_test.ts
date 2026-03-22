import prisma from './src/lib/prisma';

async function runTest() {
  const formData = new FormData();
  formData.append('fullName', 'Test User 2');
  formData.append('citizenshipNumber', '9876543210');
  formData.append('orgUnitId', '3d4c032f-a943-42e6-b61b-c40cdd409047');
  formData.append('applicationMode', 'FORM');
  formData.append('declaration', 'true');
  formData.append('province', 'Bagmati');
  formData.append('district', 'Kathmandu');
  formData.append('localLevel', 'KMC');
  formData.append('ward', '1');

  const response = await fetch('http://0.0.0.0:3000/api/v1/members/apply', {
    method: 'POST',
    body: formData,
  });
  
  console.log('Response status:', response.status);
  console.log('Response body:', await response.text());
  
  const members = await prisma.member.findMany();
  console.log('Members count:', members.length);
  const testUser = members.find(m => m.fullName === 'Test User 2');
  console.log('Test User found:', !!testUser);
  if (testUser) {
    console.log('Test User orgUnitId:', testUser.orgUnitId);
    console.log('Test User status:', testUser.status);
  }
}

runTest().catch(console.error);
