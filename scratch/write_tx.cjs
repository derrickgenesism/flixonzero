const fs = require('fs');
fs.writeFileSync('src/app/admin/(protected)/transactions/TransactionsClient.js', $code);
console.log('Fixed encoding issue via Node');
