const https = require('https');

async function testLiveApi() {
  const loginData = JSON.stringify({ phone: 'admin', password: 'matysisay11' });

  // 1. Login
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
      console.log('Login Response:', loginBody);
      if (!cookie) {
        console.log('No cookie received!');
        return;
      }
      
      // 2. Fetch admin settings
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
          console.log('Current quick amounts:', settings.withdrawal_quick_amounts?.value);
          console.log('Current CBE account:', settings.bank_cbe_account?.value);
          
          // Construct payload like react-hook-form would (flat key-value)
          const payload = {};
          for (const key of Object.keys(settings)) {
            payload[key] = settings[key].value;
          }
          
          // Modify the target fields
          payload.withdrawal_quick_amounts = '111,222,333';
          payload.bank_cbe_account = '999999999999';
          payload.withdrawal_allowed_days = '1,2,3,4,5,6'; // from allowedDays.join(',')

          const payloadStr = JSON.stringify(payload);
          
          // 3. Put admin settings
          const putReq = https.request({
            hostname: 'amazon-global-exports.onrender.com',
            path: '/api/admin/settings',
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payloadStr),
              'Cookie': cookie
            }
          }, (putRes) => {
            let putBody = '';
            putRes.on('data', d => putBody += d);
            putRes.on('end', () => {
              console.log('PUT Response:', putBody);
              
              // 4. Fetch withdrawal settings (public)
              https.get('https://amazon-global-exports.onrender.com/api/withdrawals/settings', (pubRes) => {
                let pubBody = '';
                pubRes.on('data', d => pubBody += d);
                pubRes.on('end', () => {
                  console.log('Public Withdrawals Settings:', pubBody);
                });
              });
              
            });
          });
          
          putReq.write(payloadStr);
          putReq.end();
        });
      });
      getReq.end();
    });
  });

  loginReq.write(loginData);
  loginReq.end();
}

testLiveApi();
