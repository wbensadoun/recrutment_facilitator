const http = require('http');

function makePostRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log('Test de la route /api/auth/login...');
    const loginData = {
      email: 'admin.test@alenia.io',
      password: 'admin123'
    };
    
    console.log('Données de connexion:', loginData);
    
    const loginResponse = await makePostRequest('/api/auth/login', loginData);
    console.log('Statut:', loginResponse.statusCode);
    console.log('Corps:', loginResponse.body);
  } catch (error) {
    console.error('Erreur lors du test de connexion:', error.message);
  }
}

main();
