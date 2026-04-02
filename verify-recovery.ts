async function verify() {
  console.log('Verifying /api/v1/public/config...');
  try {
    const configRes = await fetch('http://localhost:3000/api/v1/public/config');
    console.log('Config Status:', configRes.status);
    const configData = await configRes.json();
    console.log('Config Data:', JSON.stringify(configData).substring(0, 100));
  } catch (error) {
    console.error('Config Error:', error);
  }

  console.log('\nVerifying Admin Login...');
  try {
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nup.org.np', password: 'admin123' })
    });
    console.log('Login Status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('Login Data (token):', loginData.token ? 'Present' : 'Missing');
  } catch (error) {
    console.error('Login Error:', error);
  }

  console.log('\nVerifying Public Home...');
  try {
    const homeRes = await fetch('http://localhost:3000/');
    console.log('Home Status:', homeRes.status);
  } catch (error) {
    console.error('Home Error:', error);
  }

  console.log('\nVerifying Public Portal...');
  try {
    const portalRes = await fetch('http://localhost:3000/portal');
    console.log('Portal Status:', portalRes.status);
  } catch (error) {
    console.error('Portal Error:', error);
  }
}

verify();
