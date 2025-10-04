# Script PowerShell pour générer les fichiers HTML à partir du template
# Usage: PowerShell -ExecutionPolicy Bypass -File scripts/generate-html.ps1

Write-Host "Génération des fichiers HTML à partir du template..." -ForegroundColor Blue

# Configuration des pages
$pages = @{
    "intervention-quotes.html" = @{
        title = "Gestion des Devis"
        css = @(
            "css/parametres-vue.css",
            "css/intervention-types.css", 
            "css/vehicle-interventions.css",
            "css/intervention-quotes.css"
        )
        script = @"
const app = Vue.createApp({
    components: {
        InterventionQuotesList,
        AttachmentGallery: window.AttachmentGallery
    },
    template: \`
        <div class="main-content">
            <InterventionQuotesList />
        </div>
    \`
});
app.mount('#app');
"@
    }
    
    "intervention-work-authorizations.html" = @{
        title = "Autorisations de Travail"
        css = @(
            "css/parametres-vue.css",
            "css/intervention-types.css",
            "css/vehicle-interventions.css", 
            "css/intervention-work-authorizations.css"
        )
        script = @"
const app = Vue.createApp({
    components: {
        InterventionWorkAuthorizationsList,
        AttachmentGallery: window.AttachmentGallery
    },
    template: \`
        <div class="main-content">
            <InterventionWorkAuthorizationsList />
        </div>
    \`
});
app.mount('#app');
"@
    }
    
    "intervention-invoices.html" = @{
        title = "Factures d'Intervention"
        css = @(
            "css/parametres-vue.css",
            "css/intervention-types.css",
            "css/vehicle-interventions.css",
            "css/intervention-invoices.css"
        )
        script = @"
const app = Vue.createApp({
    components: {
        InterventionInvoicesList,
        AttachmentGallery: window.AttachmentGallery
    },
    template: \`
        <div class="main-content">
            <InterventionInvoicesList />
        </div>
    \`
});
app.mount('#app');
"@
    }
}

# Lire le template de base
$template = Get-Content "dist/templates/base-template.html" -Raw

# Fonction pour générer une page
function Generate-Page {
    param($filename, $config)
    
    Write-Host "Génération de: $filename" -ForegroundColor Blue
    
    $content = $template
    
    # Remplacer les placeholders
    $content = $content -replace '{{TITLE}}', $config.title
    
    # Générer les CSS
    $cssLinks = ""
    foreach ($css in $config.css) {
        $cssLinks += "    <link rel='stylesheet' href='$css'>`n"
    }
    $content = $content -replace '{{PAGE_CSS}}', $cssLinks.Trim()
    
    # Ajouter le script
    $content = $content -replace '{{PAGE_SCRIPT}}', $config.script
    
    # Écrire le fichier
    $outputPath = "dist/$filename"
    Set-Content $outputPath $content -NoNewline
    
    Write-Host "Généré: $outputPath" -ForegroundColor Green
}

# Générer toutes les pages
foreach ($page in $pages.GetEnumerator()) {
    Generate-Page $page.Key $page.Value
}

Write-Host "Génération terminée !" -ForegroundColor Green
Write-Host "Avantages de cette approche:" -ForegroundColor Blue
Write-Host "  ✅ Un seul template à maintenir" -ForegroundColor Green
Write-Host "  ✅ Configuration centralisée" -ForegroundColor Green
Write-Host "  ✅ Chargement dynamique de Vue.js" -ForegroundColor Green
Write-Host "  ✅ CSS et JS gérés automatiquement" -ForegroundColor Green
Write-Host "  ✅ Pas de répétition de code" -ForegroundColor Green
