import fetch from 'node-fetch';

async function testSettings() {
  console.log("Fetching /dashboard/deposit-banks (simulating user side)...");
  // Assuming no auth needed to see error, wait /dashboard/deposit-banks needs auth
  // Let's use /withdrawals/settings which is public
  
  let res = await fetch('http://localhost:5000/api/withdrawals/settings');
  let data = await res.json();
  console.log("Initial withdrawal settings:", data);

}

testSettings();
