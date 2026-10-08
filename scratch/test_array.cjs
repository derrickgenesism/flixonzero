const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dtjpgnvgqzcxuslmgkyw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0anBnbnZncXpjeHVzbG1na3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzYyODAsImV4cCI6MjEwMTYxMjI4MH0.8Xs-6T-SbfNaL7KMklUdQWn3RhuI6VR1bNa18RZTk8s');

supabase.from('movies').select('categories').limit(1).then(r => {
  console.log(typeof r.data[0].categories, Array.isArray(r.data[0].categories));
});
