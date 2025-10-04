# Script PowerShell pour remplacer Vue.js CDN par Vue.js local dans tous les fichiers HTML
# Usage: PowerShell -ExecutionPolicy Bypass -File scripts/update-vue-local.ps1

Write-Host "Mise à jour de Vue.js CDN vers Vue.js local..." -ForegroundColor Blue

# Télécharger Vue.js si pas déjà présent
if (!(Test-Path "dist\js\vue.global.prod.js")) {
    Write-Host "Téléchargement de Vue.js..." -ForegroundColor Blue
    
    # Créer le dossier js s'il n'existe pas
    if (!(Test-Path "dist\js")) {
        New-Item -ItemType Directory -Path "dist\js" -Force
    }
    
    # Télécharger Vue.js
    Invoke-WebRequest -Uri "https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js" -OutFile "dist\js\vue.global.prod.js"
    Invoke-WebRequest -Uri "https://unpkg.com/vue@3.4.21/dist/vue.global.js" -OutFile "dist\js\vue.global.js"
    
    Write-Host "Vue.js téléchargé" -ForegroundColor Green
}

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
    
    # Remplacer les URLs CDN par les chemins locaux
    $content = $content -replace 'https://unpkg\.com/vue@3/dist/vue\.global\.prod\.js', 'js/vue.global.prod.js'
    $content = $content -replace 'https://unpkg\.com/vue@3/dist/vue\.global\.js', 'js/vue.global.js'
    $content = $content -replace 'https://unpkg\.com/vue@[0-9.]*/dist/vue\.global\.prod\.js', 'js/vue.global.prod.js'
    $content = $content -replace 'https://unpkg\.com/vue@[0-9.]*/dist/vue\.global\.js', 'js/vue.global.js'
    
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
Write-Host "Vue.js est maintenant hébergé localement dans dist/js/" -ForegroundColor Blue
Write-Host "Avantages:" -ForegroundColor Blue
Write-Host "  ✅ Pas de dépendance CDN externe" -ForegroundColor Green
Write-Host "  ✅ Performance améliorée" -ForegroundColor Green
Write-Host "  ✅ Fonctionnement hors ligne" -ForegroundColor Green
Write-Host "  ✅ Sécurité renforcée" -ForegroundColor Green
Write-Host "  ✅ Même logique sans compilation" -ForegroundColor Green

# Afficher les fichiers Vue.js
Write-Host ""
Write-Host "Fichiers Vue.js disponibles:" -ForegroundColor Blue
if (Test-Path "dist\js\vue.global*.js") {
    Get-ChildItem "dist\js\vue.global*.js" | ForEach-Object { Write-Host "  $($_.Name) ($([math]::Round($_.Length/1KB, 1)) KB)" -ForegroundColor Green }
} else {
    Write-Host "  Fichiers Vue.js non trouvés dans dist/js/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Pour revenir au CDN, utilisez: PowerShell -ExecutionPolicy Bypass -File scripts/update-vue-cdn.ps1" -ForegroundColor Blue
