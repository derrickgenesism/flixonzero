const url = 'https://dtjpgnvgqzcxuslmgkyw.supabase.co/rest/v1/movies?select=*&limit=1';
fetch(url, {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0anBnbnZncXpjeHVzbG1na3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzYyODAsImV4cCI6MjEwMTYxMjI4MH0.8Xs-6T-SbfNaL7KMklUdQWn3RhuI6VR1bNa18RZTk8s'
  }
}).then(r => r.json()).then(d => {
  if (d.length > 0) console.log(Object.keys(d[0]));
}).catch(console.error);
