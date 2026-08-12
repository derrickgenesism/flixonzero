async function checkCORS() {
  try {
    const url = "https://jimmy.pearlpix.xyz/SERIES%2010/SINGLES/Kraken.2026.mp4?download=1";
    const res = await fetch(url, { 
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://flixon.net',
        'Access-Control-Request-Method': 'GET'
      }
    });
    console.log("Status:", res.status);
    console.log("CORS Headers:");
    for (const [key, value] of res.headers) {
      if (key.toLowerCase().startsWith('access-control-')) {
        console.log(`  ${key}: ${value}`);
      }
    }
  } catch (err) {
    console.error("Error cause:", err.cause);
  }
}
checkCORS();
