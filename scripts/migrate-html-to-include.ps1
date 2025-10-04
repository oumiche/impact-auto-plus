# Script PowerShell pour migrer tous les fichiers HTML vers l'approche include automatique
# Usage: PowerShell -ExecutionPolicy Bypass -File scripts/migrate-html-to-include.ps1

Write-Host "Migration des fichiers HTML vers l'approche include automatique..." -ForegroundColor Blue

# Configuration des pages à migrer
$pages = @{
    "intervention-quotes.html" = @{
        title = "Gestion des Devis"
        css = @("css/intervention-quotes.css")
        vueComponent = "InterventionQuotesList"
        additionalComponents = @("AttachmentGallery: window.AttachmentGallery")
    }
    
    "intervention-quote-create.html" = @{
        title = "Création de Devis"
        css = @("css/intervention-quote-form.css")
        vueComponent = "InterventionQuoteForm"
        additionalComponents = @("AttachmentGallery: window.AttachmentGallery", "OCRProcessor: window.OCRProcessor")
    }
    
    "intervention-quote-edit.html" = @{
        title = "Modification de Devis"
        css = @("css/intervention-quote-form.css")
        vueComponent = "InterventionQuoteForm"
        additionalComponents = @("AttachmentGallery: window.AttachmentGallery", "OCRProcessor: window.OCRProcessor")
    }
    
    "intervention-work-authorizations.html" = @{
        title = "Autorisations de Travail"
        css = @("css/intervention-work-authorizations.css")
        vueComponent = "InterventionWorkAuthorizationsList"
        additionalComponents = @("AttachmentGallery: window.AttachmentGallery")
    }
    
    "intervention-work-authorization-create.html" = @{
        title = "Création d'Autorisation"
        css = @("css/intervention-work-authorization-form.css")
        vueComponent = "InterventionWorkAuthorizationForm"
        additionalComponents = @("AttachmentGallery: window.AttachmentGallery")
    }
    
    "intervention-work-authorization-edit.html" = @{
        title = "Modification d'Autorisation"
        css = @("css/intervention-work-authorization-form.css")
        vueComponent = "InterventionWorkAuthorizationForm"
        additionalComponents = @("AttachmentGallery: window.AttachmentGallery")
    }
    
    "intervention-invoices.html" = @{
        title = "Factures d'Intervention"
        css = @("css/intervention-invoices.css")
        vueComponent = "InterventionInvoicesList"
        additionalComponents = @()
    }
    
    "intervention-invoice-create.html" = @{
        title = "Création de Facture"
        css = @("css/intervention-invoice-form.css")
        vueComponent = "InterventionInvoiceForm"
        additionalComponents = @()
    }
    
    "intervention-invoice-edit.html" = @{
        title = "Modification de Facture"
        css = @("css/intervention-invoice-form.css")
        vueComponent = "InterventionInvoiceForm"
        additionalComponents = @()
    }
    
    "intervention-invoice-view.html" = @{
        title = "Détail de Facture"
        css = @("css/intervention-invoice-view.css")
        vueComponent = "InterventionInvoiceView"
        additionalComponents = @()
    }
    
    "intervention-reception-reports.html" = @{
        title = "Rapports de Réception"
        css = @("css/intervention-reception-reports.css")
        vueComponent = "InterventionReceptionReportsList"
        additionalComponents = @()
    }
    
    "intervention-reception-report-create.html" = @{
        title = "Création de Rapport"
        css = @("css/intervention-reception-report-form.css")
        vueComponent = "InterventionReceptionReportForm"
        additionalComponents = @()
    }
    
    "intervention-reception-report-edit.html" = @{
        title = "Modification de Rapport"
        css = @("css/intervention-reception-report-form.css")
        vueComponent = "InterventionReceptionReportForm"
        additionalComponents = @()
    }
    
    "intervention-reception-report-view.html" = @{
        title = "Détail de Rapport"
        css = @("css/intervention-reception-report-view.css")
        vueComponent = "InterventionReceptionReportView"
        additionalComponents = @()
    }
}

# Template HTML pour la nouvelle approche
$template = @"
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - Impact Auto</title>
    
    <!-- Inclusion automatique de tous les assets -->
    <script src="js/app-includes.js"></script>
    
    <!-- CSS spécifiques à la page -->
    {{PAGE_CSS}}
</head>
<body>
    <div id="app"></div>
    
    <!-- Script de la page -->
    <script src="{{PAGE_JS}}"></script>
    
    <!-- Initialisation Vue.js -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Attendre que Vue.js soit chargé
            const checkVue = setInterval(() => {
                if (window.Vue) {
                    clearInterval(checkVue);
                    
                    const { createApp } = Vue;
                    const app = createApp({
                        components: {
                            {{COMPONENTS}}
                        },
                        template: \`
                            <div class="main-content">
                                <{{MAIN_COMPONENT}} />
                            </div>
                        \`
                    });
                    
                    app.mount('#app');
                }
            }, 100);
        });
    </script>
</body>
</html>
"@

# Fonction pour créer les composants
function Create-Components {
    param($additionalComponents, $mainComponent)
    
    $components = "                            $mainComponent"
    
    foreach ($component in $additionalComponents) {
        $components += ",`n                            $component"
    }
    
    return $components
}

# Fonction pour créer les CSS
function Create-CSS {
    param($cssFiles)
    
    $cssLinks = ""
    foreach ($css in $cssFiles) {
        $cssLinks += "    <link rel='stylesheet' href='$css'>`n"
    }
    
    return $cssLinks.Trim()
}

# Fonction pour déterminer le script JS de la page
function Get-PageJS {
    param($filename)
    
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($filename)
    return "js/$baseName-vue.js"
}

# Fonction pour migrer une page
function Migrate-Page {
    param($filename, $config)
    
    Write-Host "Migration de: $filename" -ForegroundColor Blue
    
    # Créer une sauvegarde
    $backupPath = "dist/$filename.backup"
    Copy-Item "dist/$filename" $backupPath
    
    # Générer le contenu
    $content = $template
    $content = $content -replace '{{TITLE}}', $config.title
    
    # CSS
    $cssLinks = Create-CSS $config.css
    $content = $content -replace '{{PAGE_CSS}}', $cssLinks
    
    # Script JS
    $pageJS = Get-PageJS $filename
    $content = $content -replace '{{PAGE_JS}}', $pageJS
    
    # Composants
    $components = Create-Components $config.additionalComponents $config.vueComponent
    $content = $content -replace '{{COMPONENTS}}', $components
    $content = $content -replace '{{MAIN_COMPONENT}}', $config.vueComponent
    
    # Écrire le nouveau fichier
    $outputPath = "dist/$filename"
    Set-Content $outputPath $content -NoNewline
    
    Write-Host "Migré: $outputPath" -ForegroundColor Green
    Write-Host "Sauvegarde: $backupPath" -ForegroundColor Yellow
}

# Créer le dossier templates s'il n'existe pas
if (!(Test-Path "dist/templates")) {
    New-Item -ItemType Directory -Path "dist/templates" -Force
}

# Créer les fichiers de template
Write-Host "Création des templates..." -ForegroundColor Blue

# Template de base
$baseTemplate = @"
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - Impact Auto</title>
    
    <!-- Inclusion automatique de tous les assets -->
    <script src="js/app-includes.js"></script>
    
    <!-- CSS spécifiques à la page -->
    {{PAGE_CSS}}
</head>
<body>
    <div id="app"></div>
    
    <!-- Script de la page -->
    <script src="{{PAGE_JS}}"></script>
    
    <!-- Initialisation Vue.js -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Attendre que Vue.js soit chargé
            const checkVue = setInterval(() => {
                if (window.Vue) {
                    clearInterval(checkVue);
                    
                    const { createApp } = Vue;
                    const app = createApp({
                        components: {
                            {{COMPONENTS}}
                        },
                        template: \`
                            <div class="main-content">
                                <{{MAIN_COMPONENT}} />
                            </div>
                        \`
                    });
                    
                    app.mount('#app');
                }
            }, 100);
        });
    </script>
</body>
</html>
"@

Set-Content "dist/templates/migrated-template.html" $baseTemplate -NoNewline

# Migrer toutes les pages
foreach ($page in $pages.GetEnumerator()) {
    Migrate-Page $page.Key $page.Value
}

Write-Host ""
Write-Host "Migration terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "Résumé des changements:" -ForegroundColor Blue
Write-Host "  ✅ Fichiers HTML simplifiés" -ForegroundColor Green
Write-Host "  ✅ Vue.js chargé automatiquement" -ForegroundColor Green
Write-Host "  ✅ CSS communs gérés automatiquement" -ForegroundColor Green
Write-Host "  ✅ Scripts JS chargés automatiquement" -ForegroundColor Green
Write-Host "  ✅ Configuration centralisée dans app-includes.js" -ForegroundColor Green
Write-Host "  ✅ Sauvegardes créées (.backup)" -ForegroundColor Green
Write-Host ""
Write-Host "Avantages de la nouvelle approche:" -ForegroundColor Blue
Write-Host "  🚀 Plus de répétition de code" -ForegroundColor Green
Write-Host "  🚀 Maintenance simplifiée" -ForegroundColor Green
Write-Host "  🚀 Configuration centralisée" -ForegroundColor Green
Write-Host "  🚀 Chargement optimisé" -ForegroundColor Green
Write-Host ""
Write-Host "Pour revenir en arrière, utilisez les fichiers .backup" -ForegroundColor Yellow
