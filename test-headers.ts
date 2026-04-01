import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/v1/debug/headers');
    const data = await res.json();
    console.log('Headers:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Test failed:', e);
  }
}

test();
