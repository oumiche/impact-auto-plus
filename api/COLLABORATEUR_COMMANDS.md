# Commandes pour la gestion des collaborateurs

## 1. Créer un collaborateur individuel

```bash
php bin/console app:create-collaborateur \
  --firstName="Jean" \
  --lastName="Dupont" \
  --email="jean.dupont@example.com" \
  --phone="+225 07 12 34 56 78" \
  --employeeNumber="EMP001" \
  --department="Maintenance" \
  --position="Technicien Senior"
```

## 2. Créer plusieurs collaborateurs avec des données d'exemple

```bash
php bin/console app:create-collaborateur --bulk
```

Cette commande crée 5 collaborateurs d'exemple :
- Jean Dupont (Technicien Senior)
- Marie Martin (Expert Automobile)
- Pierre Kouassi (Mécanicien)
- Fatou Traoré (Peintre Automobile)
- Amadou Diallo (Contrôleur Technique)

## 3. Lister tous les collaborateurs

```bash
php bin/console app:list-collaborateurs
```

### Avec les tenants associés :
```bash
php bin/console app:list-collaborateurs --with-tenants
```

### Pour un tenant spécifique :
```bash
php bin/console app:list-collaborateurs --tenant=1
```

## 4. Associer un collaborateur à un tenant

```bash
php bin/console app:assign-collaborateur-to-tenant <collaborateur_id> <tenant_id>
```

Exemple :
```bash
php bin/console app:assign-collaborateur-to-tenant 1 1
```

## 5. Associer tous les collaborateurs à un tenant

```bash
php bin/console app:assign-collaborateur-to-tenant 1 --assign-all
```

## Workflow complet

1. Créer des collaborateurs :
```bash
php bin/console app:create-collaborateur --bulk
```

2. Lister les collaborateurs créés :
```bash
php bin/console app:list-collaborateurs
```

3. Associer tous les collaborateurs au tenant 1 :
```bash
php bin/console app:assign-collaborateur-to-tenant 1 --assign-all
```

4. Vérifier les associations :
```bash
php bin/console app:list-collaborateurs --with-tenants
```

## Notes

- Les collaborateurs sont créés sans association tenant par défaut
- Il faut les associer manuellement à un tenant pour qu'ils apparaissent dans l'API
- Un collaborateur peut être associé à plusieurs tenants
- Les commandes respectent le système de multi-tenant de l'application


INSERT INTO system_parameters (parameter_key, value, category, description) VALUES ('price_history_months', '6', 'price_registry', 'Nombre de mois pour calcul moyenne'), ('price_minimum_samples', '3', 'price_registry', 'Nombre minimum échantillons pour moyenne'), ('anomaly_threshold_critical', '50', 'price_registry', 'Seuil critique anomalie (%)'), ('anomaly_threshold_high', '30', 'price_registry', 'Seuil élevé anomalie (%)'), ('anomaly_threshold_medium', '20', 'price_registry', 'Seuil moyen anomalie (%)'), ('anomaly_threshold_low', '10', 'price_registry', 'Seuil faible anomalie (%)');