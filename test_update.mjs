import http from 'http';

const updateSettings = async () => {
  const payload = JSON.stringify({
    min_withdrawal: '600'
  });

  const req = http.request('http://localhost:5000/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('UPDATE response:', data));
  });

  req.on('error', console.error);
  req.write(payload);
  req.end();
};

updateSettings();
