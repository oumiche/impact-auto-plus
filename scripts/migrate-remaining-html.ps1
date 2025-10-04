# Script PowerShell pour migrer les fichiers HTML restants
# Usage: PowerShell -ExecutionPolicy Bypass -File scripts/migrate-remaining-html.ps1

Write-Host "Migration des fichiers HTML restants..." -ForegroundColor Blue

# Liste des fichiers à migrer avec leurs composants Vue
$files = @{
    "vehicle-interventions.html" = @{
        component = "VehicleInterventionCrud"
        css = "css/vehicle-interventions.css"
    }
    "garages.html" = @{
        component = "GarageCrud"
        css = "css/garages.css"
    }
    "supplies.html" = @{
        component = "SupplyCrud"
        css = "css/supplies.css"
    }
    "supply-categories.html" = @{
        component = "SupplyCategoryCrud"
        css = "css/supply-categories.css"
    }
    "vehicles-vue.html" = @{
        component = "VehicleCrud"
        css = "css/vehicles.css"
    }
    "users-vue.html" = @{
        component = "UserCrud"
        css = "css/users-vue.css"
    }
    "parametres-vue.html" = @{
        component = "ParametresVue"
        css = "css/parametres-vue.css"
    }
    "dashboard-vue.html" = @{
        component = "DashboardVue"
        css = "css/dashboard.css"
    }
}

# Template simplifié
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
    <link rel="stylesheet" href="{{CSS}}">
</head>
<body>
    <div id="app"></div>
    
    <!-- Script de la page -->
    <script src="{{JS}}"></script>
    
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
                            {{COMPONENT}}
                        },
                        template: \`
                            <div class="main-content">
                                <{{COMPONENT}} />
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

# Fonction pour migrer un fichier
function Migrate-File {
    param($filename, $config)
    
    Write-Host "Migration de: $filename" -ForegroundColor Blue
    
    # Créer une sauvegarde
    $backupPath = "dist/$filename.backup"
    Copy-Item "dist/$filename" $backupPath
    
    # Générer le nouveau contenu
    $content = $template
    $content = $content -replace '{{TITLE}}', $config.title
    $content = $content -replace '{{CSS}}', $config.css
    $content = $content -replace '{{JS}}', "js/$($filename -replace '\.html$', '')-vue.js"
    $content = $content -replace '{{COMPONENT}}', $config.component
    
    # Écrire le fichier
    Set-Content "dist/$filename" $content -NoNewline
    
    Write-Host "Migré: dist/$filename" -ForegroundColor Green
}

# Migrer tous les fichiers
foreach ($file in $files.GetEnumerator()) {
    # Déterminer le titre depuis le nom du fichier
    $title = $file.Key -replace '\.html$', '' -replace '-', ' '
    $title = (Get-Culture).TextInfo.ToTitleCase($title)
    
    $config = @{
        title = $title
        css = $file.Value.css
        component = $file.Value.component
    }
    
    Migrate-File $file.Key $config
}

Write-Host ""
Write-Host "Migration terminée !" -ForegroundColor Green
Write-Host "Fichiers migrés: $($files.Count)" -ForegroundColor Blue
Write-Host "Sauvegardes créées avec extension .backup" -ForegroundColor Yellow
