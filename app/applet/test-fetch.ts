async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/v1/public/config');
    const text = await res.text();
    console.log("Config response:", res.status, text);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}
main();
