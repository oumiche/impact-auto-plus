# Script pour tester le chargement du sidebar sur toutes les pages
Write-Host "=== Test du chargement du sidebar ===" -ForegroundColor Green

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
    "dashboard-vue.html",
    "test-sidebar.html"
)

$distPath = "dist"
$results = @()

foreach ($page in $pages) {
    $pagePath = Join-Path $distPath $page
    
    if (Test-Path $pagePath) {
        Write-Host "Vérification de $page..." -ForegroundColor Yellow
        
        # Vérifier si la page utilise app-includes.js
        $content = Get-Content $pagePath -Raw
        
        if ($content -match "app-includes\.js") {
            Write-Host "  ✅ Utilise app-includes.js" -ForegroundColor Green
            
            # Vérifier si load-sidebar.js est référencé
            if ($content -match "load-sidebar\.js") {
                Write-Host "  ✅ load-sidebar.js référencé dans app-includes.js" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  load-sidebar.js non référencé" -ForegroundColor Yellow
            }
            
            $results += [PSCustomObject]@{
                Page = $page
                Status = "OK"
                UsesAppIncludes = $true
                HasLoadSidebar = ($content -match "load-sidebar\.js")
            }
        } else {
            Write-Host "  ❌ N'utilise pas app-includes.js" -ForegroundColor Red
            
            $results += [PSCustomObject]@{
                Page = $page
                Status = "Architecture ancienne"
                UsesAppIncludes = $false
                HasLoadSidebar = $false
            }
        }
    } else {
        Write-Host "  ❌ Fichier non trouvé: $page" -ForegroundColor Red
        
        $results += [PSCustomObject]@{
            Page = $page
            Status = "Fichier manquant"
            UsesAppIncludes = $false
            HasLoadSidebar = $false
        }
    }
}

Write-Host "`n=== Résumé ===" -ForegroundColor Green
$results | Format-Table -AutoSize

$okCount = ($results | Where-Object { $_.Status -eq "OK" }).Count
$totalCount = $results.Count

Write-Host "Pages avec architecture moderne: $okCount/$totalCount" -ForegroundColor $(if ($okCount -eq $totalCount) { "Green" } else { "Yellow" })

# Vérifier app-includes.js
Write-Host "`n=== Vérification d'app-includes.js ===" -ForegroundColor Green
$appIncludesPath = Join-Path $distPath "js\app-includes.js"

if (Test-Path $appIncludesPath) {
    $appIncludesContent = Get-Content $appIncludesPath -Raw
    
    if ($appIncludesContent -match "load-sidebar\.js") {
        Write-Host "✅ load-sidebar.js est référencé dans app-includes.js" -ForegroundColor Green
    } else {
        Write-Host "❌ load-sidebar.js n'est PAS référencé dans app-includes.js" -ForegroundColor Red
    }
    
    if ($appIncludesContent -match "SidebarLoader") {
        Write-Host "✅ SidebarLoader est initialisé dans app-includes.js" -ForegroundColor Green
    } else {
        Write-Host "❌ SidebarLoader n'est PAS initialisé dans app-includes.js" -ForegroundColor Red
    }
} else {
    Write-Host "❌ app-includes.js non trouvé" -ForegroundColor Red
}

Write-Host "`n=== Instructions de test ===" -ForegroundColor Cyan
Write-Host "1. Ouvrez test-sidebar.html dans votre navigateur" -ForegroundColor White
Write-Host "2. Vérifiez que le sidebar apparaît automatiquement" -ForegroundColor White
Write-Host "3. Testez les autres pages listées ci-dessus" -ForegroundColor White
Write-Host "4. Si le sidebar ne se charge pas, vérifiez la console du navigateur" -ForegroundColor White
