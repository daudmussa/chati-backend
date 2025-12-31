import http from 'http';

// Make HTTP request to localhost:3000
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('RESPONSE:', data);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`PROBLEM WITH REQUEST: ${e.message}`);
  console.error('Full error:', e);
  process.exit(1);
});

req.write('Body=test+message&From=whatsapp:+1234567890');
req.end();
