# Déploiement Automatique - Candidater en France Facile

## Configuration pour le déploiement automatique

Ce projet est maintenant configuré pour un déploiement automatique complet avec initialisation de la base de données.

### 🚀 Déploiement sur une nouvelle machine

1. **Cloner le projet** :
   ```bash
   git clone <votre-repo>
   cd candidater-en-france-facile-original
   ```

2. **Configurer les variables d'environnement** :
   Copier `.env.example` vers `.env` et modifier selon votre environnement :
   ```bash
   cp .env.example .env
   ```
   
   Puis éditer `.env` avec vos valeurs :
   ```env
   # Hosts et ports (modifiez selon votre serveur)
   API_HOST_PROD=your-server-ip-or-domain
   API_PORT_PROD=3000
   FRONTEND_HOST_PROD=your-server-ip-or-domain
   FRONTEND_PORT_PROD=8000
   
   # Base de données
   POSTGRES_PASSWORD_PROD=your-secure-password
   
   # SMTP (Email)
   SMTP_USER_PROD=your-email@domain.com
   SMTP_PASSWORD_PROD=your-app-password
   SMTP_FROM_PROD=noreply@your-domain.com
   
   # Sécurité
   RESET_SECRET_PROD=your-jwt-secret-key-for-production
   ```

3. **Lancer le déploiement** :
   ```bash
   docker compose up --build -d
   ```

### ✅ Ce qui se passe automatiquement

1. **Base de données PostgreSQL** :
   - Création automatique de la base
   - Restauration du schéma complet depuis `latest_backup.sql`
   - Ajout des colonnes pour la réinitialisation de mot de passe
   - Chargement des données d'exemple depuis `sample_data.sql`

2. **Backend Node.js** :
   - Attend que la base soit prête (healthcheck)
   - Se connecte automatiquement à PostgreSQL
   - API complète avec authentification et reset password

3. **Frontend React** :
   - Interface utilisateur complète
   - Configuré pour communiquer avec le backend

### 📁 Fichiers d'initialisation

- `init-db.sql` : Script principal d'initialisation
- `latest_backup.sql` : Schéma et structure de la base
- `sample_data.sql` : Données d'exemple

### 🔍 Vérification du déploiement

Après le déploiement, vérifiez :
- Frontend : http://localhost:8000
- Backend API : http://localhost:3000/api/test
- Base de données : Port 5432

### 🛠️ Dépannage

Si la base de données ne s'initialise pas :
1. Supprimer le volume : `docker volume rm candidater-en-france-facile-original_postgres_data`
2. Relancer : `docker compose up --build -d`

Les logs sont disponibles avec :
```bash
docker compose logs postgres
docker compose logs backend
docker compose logs frontend
```
