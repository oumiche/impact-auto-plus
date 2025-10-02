# 🗄️ Architecture Multi-Database par Tenant - Impact Auto

## Vue d'ensemble

Documentation de l'architecture multi-database permettant d'avoir une base de données séparée par tenant, offrant une isolation totale des données et une scalabilité optimale.

## 🎯 Objectifs

- **Isolation totale** des données par tenant
- **Sécurité maximale** (pas de fuite possible entre tenants)
- **Performance optimale** (requêtes plus rapides)
- **Scalabilité horizontale** (distribution sur plusieurs serveurs)
- **Sauvegarde indépendante** par tenant
- **Migration facile** d'un tenant

## 🏗️ Stratégies d'Architecture

### 1. Option A : Base de Données Séparée par Tenant

#### Structure
```
impact_auto_tenant_1    # Base pour tenant 1
impact_auto_tenant_2    # Base pour tenant 2
impact_auto_tenant_3    # Base pour tenant 3
impact_auto_global      # Base globale (utilisateurs, tenants, etc.)
```

#### Avantages
- ✅ **Isolation complète** des données
- ✅ **Sécurité maximale**
- ✅ **Performance optimale**
- ✅ **Sauvegarde indépendante**

### 2. Option B : Schéma Séparé par Tenant

#### Structure
```
impact_auto.tenant_1_vehicles
impact_auto.tenant_1_interventions
impact_auto.tenant_2_vehicles
impact_auto.tenant_2_interventions
```

#### Avantages
- ✅ **Gestion simplifiée**
- ✅ **Moins de connexions**
- ✅ **Maintenance centralisée**

## 🌐 Routage et Hostname

### 1. Routage par URL

#### Configuration
```php
// URL : https://impact-auto.com/tenant1/dashboard
// URL : https://impact-auto.com/tenant2/dashboard

// Détection du tenant depuis l'URL
$tenantSlug = $_SERVER['REQUEST_URI']; // /tenant1/dashboard
$tenant = TenantService::getBySlug($tenantSlug);
$database = "impact_auto_tenant_" . $tenant->getId();
```

### 2. Sous-domaines (Recommandé)

#### Configuration
```
https://tenant1.impact-auto.com    # Base : impact_auto_tenant_1
https://tenant2.impact-auto.com    # Base : impact_auto_tenant_2
https://admin.impact-auto.com      # Base : impact_auto_global
```

#### Avantages
- ✅ **Séparation claire** des tenants
- ✅ **URLs mémorables**
- ✅ **Configuration SSL** simplifiée
- ✅ **Cache** par sous-domaine

## 🗃️ Structure des Bases de Données

### 1. Base Globale (`impact_auto_global`)

#### Tables Globales
```sql
-- Gestion des tenants
tenants              # Liste des tenants
tenant_databases     # Mapping tenant → base
tenant_settings      # Paramètres par tenant

-- Utilisateurs système
users               # Utilisateurs système
user_tenants        # Relations utilisateurs ↔ tenants
permissions         # Permissions globales

-- Configuration
code_formats        # Formats de codes
system_parameters   # Paramètres globaux
audit_logs          # Logs d'audit
```

### 2. Base par Tenant (`impact_auto_tenant_X`)

#### Tables Spécifiques
```sql
-- Entités métier
vehicles            # Véhicules du tenant
drivers             # Conducteurs du tenant
interventions       # Interventions du tenant
collaborateurs      # Collaborateurs du tenant
supplies            # Fournitures du tenant
garages             # Garages du tenant
suppliers           # Fournisseurs du tenant

-- Documents
prediagnostics      # Pré-diagnostics
quotes              # Devis
work_authorizations # Autorisations de travaux
field_verifications # Vérifications terrain
reception_reports   # Rapports de réception
invoices            # Factures

-- Maintenance
maintenances        # Entretiens
fuel_logs           # Logs de carburant
insurances          # Assurances
attachments         # Pièces jointes
```

## 🔧 Gestion des Connexions

### 1. Service de Connexion Dynamique

#### Implémentation PHP
```php
class DatabaseService {
    private $connections = [];
    
    public function getConnectionForTenant($tenantId) {
        $database = "impact_auto_tenant_" . $tenantId;
        
        if (!isset($this->connections[$tenantId])) {
            $this->connections[$tenantId] = new PDO(
                "mysql:host={$host};dbname={$database}",
                $user,
                $pass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        }
        
        return $this->connections[$tenantId];
    }
    
    public function getGlobalConnection() {
        if (!isset($this->connections['global'])) {
            $this->connections['global'] = new PDO(
                "mysql:host={$host};dbname=impact_auto_global",
                $user,
                $pass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        }
        
        return $this->connections['global'];
    }
}
```

### 2. Middleware de Routage

#### Détection Automatique
```php
class TenantMiddleware {
    public function handle($request, $next) {
        // Détection du tenant depuis l'URL ou sous-domaine
        $tenant = $this->detectTenantFromRequest($request);
        
        if (!$tenant) {
            return response('Tenant non trouvé', 404);
        }
        
        // Définir la connexion pour ce tenant
        app()->instance('tenant', $tenant);
        app()->instance('tenant_db', 
            DatabaseService::getConnectionForTenant($tenant->getId())
        );
        
        return $next($request);
    }
    
    private function detectTenantFromRequest($request) {
        // Méthode 1: Sous-domaine
        $subdomain = $this->getSubdomain($request->getHost());
        if ($subdomain && $subdomain !== 'www') {
            return Tenant::where('slug', $subdomain)->first();
        }
        
        // Méthode 2: URL path
        $path = $request->getPathInfo();
        $segments = explode('/', trim($path, '/'));
        if (count($segments) > 0) {
            return Tenant::where('slug', $segments[0])->first();
        }
        
        return null;
    }
}
```

## 🚀 Migration et Provisioning

### 1. Création d'un Nouveau Tenant

#### Processus Automatisé
```php
class TenantProvisioningService {
    public function createTenant($tenantData) {
        DB::transaction(function() use ($tenantData) {
            // 1. Créer le tenant dans la base globale
            $tenant = Tenant::create($tenantData);
            
            // 2. Créer la base de données
            $this->createTenantDatabase($tenant->getId());
            
            // 3. Exécuter les migrations
            $this->runMigrations($tenant->getId());
            
            // 4. Insérer les données de base
            $this->seedTenantData($tenant->getId());
            
            // 5. Configurer les permissions
            $this->setupTenantPermissions($tenant->getId());
        });
    }
    
    private function createTenantDatabase($tenantId) {
        $database = "impact_auto_tenant_{$tenantId}";
        
        DB::statement("CREATE DATABASE `{$database}`");
        DB::statement("GRANT ALL PRIVILEGES ON `{$database}`.* TO 'impact_user'@'%'");
    }
    
    private function runMigrations($tenantId) {
        $database = "impact_auto_tenant_{$tenantId}";
        
        Artisan::call('migrate', [
            '--database' => 'tenant',
            '--path' => 'database/migrations/tenant'
        ]);
    }
}
```

### 2. Script de Provisioning

#### Commande Artisan
```php
// php artisan tenant:create "Nouveau Tenant"
class CreateTenantCommand extends Command {
    protected $signature = 'tenant:create {name} {--slug=} {--email=}';
    
    public function handle() {
        $name = $this->argument('name');
        $slug = $this->option('slug') ?: Str::slug($name);
        $email = $this->option('email');
        
        $tenantData = [
            'name' => $name,
            'slug' => $slug,
            'email' => $email,
            'is_active' => true
        ];
        
        $provisioningService = new TenantProvisioningService();
        $tenant = $provisioningService->createTenant($tenantData);
        
        $this->info("Tenant créé: {$tenant->name} (ID: {$tenant->id})");
        $this->info("Base de données: impact_auto_tenant_{$tenant->id}");
        $this->info("URL: https://{$slug}.impact-auto.com");
    }
}
```

## 💾 Gestion des Sauvegardes

### 1. Sauvegarde par Tenant

#### Scripts de Sauvegarde
```bash
#!/bin/bash
# backup_tenant.sh

TENANT_ID=$1
DATABASE="impact_auto_tenant_${TENANT_ID}"
BACKUP_DIR="/backups/tenants"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer le répertoire de sauvegarde
mkdir -p "${BACKUP_DIR}/${TENANT_ID}"

# Sauvegarde de la base
mysqldump --single-transaction --routines --triggers \
    "${DATABASE}" > "${BACKUP_DIR}/${TENANT_ID}/backup_${DATE}.sql"

# Compression
gzip "${BACKUP_DIR}/${TENANT_ID}/backup_${DATE}.sql"

# Nettoyage des anciennes sauvegardes (garder 30 jours)
find "${BACKUP_DIR}/${TENANT_ID}" -name "backup_*.sql.gz" -mtime +30 -delete

echo "Sauvegarde terminée: ${DATABASE}"
```

### 2. Sauvegarde Globale

#### Script de Sauvegarde Globale
```bash
#!/bin/bash
# backup_global.sh

BACKUP_DIR="/backups/global"
DATE=$(date +%Y%m%d_%H%M%S)

# Sauvegarde de la base globale
mysqldump --single-transaction --routines --triggers \
    "impact_auto_global" > "${BACKUP_DIR}/global_backup_${DATE}.sql"

# Compression
gzip "${BACKUP_DIR}/global_backup_${DATE}.sql"

echo "Sauvegarde globale terminée"
```

### 3. Restauration Sélective

#### Script de Restauration
```bash
#!/bin/bash
# restore_tenant.sh

TENANT_ID=$1
BACKUP_FILE=$2
DATABASE="impact_auto_tenant_${TENANT_ID}"

# Décompression si nécessaire
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | mysql "$DATABASE"
else
    mysql "$DATABASE" < "$BACKUP_FILE"
fi

echo "Restauration terminée: ${DATABASE}"
```

## 📊 Monitoring et Maintenance

### 1. Métriques par Base

#### Indicateurs de Performance
```php
class TenantMetricsService {
    public function getTenantMetrics($tenantId) {
        $database = "impact_auto_tenant_{$tenantId}";
        
        return [
            'database_size' => $this->getDatabaseSize($database),
            'table_count' => $this->getTableCount($database),
            'record_count' => $this->getRecordCount($database),
            'last_activity' => $this->getLastActivity($database),
            'performance_metrics' => $this->getPerformanceMetrics($database)
        ];
    }
    
    private function getDatabaseSize($database) {
        $result = DB::select("
            SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
            FROM information_schema.tables 
            WHERE table_schema = ?
        ", [$database]);
        
        return $result[0]->size_mb ?? 0;
    }
}
```

### 2. Maintenance Indépendante

#### Optimisation par Tenant
```php
class TenantMaintenanceService {
    public function optimizeTenant($tenantId) {
        $database = "impact_auto_tenant_{$tenantId}";
        
        // Optimisation des tables
        $this->optimizeTables($database);
        
        // Nettoyage des données
        $this->cleanupOldData($database);
        
        // Mise à jour des statistiques
        $this->updateStatistics($database);
    }
    
    private function optimizeTables($database) {
        $tables = $this->getTables($database);
        
        foreach ($tables as $table) {
            DB::statement("OPTIMIZE TABLE `{$database}`.`{$table}`");
        }
    }
}
```

## ⚙️ Configuration

### 1. Configuration Laravel/PHP

#### Fichier de Configuration
```php
// config/database.php
'connections' => [
    'global' => [
        'driver' => 'mysql',
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => env('DB_PORT', '3306'),
        'database' => 'impact_auto_global',
        'username' => env('DB_USERNAME', 'forge'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],
    'tenant' => [
        'driver' => 'mysql',
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => env('DB_PORT', '3306'),
        'database' => 'impact_auto_tenant_{id}',
        'username' => env('DB_USERNAME', 'forge'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ]
];
```

### 2. Configuration Nginx

#### Routage par Sous-domaine
```nginx
# /etc/nginx/sites-available/impact-auto
server {
    listen 80;
    server_name *.impact-auto.com;
    
    root /var/www/impact-auto/public;
    index index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        
        # Passer le sous-domaine à PHP
        fastcgi_param HTTP_X_TENANT $host;
    }
}
```

### 3. Configuration SSL

#### Certificat Wildcard
```bash
# Génération du certificat wildcard
certbot certonly --manual -d *.impact-auto.com -d impact-auto.com

# Configuration Nginx SSL
server {
    listen 443 ssl http2;
    server_name *.impact-auto.com;
    
    ssl_certificate /etc/letsencrypt/live/impact-auto.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/impact-auto.com/privkey.pem;
    
    # Configuration SSL...
}
```

## 🔐 Sécurité

### 1. Isolation des Données

#### Contrôles d'Accès
- **Connexions séparées** par tenant
- **Permissions** au niveau base de données
- **Audit logs** pour chaque accès
- **Chiffrement** des données sensibles

### 2. Gestion des Permissions

#### Permissions par Base
```sql
-- Créer un utilisateur pour chaque tenant
CREATE USER 'tenant_1'@'%' IDENTIFIED BY 'password_secure';
GRANT ALL PRIVILEGES ON impact_auto_tenant_1.* TO 'tenant_1'@'%';

CREATE USER 'tenant_2'@'%' IDENTIFIED BY 'password_secure';
GRANT ALL PRIVILEGES ON impact_auto_tenant_2.* TO 'tenant_2'@'%';
```

## 📈 Avantages vs Inconvénients

### ✅ Avantages

#### Sécurité
- **Isolation totale** des données
- **Sécurité maximale** (pas de fuite possible)
- **Contrôle d'accès** granulaire
- **Audit** facilité

#### Performance
- **Requêtes plus rapides** (moins de données)
- **Index optimisés** par tenant
- **Cache** par base de données
- **Scalabilité** horizontale

#### Maintenance
- **Sauvegarde indépendante** par tenant
- **Migration facile** d'un tenant
- **Maintenance** sans impact sur les autres
- **Restauration** sélective

### ❌ Inconvénients

#### Complexité
- **Gestion** plus complexe
- **Monitoring** de multiples bases
- **Maintenance** plus lourde
- **Coût** en ressources

#### Développement
- **Migration** des données entre tenants
- **Tests** plus complexes
- **Déploiement** plus complexe
- **Debugging** plus difficile

## 🚀 Recommandations

### 1. Stratégie de Migration

#### Phase 1 : Base Unique
- Commencer avec une base unique + `tenant_id`
- Implémenter l'isolation au niveau application
- Tester la scalabilité

#### Phase 2 : Migration Progressive
- Identifier les tenants volumineux
- Migrer progressivement vers des bases séparées
- Maintenir la compatibilité

#### Phase 3 : Architecture Complète
- Tous les nouveaux tenants en base séparée
- Optimisation des performances
- Monitoring avancé

### 2. Outils Recommandés

#### Développement
- **Laravel** avec multi-database
- **Docker** pour l'environnement de développement
- **Laravel Horizon** pour les queues

#### Production
- **MySQL** avec réplication
- **Redis** pour le cache
- **Nginx** pour le routage
- **Prometheus** pour le monitoring

### 3. Métriques à Surveiller

#### Performance
- Taille des bases de données
- Temps de réponse des requêtes
- Utilisation des ressources
- Charge des serveurs

#### Business
- Nombre de tenants actifs
- Croissance des données par tenant
- Utilisation des fonctionnalités
- Satisfaction des utilisateurs

---

*Documentation de l'architecture multi-database - Impact Auto v1.0*
