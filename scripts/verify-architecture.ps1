# Script pour vérifier que toutes les pages suivent la même architecture
Write-Host "=== Vérification de l'architecture des pages ===" -ForegroundColor Green

# Liste des pages avec la nouvelle architecture
$pages = @(
    "intervention-quotes.html",
    "intervention-quote-create.html", 
    "intervention-quote-edit.html",
    "intervention-work-authorizations.html",
    "intervention-work-authorization-create.html",
    "intervention-work-authorization-edit.html",
    "intervention-invoices.html",
    "intervention-invoice-create.html",
    "intervention-invoice-edit.html",
    "intervention-invoice-view.html",
    "intervention-reception-reports.html",
    "intervention-reception-report-create.html",
    "intervention-reception-report-edit.html",
    "intervention-reception-report-view.html",
    "drivers.html",
    "intervention-prediagnostics.html",
    "intervention-prediagnostic-create.html",
    "intervention-prediagnostic-edit.html",
    "vehicles-vue.html",
    "users-vue.html",
    "dashboard-vue.html"
)

$distPath = "dist"
$results = @()

Write-Host "Vérification des fichiers JavaScript correspondants..." -ForegroundColor Yellow

foreach ($page in $pages) {
    $pagePath = Join-Path $distPath $page
    $pageName = [System.IO.Path]::GetFileNameWithoutExtension($page)
    $jsFile = Join-Path $distPath "js\$pageName.js"
    
    if (Test-Path $pagePath) {
        Write-Host "`nVérification de $page..." -ForegroundColor Cyan
        
        $content = Get-Content $pagePath -Raw
        
        # Vérifier l'architecture
        $usesAppIncludes = $content -match "app-includes\.js"
        $hasInlineJS = $content -match "<script>.*createApp.*</script>" -and !($content -match 'src="js/')
        $hasExternalJS = Test-Path $jsFile
        
        if ($usesAppIncludes -and !$hasInlineJS -and $hasExternalJS) {
            Write-Host "  ✅ Architecture correcte" -ForegroundColor Green
            Write-Host "    - Utilise app-includes.js" -ForegroundColor Green
            Write-Host "    - JavaScript externe: $pageName.js" -ForegroundColor Green
            Write-Host "    - Pas de JavaScript inline" -ForegroundColor Green
            
            $status = "OK"
        } elseif ($usesAppIncludes -and $hasInlineJS) {
            Write-Host "  ⚠️  JavaScript inline détecté" -ForegroundColor Yellow
            Write-Host "    - Utilise app-includes.js" -ForegroundColor Green
            Write-Host "    - Mais contient du JavaScript inline" -ForegroundColor Yellow
            
            $status = "JavaScript inline"
        } elseif (!$usesAppIncludes) {
            Write-Host "  ❌ Architecture ancienne" -ForegroundColor Red
            Write-Host "    - N'utilise pas app-includes.js" -ForegroundColor Red
            
            $status = "Architecture ancienne"
        } elseif (!$hasExternalJS) {
            Write-Host "  ❌ Fichier JS manquant" -ForegroundColor Red
            Write-Host "    - Utilise app-includes.js" -ForegroundColor Green
            Write-Host "    - Mais $pageName.js n'existe pas" -ForegroundColor Red
            
            $status = "Fichier JS manquant"
        }
        
        $results += [PSCustomObject]@{
            Page = $page
            Status = $status
            UsesAppIncludes = $usesAppIncludes
            HasExternalJS = $hasExternalJS
            HasInlineJS = $hasInlineJS
        }
    } else {
        Write-Host "  ❌ Fichier non trouvé: $page" -ForegroundColor Red
        
        $results += [PSCustomObject]@{
            Page = $page
            Status = "Fichier manquant"
            UsesAppIncludes = $false
            HasExternalJS = $false
            HasInlineJS = $false
        }
    }
}

Write-Host "`n=== Résumé ===" -ForegroundColor Green
$results | Format-Table -AutoSize

$okCount = ($results | Where-Object { $_.Status -eq "OK" }).Count
$totalCount = $results.Count

Write-Host "Pages avec architecture correcte: $okCount/$totalCount" -ForegroundColor $(if ($okCount -eq $totalCount) { "Green" } else { "Yellow" })

if ($okCount -lt $totalCount) {
    Write-Host "`n=== Actions recommandées ===" -ForegroundColor Yellow
    
    $inlineJS = $results | Where-Object { $_.HasInlineJS -eq $true }
    if ($inlineJS) {
        Write-Host "Pages avec JavaScript inline à séparer:" -ForegroundColor Yellow
        $inlineJS | ForEach-Object { Write-Host "  - $($_.Page)" -ForegroundColor White }
    }
    
    $missingJS = $results | Where-Object { $_.Status -eq "Fichier JS manquant" }
    if ($missingJS) {
        Write-Host "Fichiers JavaScript manquants:" -ForegroundColor Yellow
        $missingJS | ForEach-Object { 
            $pageName = [System.IO.Path]::GetFileNameWithoutExtension($_.Page)
            Write-Host "  - js/$pageName.js" -ForegroundColor White 
        }
    }
    
    $oldArchitecture = $results | Where-Object { $_.Status -eq "Architecture ancienne" }
    if ($oldArchitecture) {
        Write-Host "Pages avec architecture ancienne:" -ForegroundColor Yellow
        $oldArchitecture | ForEach-Object { Write-Host "  - $($_.Page)" -ForegroundColor White }
    }
} else {
    Write-Host "`n🎉 Toutes les pages suivent la même architecture !" -ForegroundColor Green
}

Write-Host "`n=== Architecture standard ===" -ForegroundColor Cyan
Write-Host "1. Utilise app-includes.js pour charger Vue.js et les services" -ForegroundColor White
Write-Host "2. JavaScript séparé dans un fichier .js" -ForegroundColor White
Write-Host "3. Pas de JavaScript inline dans le HTML" -ForegroundColor White
Write-Host "4. CSS spécifiques à la page chargés séparément" -ForegroundColor White
Write-Host "5. Sidebar chargé automatiquement via load-sidebar.js" -ForegroundColor White
