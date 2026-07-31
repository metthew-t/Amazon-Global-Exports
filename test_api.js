const https = require('https');

https.get('https://amazon-global-exports.onrender.com/api/withdrawals/settings', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log("Withdrawal Settings from LIVE server:");
    console.log(data);
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
