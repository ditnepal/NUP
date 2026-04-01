import fetch from 'node-fetch';

async function test() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/public/candidates');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers.get('content-type'));
    const text = await response.text();
    console.log('Body:', text.substring(0, 100));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
