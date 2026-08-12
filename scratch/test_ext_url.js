async function testUrl() {
  const url = "https://jimmy.pearlpix.xyz/SERIES%2010/SINGLES/Kraken.2026.mp4?download=1&response-content-disposition=attachment";
  const res = await fetch(url, { method: 'HEAD' });
  console.log("Status:", res.status);
  console.log("Content-Disposition:", res.headers.get('content-disposition'));
}
testUrl();
