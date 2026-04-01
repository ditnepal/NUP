async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nup.org.np', password: 'admin123' })
    });
    const text = await res.text();
    console.log("Login response:", res.status, text);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}
main();
