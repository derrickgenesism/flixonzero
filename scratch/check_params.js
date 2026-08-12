const params = [
  'download=1',
  'dl=1',
  'attachment=1',
  'response-content-disposition=attachment',
  'disposition=attachment',
  'action=download'
];

async function checkParams() {
  const baseUrl = "https://jimmy.pearlpix.xyz/SERIES%2010/SINGLES/Kraken.2026.mp4";
  for (const p of params) {
    try {
      const url = `${baseUrl}?${p}`;
      const res = await fetch(url, { method: 'HEAD' });
      const cd = res.headers.get('content-disposition');
      console.log(`Param: ${p} -> Content-Disposition: ${cd}`);
    } catch (err) {
      console.error(`Param: ${p} -> Error: ${err.message}`);
    }
  }
}

checkParams();
