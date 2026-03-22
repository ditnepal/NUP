
async function testSubmitMultipart() {
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
    const response = await fetch('http://0.0.0.0:3000/api/v1/members/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullName: 'Test User' }),
    });
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Submit error:', error);
  }
}

testSubmitMultipart().catch(console.error);
