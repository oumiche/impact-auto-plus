# Mise à jour - Affichage du Workflow

**Date**: 11 octobre 2025  
**Modification**: Déplacer la barre de workflow du tableau vers le modal d'édition

---

## 🔄 Changement effectué

### Avant
```vue
<table>
  <thead>
    <th>Workflow</th> ← Colonne dans le tableau
  </thead>
  <tbody>
    <td>
      <WorkflowProgressBar compact /> ← 300px de largeur
    </td>
  </tbody>
</table>
```

**Problème**:
- Prend beaucoup d'espace (300px minimum)
- Tableau trop large sur certains écrans
- Scroll horizontal excessif

### Après
```vue
<!-- Tableau simplifié -->
<table>
  <thead>
    <!-- Pas de colonne Workflow -->
  </thead>
</table>

<!-- Modal d'édition -->
<Modal v-if="isEditing">
  <WorkflowProgressBar :current-status="form.currentStatus" :show-labels="true" />
  ← Barre complète avec labels
  <!-- ... formulaire ... -->
</Modal>
```

**Avantages**:
- ✅ Tableau plus compact
- ✅ Workflow visible en mode édition (où c'est le plus utile)
- ✅ Barre complète avec labels (meilleure lisibilité)
- ✅ Pas de scroll horizontal inutile

---

## 📊 Impact sur la page

### VehicleInterventions.vue

**Tableau simplifié (8 colonnes au lieu de 9)**:
1. N° Intervention
2. Titre
3. Véhicule
4. Type
5. Priorité
6. Statut
7. Date
8. Actions

**Modal d'édition enrichi**:
- **Nouvelle section en haut**: "Progression du workflow"
  - Affiche la WorkflowProgressBar complète
  - Visible uniquement en mode édition (pas en création)
  - Avec labels complets pour chaque étape
  - Permet de voir instantanément où en est l'intervention

---

## 🎨 Design de la section workflow

```scss
.workflow-section {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  
  h4 {
    color: #374151;
    icon: #3b82f6 (fa-route)
  }
}
```

**Barre de progression**:
- Mode complet (11 étapes)
- Labels affichés sous chaque étape
- Animation pulse sur l'étape courante
- Connecteurs animés entre les étapes

---

## ✅ Résultat

**Tableau plus compact** ✅  
**Workflow visible en édition** ✅  
**Meilleure UX globale** ✅  
**0 erreur de linting** ✅

---

## 📝 Notes

### Autres pages
Les 5 autres pages du workflow (Prédiagnostics, Devis, Autorisations, Réceptions, Factures) n'ont **pas besoin** de la barre de workflow car :
- Elles sont des documents attachés à une intervention
- Le statut de l'intervention est géré dans VehicleInterventions
- Elles ont leurs propres statuts (validé, payé, etc.)

### Workflow complet
Pour voir le workflow complet d'une intervention :
1. Aller dans VehicleInterventions
2. Cliquer sur "Modifier" une intervention
3. → La barre de progression s'affiche en haut du modal avec tous les détails

---

**Modification effectuée avec succès ! ✅**

