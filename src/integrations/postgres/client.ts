import type { Database } from './types';

// Version compatible navigateur du client PostgreSQL
// Cette version simule les requêtes à la base de données en utilisant des données en mémoire

// Données en mémoire pour simuler la base de données
const inMemoryData = {
  // Table des utilisateurs d'authentification
  auth_users: [
    {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      email: "admin.test",
      password: "admin123",
      name: "Admin Principal",
      role: "admin",
      created_at: "2025-06-11T08:05:56.78935+00:00",
      updated_at: "2025-06-11T08:05:56.78935+00:00"
    },
    {
      id: "d6d6d4cb-6d27-451c-bb7b-a24fa483e0f0",
      email: "sophie.bernard",
      password: "sophie123",
      name: "Sophie Bernard",
      role: "recruiter",
      created_at: "2025-06-11T08:05:56.78935+00:00",
      updated_at: "2025-06-11T08:05:56.78935+00:00"
    },
    {
      id: "6356a8a1-2d20-451f-a29e-7dbd023f59af",
      email: "candidat",
      password: "candidat123",
      name: "Candidat Test",
      role: "candidate",
      created_at: "2025-06-11T08:05:56.78935+00:00",
      updated_at: "2025-06-11T08:05:56.78935+00:00"
    },
    {
      id: "c8396f1b-3e24-4369-84f3-2f95df347fb5",
      email: "marie.dupont",
      password: "marie123",
      name: "Marie Dupont",
      role: "recruiter",
      created_at: "2025-06-11T08:05:56.78935+00:00",
      updated_at: "2025-06-11T08:05:56.78935+00:00"
    },
    {
      id: "11770c27-7e4f-4baf-8da0-9df9555fd025",
      email: "recruteur",
      password: "recrut123",
      name: "Recruteur Principal",
      role: "recruiter",
      created_at: "2025-06-11T08:05:56.78935+00:00",
      updated_at: "2025-06-11T08:05:56.78935+00:00"
    },
    {
      id: "22770c27-7e4f-4baf-8da0-9df9555fd026",
      email: "pierre.martin",
      password: "pierre123",
      name: "Pierre Martin",
      role: "recruiter",
      created_at: "2025-06-11T08:05:56.78935+00:00",
      updated_at: "2025-06-11T08:05:56.78935+00:00"
    }
  ],
  // Table des recruteurs
  recruiters: [
    {
      id: "b5f8c1e3-f1c2-4a5b-b8c7-9d1e2f3a4b5c",
      name: "Sophie Bernard",
      email: "sophie.bernard@example.com",
      status: "actif",
      created_at: "2025-06-11T08:05:56.78935+00:00",
      updated_at: "2025-06-11T08:05:56.78935+00:00"
    },
    {
      id: "c6d7e8f9-a1b2-3c4d-5e6f-7a8b9c0d1e2f",
      name: "Marie Dupont",
      email: "marie.dupont@example.com",
      status: "actif",
      created_at: "2025-06-11T08:05:56.78935+00:00",
      updated_at: "2025-06-11T08:05:56.78935+00:00"
    },
    {
      id: "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a",
      name: "Pierre Martin",
      email: "pierre.martin@example.com",
      status: "actif",
      created_at: "2025-06-11T08:05:56.78935+00:00",
      updated_at: "2025-06-11T08:05:56.78935+00:00"
    }
  ],
  // Ajoutez d'autres tables au besoin
};

// Client PostgreSQL compatible avec l'interface Supabase
class PostgresClient {
  // Méthode pour simuler l'API Supabase
  from(tableName: string) {
    return {
      select: (columns: string = '*') => {
        return {
          eq: (column: string, value: any) => {
            return {
              eq: (column2: string, value2: any) => {
                return {
                  single: async () => {
                    try {
                      console.log(`Recherche dans ${tableName} où ${column}=${value} et ${column2}=${value2}`);
                      if (!inMemoryData[tableName]) {
                        return { data: null, error: new Error(`Table ${tableName} not found`) };
                      }
                      
                      const result = inMemoryData[tableName].find(
                        (row) => row[column] === value && row[column2] === value2
                      );
                      
                      return { data: result || null, error: null };
                    } catch (error) {
                      console.error('Erreur lors de la requête:', error);
                      return { data: null, error };
                    }
                  }
                };
              },
              single: async () => {
                try {
                  console.log(`Recherche dans ${tableName} où ${column}=${value}`);
                  if (!inMemoryData[tableName]) {
                    return { data: null, error: new Error(`Table ${tableName} not found`) };
                  }
                  
                  const result = inMemoryData[tableName].find(
                    (row) => row[column] === value
                  );
                  
                  return { data: result || null, error: null };
                } catch (error) {
                  console.error('Erreur lors de la requête:', error);
                  return { data: null, error };
                }
              }
            };
          },
          order: (orderColumn: string, options: { ascending: boolean } = { ascending: true }) => {
            return {
              async then(resolve: (result: { data: any[], error: Error | null }) => void) {
                try {
                  console.log(`Récupération de tous les éléments de ${tableName} triés par ${orderColumn}`);
                  if (!inMemoryData[tableName]) {
                    resolve({ data: [], error: new Error(`Table ${tableName} not found`) });
                    return;
                  }
                  
                  // Copier les données pour ne pas modifier l'original
                  const sortedData = [...inMemoryData[tableName]];
                  
                  // Trier les données
                  sortedData.sort((a, b) => {
                    const valueA = a[orderColumn];
                    const valueB = b[orderColumn];
                    
                    if (valueA < valueB) return options.ascending ? -1 : 1;
                    if (valueA > valueB) return options.ascending ? 1 : -1;
                    return 0;
                  });
                  
                  resolve({ data: sortedData, error: null });
                } catch (error) {
                  console.error('Erreur lors de la requête:', error);
                  resolve({ data: [], error: error as Error });
                }
              }
            };
          }
        };
      },
      insert: (data: any[]) => {
        return {
          select: () => {
            return {
              single: async () => {
                try {
                  console.log(`Insertion dans ${tableName}`, data);
                  if (!inMemoryData[tableName]) {
                    inMemoryData[tableName] = [];
                  }
                  
                  // Ajouter un ID unique si non fourni
                  const newItem = { 
                    ...data[0], 
                    id: data[0].id || crypto.randomUUID(),
                    created_at: data[0].created_at || new Date().toISOString(),
                    updated_at: data[0].updated_at || new Date().toISOString()
                  };
                  
                  inMemoryData[tableName].push(newItem);
                  return { data: newItem, error: null };
                } catch (error) {
                  console.error('Erreur lors de l\'insertion:', error);
                  return { data: null, error };
                }
              }
            };
          }
        };
      },
      update: (updateData: any) => {
        return {
          eq: (column: string, value: any) => {
            return {
              async then(resolve: (result: { data: any, error: Error | null }) => void) {
                try {
                  console.log(`Mise à jour dans ${tableName} où ${column}=${value}`, updateData);
                  if (!inMemoryData[tableName]) {
                    resolve({ data: null, error: new Error(`Table ${tableName} not found`) });
                    return;
                  }
                  
                  const index = inMemoryData[tableName].findIndex(row => row[column] === value);
                  if (index === -1) {
                    resolve({ data: null, error: new Error(`Item not found in ${tableName}`) });
                    return;
                  }
                  
                  // Mettre à jour l'élément
                  inMemoryData[tableName][index] = {
                    ...inMemoryData[tableName][index],
                    ...updateData,
                    updated_at: new Date().toISOString()
                  };
                  
                  resolve({ data: inMemoryData[tableName][index], error: null });
                } catch (error) {
                  console.error('Erreur lors de la mise à jour:', error);
                  resolve({ data: null, error: error as Error });
                }
              }
            };
          }
        };
      },
      delete: () => {
        return {
          eq: (column: string, value: any) => {
            return {
              async then(resolve: (result: { data: any, error: Error | null }) => void) {
                try {
                  console.log(`Suppression dans ${tableName} où ${column}=${value}`);
                  if (!inMemoryData[tableName]) {
                    resolve({ data: null, error: new Error(`Table ${tableName} not found`) });
                    return;
                  }
                  
                  const index = inMemoryData[tableName].findIndex(row => row[column] === value);
                  if (index === -1) {
                    resolve({ data: null, error: new Error(`Item not found in ${tableName}`) });
                    return;
                  }
                  
                  // Supprimer l'élément
                  const deletedItem = inMemoryData[tableName][index];
                  inMemoryData[tableName].splice(index, 1);
                  
                  resolve({ data: deletedItem, error: null });
                } catch (error) {
                  console.error('Erreur lors de la suppression:', error);
                  resolve({ data: null, error: error as Error });
                }
              }
            };
          }
        };
      }
    };
  }

  // Authentification simulée
  auth = {
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      try {
        console.log(`Tentative de connexion pour: ${credentials.email}`);
        // Rechercher l'utilisateur dans les données en mémoire
        const user = inMemoryData.auth_users.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          console.log(`Utilisateur trouvé: ${user.name}, rôle: ${user.role}`);
          const session = {
            access_token: 'fake_token',
            user_id: user.id,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          };
          return { data: { user, session }, error: null };
        }

        console.log('Identifiants invalides');
        return { data: { user: null, session: null }, error: new Error('Invalid credentials') };
      } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        return { data: { user: null, session: null }, error };
      }
    },

    getSession: async () => {
      return { data: { session: null }, error: null };
    },

    signOut: async () => {
      return { error: null };
    }
  };

  // Stockage simulé
  storage = {
    from: (bucket: string) => {
      return {
        upload: async (path: string, file: File) => {
          console.log(`Simulation d'upload de fichier ${path} dans ${bucket}`);
          return { data: { path }, error: null };
        },
        getPublicUrl: (path: string) => {
          return { data: { publicUrl: `/storage/${bucket}/${path}` } };
        },
        remove: async (paths: string[]) => {
          console.log(`Simulation de suppression de fichiers ${paths.join(', ')} de ${bucket}`);
          return { data: { path: paths }, error: null };
        }
      };
    }
  };
}

// Exporter une instance du client PostgreSQL
const postgres = new PostgresClient();

// Pour faciliter la migration, nous exportons un alias 'supabase'
export const supabase = postgres;
