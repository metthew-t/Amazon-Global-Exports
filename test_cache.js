const https = require('https');

https.get('https://amazon-global-exports.onrender.com/api/withdrawals/settings', (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Without cache bust:', body));
});

https.get('https://amazon-global-exports.onrender.com/api/withdrawals/settings?t=' + Date.now(), (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('With cache bust:', body));
});
