const fetch = require('node-fetch');

async function testAddRecruiter() {
  try {
    console.log('Test d\'ajout d\'un recruteur via l\'API...');
    
    const response = await fetch('http://localhost:3000/api/recruiters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test API UUID',
        email: 'test.api.uuid@example.com',
        status: 'actif'
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Recruteur ajouté avec succès:', data);
      console.log('ID généré automatiquement:', data.id);
    } else {
      console.error('Erreur lors de l\'ajout du recruteur:', data);
    }
  } catch (error) {
    console.error('Erreur lors de l\'exécution du test:', error);
  }
}

testAddRecruiter();
