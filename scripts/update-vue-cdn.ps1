# Script PowerShell pour remplacer Vue.js local par Vue.js CDN dans tous les fichiers HTML
# Usage: PowerShell -ExecutionPolicy Bypass -File scripts/update-vue-cdn.ps1

Write-Host "Mise à jour de Vue.js local vers Vue.js CDN..." -ForegroundColor Blue

# Liste des fichiers HTML à modifier
$HTML_FILES = @(
    "dist\index.html",
    "dist\intervention-quotes.html",
    "dist\intervention-quote-create.html",
    "dist\intervention-quote-edit.html",
    "dist\intervention-work-authorizations.html",
    "dist\intervention-work-authorization-create.html",
    "dist\intervention-work-authorization-edit.html",
    "dist\intervention-invoices.html",
    "dist\intervention-invoice-create.html",
    "dist\intervention-invoice-edit.html",
    "dist\intervention-invoice-view.html",
    "dist\intervention-reception-reports.html",
    "dist\intervention-reception-report-create.html",
    "dist\intervention-reception-report-edit.html",
    "dist\intervention-reception-report-view.html",
    "dist\dashboard-vue.html",
    "dist\parametres-vue.html",
    "dist\users-vue.html",
    "dist\vehicles-vue.html"
)

# Fonction pour mettre à jour un fichier
function Update-File {
    param($file)
    
    if (!(Test-Path $file)) {
        Write-Host "Fichier non trouvé: $file" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Mise à jour de: $file" -ForegroundColor Blue
    
    # Créer une sauvegarde
    Copy-Item $file "$file.bak"
    
    # Lire le contenu du fichier
    $content = Get-Content $file -Raw
    
    # Remplacer les chemins locaux par les URLs CDN
    $content = $content -replace 'js/vue\.global\.prod\.js', 'https://unpkg.com/vue@3/dist/vue.global.prod.js'
    $content = $content -replace 'js/vue\.global\.js', 'https://unpkg.com/vue@3/dist/vue.global.js'
    
    # Écrire le contenu modifié
    Set-Content $file $content -NoNewline
    
    # Vérifier si des changements ont été faits
    $originalContent = Get-Content "$file.bak" -Raw
    if ($content -ne $originalContent) {
        Write-Host "Mis à jour: $file" -ForegroundColor Green
    } else {
        Write-Host "Aucun changement: $file" -ForegroundColor Blue
        Remove-Item "$file.bak"
    }
}

# Mettre à jour tous les fichiers
foreach ($file in $HTML_FILES) {
    Update-File $file
}

Write-Host "Mise à jour terminée !" -ForegroundColor Green
Write-Host "Vue.js utilise maintenant le CDN" -ForegroundColor Blue
Write-Host "Avantages CDN:" -ForegroundColor Blue
Write-Host "  ✅ Cache partagé entre sites" -ForegroundColor Green
Write-Host "  ✅ Mise à jour automatique" -ForegroundColor Green
Write-Host "  ✅ Moins d'espace disque" -ForegroundColor Green

Write-Host ""
Write-Host "Pour revenir au local, utilisez: PowerShell -ExecutionPolicy Bypass -File scripts/update-vue-local.ps1" -ForegroundColor Blue
