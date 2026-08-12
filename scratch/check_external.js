async function checkHeaders() {
  try {
    const url = "https://jimmy.pearlpix.xyz/SERIES%2010/SINGLES/Kraken.2026.mp4?download=1";
    const res = await fetch(url, { method: 'HEAD' });
    console.log("Status:", res.status);
    console.log("Headers:");
    for (const [key, value] of res.headers) {
      console.log(`  ${key}: ${value}`);
    }
  } catch (err) {
    console.error("Error cause:", err.cause);
  }
}
checkHeaders();
