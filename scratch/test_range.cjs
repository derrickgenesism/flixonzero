const https = require('https');
const url = 'https://cdn.flixon.net/TUCKER%2520AND%2520DALE%2520VS%2520EVIL%2520__%2520VJ%2520EMMY%2520%2523Horror%2520(2).mkv';
const req = https.request(url, { 
  method: 'GET',
  headers: {
    'Range': 'bytes=1000000-1000100'
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Content-Length:', res.headers['content-length']);
  console.log('Content-Range:', res.headers['content-range']);
  console.log('Content-Type:', res.headers['content-type']);
});
req.end();
