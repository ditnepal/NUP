async function testApi() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/members?status=PENDING');
    const data = await response.json();
    console.log('API response:', data);
  } catch (error) {
    console.error('API error:', error);
  }
}
testApi().catch(console.error);
