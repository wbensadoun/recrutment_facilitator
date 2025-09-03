# Résumé des changements à appliquer

## Fichiers modifiés :

### 1. src/components/AdminDashboard.tsx
**Ligne 72** - Corriger l'URL dupliquée :
```typescript
// AVANT
const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/recruiter/password`, {

// APRÈS  
const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/recruiter/password`, {
```

### 2. src/components/CandidateDetailsModal.tsx
**Lignes 83-89** - Simplifier la gestion des stages :
```typescript
// AVANT
const handleStageChange = (newStage: string) => {
  // Code complexe avec appel API immédiat
};

// APRÈS
const handleStageChange = (newStage: string) => {
  // Juste mettre à jour le formulaire local, pas d'appel API
  setFormData(prev => ({
    ...prev,
    current_stage: newStage
  }));
};
```

**Ligne 290** - Corriger l'appel de fonction :
```typescript
// AVANT
onValueChange={(value) => handleStageChange(candidate.id, value)}

// APRÈS
onValueChange={(value) => handleStageChange(value)}
```

## Changements appliqués :
- ✅ Suppression des URLs dupliquées /api/api/
- ✅ Correction de la mise à jour immédiate des stages
- ✅ Amélioration de l'UX pour la gestion des candidats
