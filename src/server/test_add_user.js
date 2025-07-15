const fetch = require('node-fetch');

async function testAddUser() {
  console.log('Test d\'ajout d\'un utilisateur via l\'API...');
  
  const userData = {
    name: 'Test Utilisateur',
    email: 'test.utilisateur@example.com',
    role: 'recruiter',
    status: 'actif'
  };
  
  try {
    const response = await fetch('http://localhost:3001/api/recruiters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', errorData);
      return;
    }
    
    const result = await response.json();
    console.log('Utilisateur ajouté avec succès:', result);
    
    // Vérifier que l'utilisateur a bien été ajouté
    const getAllResponse = await fetch('http://localhost:3001/api/recruiters');
    const allUsers = await getAllResponse.json();
    console.log('Liste des recruteurs:', allUsers);
    
  } catch (error) {
    console.error('Erreur lors de l\'exécution du test:', error);
  }
}

testAddUser();
