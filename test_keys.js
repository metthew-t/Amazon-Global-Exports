const https = require('https');

async function testKeys() {
  const loginData = JSON.stringify({ phone: 'admin', password: 'matysisay11' });

  const loginReq = https.request({
    hostname: 'amazon-global-exports.onrender.com',
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  }, (loginRes) => {
    let cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';
    let loginBody = '';
    loginRes.on('data', d => loginBody += d);
    loginRes.on('end', () => {
      
      const getReq = https.request({
        hostname: 'amazon-global-exports.onrender.com',
        path: '/api/admin/settings',
        method: 'GET',
        headers: { 'Cookie': cookie }
      }, (getRes) => {
        let getBody = '';
        getRes.on('data', d => getBody += d);
        getRes.on('end', () => {
          const settings = JSON.parse(getBody);
          for (const key of Object.keys(settings)) {
            console.log(`"${key}"`);
          }
        });
      });
      getReq.end();
    });
  });

  loginReq.write(loginData);
  loginReq.end();
}

testKeys();
