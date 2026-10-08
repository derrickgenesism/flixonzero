const https = require('https');
const url = 'https://cdn.flixon.net/TUCKER%20AND%20DALE%20VS%20EVIL%20__%20VJ%20EMMY%20%23Horror%20(2).mkv';
const req = https.request(url, { method: 'HEAD' }, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Accept-Ranges:', res.headers['accept-ranges']);
  console.log('Content-Type:', res.headers['content-type']);
});
req.end();
