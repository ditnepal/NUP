
async function testSubmitInvalid() {
  const formData = new FormData();
  formData.append('fullName', 'T'); // Too short
  formData.append('citizenshipNumber', '123456789');
  formData.append('province', 'Bagmati');
  formData.append('district', 'Kathmandu');
  formData.append('localLevel', 'KMC');
  formData.append('ward', 'invalid'); // Should be a number
  formData.append('orgUnitId', '739d2c96-4618-4343-a669-ded8ce8d821e');
  formData.append('declaration', 'true');
  formData.append('applicationMode', 'FORM');

  try {
    const response = await fetch('http://localhost:3000/api/v1/members/apply', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Submit error:', error);
  }
}

testSubmitInvalid().catch(console.error);
