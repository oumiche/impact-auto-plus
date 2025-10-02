# Composant AttachmentGallery

## Description
Le composant `AttachmentGallery` est un composant Vue.js réutilisable qui affiche les pièces jointes sous forme de galerie avec aperçus d'images et modal de visualisation.

## Installation

### 1. Inclure les fichiers
```html
<!-- CSS -->
<link rel="stylesheet" href="css/attachment-gallery.css">

<!-- JavaScript -->
<script src="js/components/AttachmentGallery.js"></script>
```

### 2. Enregistrer le composant
```javascript
// Enregistrement global (automatique)
// Le composant est automatiquement enregistré globalement

// Ou enregistrement local dans un composant
components: {
    AttachmentGallery
}
```

## Utilisation

### Syntaxe de base
```html
<AttachmentGallery 
    :attachments="attachments"
    :entity-type="'intervention_prediagnostic'"
    :entity-id="123"
    @download="downloadAttachment"
    @delete="deleteAttachment"
/>
```

### Props

| Prop | Type | Requis | Défaut | Description |
|------|------|--------|--------|-------------|
| `attachments` | Array | ✅ | `[]` | Liste des pièces jointes |
| `entityType` | String | ✅ | - | Type d'entité (ex: 'intervention_prediagnostic') |
| `entityId` | Number/String | ✅ | - | ID de l'entité |
| `showActions` | Boolean | ❌ | `true` | Afficher les boutons d'action |
| `maxPreviewSize` | String | ❌ | `'280px'` | Taille minimale des cartes |

### Événements

| Événement | Payload | Description |
|-----------|---------|-------------|
| `download` | `attachment` | Émis quand l'utilisateur clique sur télécharger |
| `delete` | `attachment` | Émis quand l'utilisateur clique sur supprimer |

### Structure des données

#### Attachment Object
```javascript
{
    id: 1,
    fileName: "document.pdf",
    originalName: "Mon Document.pdf",
    filePath: "/uploads/intervention_prediagnostic/123/document.pdf",
    fileSize: 1024000,
    mimeType: "application/pdf",
    uploadedAt: "2024-01-01T10:00:00Z",
    entityType: "intervention_prediagnostic",
    entityId: 123
}
```

## Exemples d'utilisation

### Exemple basique
```html
<template>
    <div>
        <h3>Pièces jointes</h3>
        <AttachmentGallery 
            :attachments="files"
            entity-type="my_entity"
            :entity-id="entityId"
            @download="handleDownload"
            @delete="handleDelete"
        />
    </div>
</template>

<script>
export default {
    data() {
        return {
            files: [],
            entityId: 123
        };
    },
    methods: {
        handleDownload(attachment) {
            // Logique de téléchargement
            console.log('Download:', attachment);
        },
        handleDelete(attachment) {
            // Logique de suppression
            console.log('Delete:', attachment);
        }
    }
};
</script>
```

### Exemple avec configuration personnalisée
```html
<AttachmentGallery 
    :attachments="attachments"
    :entity-type="'vehicle_intervention'"
    :entity-id="vehicleId"
    :show-actions="false"
    max-preview-size="200px"
/>
```

### Exemple avec gestion d'événements
```html
<AttachmentGallery 
    :attachments="attachments"
    entity-type="intervention_prediagnostic"
    :entity-id="prediagnosticId"
    @download="downloadFile"
    @delete="confirmDelete"
/>

<script>
methods: {
    async downloadFile(attachment) {
        try {
            const response = await fetch(`/api/download/${attachment.id}`);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = attachment.originalName;
            a.click();
            
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur téléchargement:', error);
        }
    },
    
    async confirmDelete(attachment) {
        if (confirm(`Supprimer "${attachment.originalName}" ?`)) {
            try {
                await this.deleteAttachment(attachment.id);
                this.attachments = this.attachments.filter(a => a.id !== attachment.id);
            } catch (error) {
                console.error('Erreur suppression:', error);
            }
        }
    }
}
</script>
```

## Styles et thèmes

### Classes CSS personnalisables
```css
/* Conteneur principal */
.attachment-gallery-container {
    /* Styles personnalisés */
}

/* Variantes de taille */
.attachment-gallery-container.small {
    --min-size: 200px;
}

.attachment-gallery-container.medium {
    --min-size: 280px;
}

.attachment-gallery-container.large {
    --min-size: 350px;
}

/* Thème sombre */
.attachment-gallery-container.theme-dark {
    /* Styles thème sombre */
}
```

### Utilisation des variantes
```html
<!-- Taille petite -->
<div class="attachment-gallery-container small">
    <AttachmentGallery :attachments="files" entity-type="my_entity" :entity-id="123" />
</div>

<!-- Thème sombre -->
<div class="attachment-gallery-container theme-dark">
    <AttachmentGallery :attachments="files" entity-type="my_entity" :entity-id="123" />
</div>
```

## Fonctionnalités

### ✅ Aperçus d'images
- Affichage automatique des images avec aperçu
- Zoom au survol
- Overlay avec bouton d'aperçu

### ✅ Icônes de fichiers
- Icônes spécifiques par type MIME
- Support des formats courants (PDF, Word, images, etc.)

### ✅ Modal d'aperçu
- Affichage plein écran des images
- Informations détaillées du fichier
- Fermeture par bouton ou clic extérieur

### ✅ Actions
- Téléchargement de fichiers
- Suppression avec confirmation
- Actions personnalisables via événements

### ✅ Responsive
- Grille adaptative
- Optimisation mobile
- Tailles flexibles

### ✅ Accessibilité
- Attributs `alt` sur les images
- Boutons avec `title` pour l'aide
- Navigation au clavier

## Intégration avec d'autres composants

### Avec FileUploadService
```javascript
// Utilisation avec le service d'upload existant
import { FileUploadService } from './services/FileUploadService.js';

export default {
    data() {
        return {
            attachments: [],
            fileUploadService: new FileUploadService()
        };
    },
    async mounted() {
        await this.loadAttachments();
    },
    methods: {
        async loadAttachments() {
            this.attachments = await this.fileUploadService.getFiles(
                'my_entity', 
                this.entityId
            );
        },
        
        async handleDownload(attachment) {
            await this.fileUploadService.downloadFile(attachment, this.entityId);
        },
        
        async handleDelete(attachment) {
            await this.fileUploadService.deleteFile(
                'my_entity', 
                this.entityId, 
                attachment.id
            );
            await this.loadAttachments(); // Recharger la liste
        }
    }
};
```

## Support des navigateurs
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Notes de développement
- Le composant utilise Vue 3 Composition API
- Compatible avec les versions récentes de Vue.js
- CSS Grid pour la mise en page responsive
- Support des Custom Properties CSS pour la personnalisation
