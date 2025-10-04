# Script PowerShell pour corriger les fichiers manquants dans les HTML
# Usage: PowerShell -ExecutionPolicy Bypass -File scripts/fix-missing-files.ps1

Write-Host "Vérification et correction des fichiers manquants..." -ForegroundColor Blue

# Fonction pour vérifier si un fichier existe
function Test-FileExists {
    param($path)
    return Test-Path "dist/$path"
}

# Fonction pour corriger un fichier HTML
function Fix-HTMLFile {
    param($filename, $jsFile, $cssFile, $componentName)
    
    if (!(Test-Path "dist/$filename")) {
        Write-Host "Fichier non trouvé: $filename" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Vérification de: $filename" -ForegroundColor Blue
    
    $needsFix = $false
    $content = Get-Content "dist/$filename" -Raw
    
    # Vérifier le fichier JS
    if ($jsFile -and !(Test-FileExists $jsFile)) {
        Write-Host "  ❌ Fichier JS manquant: $jsFile" -ForegroundColor Red
        $needsFix = $true
    }
    
    # Vérifier le fichier CSS
    if ($cssFile -and !(Test-FileExists $cssFile)) {
        Write-Host "  ❌ Fichier CSS manquant: $cssFile" -ForegroundColor Red
        $needsFix = $true
    }
    
    if ($needsFix) {
        Write-Host "  🔧 Correction nécessaire pour: $filename" -ForegroundColor Yellow
        
        # Créer une sauvegarde
        Copy-Item "dist/$filename" "dist/$filename.backup"
        
        # Proposer une correction ou utiliser des fichiers alternatifs
        Write-Host "  💡 Suggestions de correction:" -ForegroundColor Cyan
        
        if ($jsFile -and !(Test-FileExists $jsFile)) {
            $altJs = $jsFile -replace '-vue\.js$', '.js'
            if (Test-FileExists $altJs) {
                Write-Host "    - Utiliser: $altJs" -ForegroundColor Green
            } else {
                Write-Host "    - Créer le fichier manquant ou utiliser une approche alternative" -ForegroundColor Yellow
            }
        }
        
        if ($cssFile -and !(Test-FileExists $cssFile)) {
            $altCss = $cssFile -replace '\.css$', '.css'
            $similarCss = Get-ChildItem "dist/css" -Name "*.css" | Where-Object { $_ -like "*$(Split-Path $cssFile -LeafBase)*" }
            if ($similarCss) {
                Write-Host "    - Fichiers CSS similaires trouvés: $($similarCss -join ', ')" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  ✅ Fichiers trouvés" -ForegroundColor Green
    }
}

# Liste des fichiers à vérifier
$filesToCheck = @(
    @{
        html = "dashboard-vue.html"
        js = "js/dashboard-vue.js"
        css = "css/dashboard.css"
        component = "DashboardVue"
    },
    @{
        html = "vehicles-vue.html"
        js = "js/vehicles-vue.js"
        css = "css/vehicles.css"
        component = "VehicleCrud"
    },
    @{
        html = "users-vue.html"
        js = "js/users-vue.js"
        css = "css/users-vue.css"
        component = "UserCrud"
    },
    @{
        html = "drivers.html"
        js = "js/drivers-vue.js"
        css = "css/drivers.css"
        component = "DriverCrud"
    }
)

# Vérifier tous les fichiers
foreach ($file in $filesToCheck) {
    Fix-HTMLFile $file.html $file.js $file.css $file.component
    Write-Host ""
}

Write-Host "Vérification terminée !" -ForegroundColor Green
Write-Host "Les fichiers .backup ont été créés pour les fichiers nécessitant des corrections." -ForegroundColor Yellow
