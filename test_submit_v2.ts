import { createApp } from './server';

async function testSubmit() {
  const app = await createApp();
  const server = app.listen(3001); // Use a different port
  
  const formData = new FormData();
  formData.append('fullName', 'Test User');
  formData.append('citizenshipNumber', '123456789');
  formData.append('province', 'Bagmati');
  formData.append('district', 'Kathmandu');
  formData.append('localLevel', 'KMC');
  formData.append('ward', '1');
  formData.append('orgUnitId', '739d2c96-4618-4343-a669-ded8ce8d821e');
  formData.append('declaration', 'true');
  formData.append('applicationMode', 'FORM');

  try {
    const response = await fetch('http://localhost:3001/api/v1/members/apply', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
  } catch (error) {
    console.error('Submit error:', error);
  } finally {
    server.close();
  }
}

testSubmit().catch(console.error);
