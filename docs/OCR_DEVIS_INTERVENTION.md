# 📄 Documentation OCR - Devis d'Intervention

## 🎯 Vue d'ensemble

Le système OCR (Reconnaissance Optique de Caractères) permet d'extraire automatiquement les données des devis d'intervention à partir d'images ou de documents scannés. Il utilise Tesseract.js pour l'extraction de texte et des algorithmes intelligents pour structurer les données.

## 🚀 Fonctionnalités

### ✅ Fonctionnalités principales
- **Extraction de texte** à partir d'images (PNG, JPG, PDF)
- **Détection intelligente** des types de travaux (Main d'œuvre, Pièces détachées, Divers)
- **Création automatique** des catégories de fournitures manquantes
- **Génération automatique** des références pour les nouvelles fournitures
- **Association automatique** des lignes aux fournitures créées
- **Calcul automatique** des totaux
- **Interface utilisateur intuitive** avec modal de traitement

### 📊 Données extraites
- **Numéro de devis**
- **Dates** (date du devis, date de réception)
- **Lignes de devis** avec :
  - Description de la fourniture/travail
  - Quantité
  - Prix unitaire
  - Prix total
- **Totaux généraux**
- **Informations véhicule** (marque, modèle, plaque)
- **Informations client**

## 🏗️ Architecture

### Frontend
- **Vue.js Component** : `OCRProcessor.js`
- **Tesseract.js** : Bibliothèque OCR
- **Interface utilisateur** : Modal avec onglets (Données extraites / Texte brut)

### Backend
- **API Endpoints** :
  - `POST /api/supplies/admin` : Création de fournitures
  - `POST /api/supply-categories/admin` : Création de catégories
  - `GET /api/supply-categories/active` : Liste des catégories

### Base de données
- **Tables concernées** :
  - `supplies` : Fournitures
  - `supply_categories` : Catégories de fournitures

## 📋 Utilisation

### 1. Accès à l'OCR
1. Ouvrir un formulaire de création de devis d'intervention
2. Cliquer sur le bouton **"OCR"** dans l'en-tête
3. Le modal OCR s'ouvre

### 2. Upload du document
1. **Glisser-déposer** un fichier dans la zone d'upload
2. Ou **cliquer** pour sélectionner un fichier
3. **Formats supportés** : Images (PNG, JPG, JPEG) et PDF

### 3. Traitement
1. Le document est traité automatiquement par Tesseract.js
2. **Barre de progression** affiche l'avancement
3. Le texte est extrait et analysé

### 4. Résultats
1. **Onglet "Données extraites"** : Données structurées
2. **Onglet "Texte brut"** : Texte original extrait
3. **Validation** des données extraites

### 5. Application au formulaire
1. Cliquer sur **"Appliquer au formulaire"**
2. Les données sont automatiquement remplies
3. Les fournitures manquantes sont créées en base

## 🔧 Configuration

### Paramètres Tesseract.js
```javascript
{
    lang: 'fra+eng',  // Langues : Français + Anglais
    oem: 1,           // Mode de reconnaissance
    psm: 6            // Segmentation de page
}
```

### Patterns de détection
```javascript
// Montants
amount: /(\d{1,3}(?:\s?\d{3})*(?:[.,]\d{2})?)\s*(?:F\s*CFA|€|EUR)?/gi

// Dates
date: /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/g

// Numéros de devis
quoteNumber: /(?:N°|No|#)\s*:?\s*(\w+)/gi

// Lignes de devis
lineItem: /^(\d+)\s+(.+?)\s+(\d{1,3}(?:\s?\d{3})*(?:[.,]\d{2})?)\s+(\d{1,3}(?:\s?\d{3})*(?:[.,]\d{2})?)$/gm
```

## 🎨 Interface utilisateur

### Modal OCR
```html
<div class="ocr-modal">
    <!-- En-tête -->
    <div class="modal-header">
        <h3>Extraction OCR</h3>
        <button @click="close">×</button>
    </div>
    
    <!-- Zone d'upload -->
    <div class="upload-area">
        <!-- Glisser-déposer ou sélection de fichier -->
    </div>
    
    <!-- Barre de progression -->
    <div class="progress-bar">
        <div class="progress" :style="{width: progress + '%'}"></div>
    </div>
    
    <!-- Onglets de résultats -->
    <div class="tabs">
        <div class="tab" :class="{active: activeTab === 'parsed'}">
            Données extraites
        </div>
        <div class="tab" :class="{active: activeTab === 'raw'}">
            Texte brut
        </div>
    </div>
    
    <!-- Contenu des onglets -->
    <div class="tab-content">
        <!-- Données structurées ou texte brut -->
    </div>
    
    <!-- Actions -->
    <div class="modal-footer">
        <button @click="close">Annuler</button>
        <button @click="applyToForm" :disabled="!parsedData">
            Appliquer au formulaire
        </button>
    </div>
</div>
```

## 🔍 Détection intelligente

### Types de travaux
```javascript
const detectItemType = (description) => {
    const desc = description.toLowerCase();
    
    // Main d'œuvre
    const laborKeywords = [
        'main d\'oeuvre', 'main d\'œuvre', 'maindoeuvre',
        'montage', 'démontage', 'réparation', 'réglage',
        'diagnostic', 'carrossage', 'parallélisme',
        'regarnissage', 'rectification', 'service',
        'intervention', 'travaux', 'pose', 'installation'
    ];
    
    // Pièces détachées
    const supplyKeywords = [
        'pièce', 'piece', 'pièces', 'pieces', 'moyeu',
        'bras', 'silentbloc', 'amortisseur', 'ressort',
        'pneu', 'valve', 'tambour', 'machoire', 'filtre',
        'huile', 'bougie', 'courroie', 'plaquette', 'disque'
    ];
    
    if (laborKeywords.some(keyword => desc.includes(keyword))) {
        return { category: 'Main d\'œuvre', categoryName: 'Main d\'œuvre' };
    }
    
    if (supplyKeywords.some(keyword => desc.includes(keyword))) {
        return { category: 'Pièces détachées', categoryName: 'Pièces détachées' };
    }
    
    return { category: 'Divers', categoryName: 'Divers' };
};
```

### Génération de références
```javascript
const generateReference = (description) => {
    const prefix = 'OCR';
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}-${random}`;
};
```

## 📊 Gestion des catégories

### Création automatique
```javascript
const ensureCategoriesExist = async (supplies) => {
    const categories = [...new Set(supplies.map(s => s.category))];
    const categoryIds = {};
    
    for (const categoryName of categories) {
        // Recherche de la catégorie existante
        let categoryId = await findCategoryByName(categoryName);
        
        if (!categoryId) {
            // Création de la catégorie
            const response = await window.apiService.request('/supply-categories/admin', {
                method: 'POST',
                body: JSON.stringify({
                    name: categoryName,
                    description: `Catégorie créée automatiquement par OCR pour ${categoryName}`,
                    icon: getCategoryIcon(categoryName)
                })
            });
            
            categoryId = response.data.id;
        }
        
        categoryIds[categoryName] = categoryId;
    }
    
    return categoryIds;
};
```

### Icônes par catégorie
```javascript
const getCategoryIcon = (categoryName) => {
    const icons = {
        'Main d\'œuvre': 'fas fa-tools',
        'Pièces détachées': 'fas fa-box',
        'Divers': 'fas fa-ellipsis-h'
    };
    
    return icons[categoryName] || 'fas fa-tag';
};
```

## 🚨 Gestion d'erreurs

### Types d'erreurs gérées
1. **Erreurs de format de fichier**
2. **Erreurs de traitement OCR**
3. **Erreurs de création de catégories**
4. **Erreurs de création de fournitures**
5. **Erreurs de validation des données**

### Messages d'erreur
```javascript
// Erreurs de fichier
'Format de fichier non supporté'

// Erreurs OCR
'Erreur lors du traitement OCR'

// Erreurs de création
'Erreur lors de la création de la fourniture'

// Erreurs de validation
'Données OCR invalides'
```

## 📈 Performance

### Optimisations
- **Cache Tesseract.js** : Les modèles linguistiques sont mis en cache
- **Traitement asynchrone** : L'OCR ne bloque pas l'interface
- **Validation côté client** : Vérification avant envoi au serveur
- **Gestion des erreurs** : Récupération gracieuse des erreurs

### Limites
- **Taille de fichier** : Maximum 10MB
- **Qualité d'image** : Meilleure reconnaissance avec des images nettes
- **Langues** : Optimisé pour le français et l'anglais

## 🔧 Maintenance

### Logs
```javascript
console.log('OCR Progress:', progress);
console.log('Données parsées:', parsedData);
console.log('Fournitures ajoutées:', addedSupplies);
```

### Debug
- **Mode debug** : Logs détaillés dans la console
- **Validation des données** : Vérification des données extraites
- **Tests unitaires** : Validation des patterns de détection

## 📚 Exemples d'utilisation

### Document type
```
FACTURE PROFORMA N°: 12225
CLIENT: ORANGE
TOYOTA HIACE N°: 6640JH01
DATE D'ENTREE: 06/01/2025

2 MOYEU AVANT COMPLET        125 000    250 000
2 BRAS DE SUSPENSION AV.     150 000    300 000
2 SILENTBLOC DE BRAS         28 800     57 600
14 MAIN D'OEUVRE             4 500      63 000
```

### Résultat attendu
```json
{
  "quoteNumber": "12225",
  "dates": ["06/01/2025"],
  "lines": [
    {
      "description": "MOYEU AVANT COMPLET",
      "quantity": 2,
      "unitPrice": 125000,
      "totalPrice": 250000,
      "category": "Pièces détachées"
    },
    {
      "description": "BRAS DE SUSPENSION AV.",
      "quantity": 2,
      "unitPrice": 150000,
      "totalPrice": 300000,
      "category": "Pièces détachées"
    },
    {
      "description": "SILENTBLOC DE BRAS",
      "quantity": 2,
      "unitPrice": 28800,
      "totalPrice": 57600,
      "category": "Pièces détachées"
    },
    {
      "description": "MAIN D'OEUVRE",
      "quantity": 14,
      "unitPrice": 4500,
      "totalPrice": 63000,
      "category": "Main d'œuvre"
    }
  ],
  "totals": {
    "calculated": 670600
  }
}
```

## 🎯 Roadmap

### Améliorations futures
1. **Reconnaissance de caractères améliorée**
2. **Support de plus de formats de documents**
3. **Apprentissage automatique** pour la catégorisation
4. **Interface de correction** des données extraites
5. **Export des données** en différents formats

### Optimisations
1. **Cache des résultats** OCR
2. **Traitement par lots** de documents
3. **API de webhook** pour notifications
4. **Statistiques d'utilisation**

---

## 📞 Support

Pour toute question ou problème avec le système OCR :
1. Vérifier les logs de la console
2. Tester avec un document de meilleure qualité
3. Contacter l'équipe de développement

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2025  
**Auteur** : Équipe Impact Auto
