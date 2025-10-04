# 🚀 Guide de Déploiement - Impact Auto

## 📍 Déploiement sur Ubuntu Server 24.04

Ce guide vous accompagne dans le déploiement d'**Impact Auto** sur un serveur Ubuntu 24.04 avec LAMP déjà installé.

### 🌐 Informations du Serveur
- **URL :** [https://vps114702.serveur-vps.net/](https://vps114702.serveur-vps.net/)
- **Serveur :** Ubuntu Server 24.04 LTS
- **Stack :** LAMP (Linux, Apache, MySQL, PHP)

## 🎯 Options de Déploiement

### Option 1 : Déploiement Automatisé (Recommandé)

```bash
# Télécharger et exécuter le script d'installation
wget https://raw.githubusercontent.com/oumiche/impact-auto-plus/main/scripts/deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

### Option 2 : Déploiement Manuel

Suivez le guide détaillé : [DEPLOIEMENT_UBUNTU.md](DEPLOIEMENT_UBUNTU.md)

## 📋 Prérequis

- ✅ Ubuntu Server 24.04 LTS
- ✅ LAMP Stack installé (Apache, MySQL, PHP 8.2+)
- ✅ Accès root/sudo
- ✅ Connexion Internet
- ✅ Domaine configuré : `vps114702.serveur-vps.net`

## 🔧 Fonctionnalités Déployées

### Backend (API Symfony)
- ✅ **CRUD Complet** pour toutes les entités
- ✅ **Authentification JWT** sécurisée
- ✅ **API REST** avec documentation
- ✅ **Gestion multi-tenant**
- ✅ **Upload de fichiers** et pièces jointes
- ✅ **Recherche avancée** server-side
- ✅ **Statistiques** et métriques

### Frontend (Vue.js)
- ✅ **Interface moderne** et responsive
- ✅ **Dashboard** avec statistiques
- ✅ **Gestion des véhicules** et interventions
- ✅ **Workflow complet** : Devis → Autorisation → Facture → Réception
- ✅ **Gestion des pièces jointes**
- ✅ **Recherche et filtres** avancés

### Workflow d'Intervention
```
Intervention → Prédiagnostic → Devis → Autorisation → Facture → Réception
```

## 🛠️ Maintenance Post-Déploiement

### Script de Maintenance

```bash
# Télécharger le script de maintenance
wget https://raw.githubusercontent.com/oumiche/impact-auto-plus/main/scripts/maintenance.sh
chmod +x maintenance.sh

# Commandes disponibles
sudo ./maintenance.sh status      # Statut des services
sudo ./maintenance.sh backup      # Sauvegarde DB
sudo ./maintenance.sh update      # Mise à jour code
sudo ./maintenance.sh health      # Vérification santé
sudo ./maintenance.sh logs        # Afficher les logs
```

### Tâches Cron Automatiques

Le déploiement configure automatiquement :
- **Sauvegarde quotidienne** de la base de données
- **Nettoyage du cache** toutes les heures
- **Renouvellement SSL** automatique (si Let's Encrypt)

## 🔒 Sécurité

### Configuration SSL
- **Let's Encrypt** configuré automatiquement
- **Certificats** renouvelés automatiquement
- **Redirection HTTPS** forcée

### Headers de Sécurité
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`

### Firewall
- **UFW** activé avec règles de base
- **Ports** 22 (SSH), 80 (HTTP), 443 (HTTPS) ouverts

## 📊 Monitoring

### Logs Disponibles
- **Apache :** `/var/log/apache2/impact-auto_*.log`
- **Symfony :** `/var/www/html/impact-auto/api/var/log/prod.log`
- **Système :** `journalctl -u apache2 -f`

### Métriques Système
```bash
# Surveillance en temps réel
sudo ./maintenance.sh monitor

# Vérification santé
sudo ./maintenance.sh health

# Statut des services
sudo ./maintenance.sh status
```

## 🔄 Sauvegardes

### Sauvegarde Automatique
- **Base de données** : Sauvegardée quotidiennement à 2h00
- **Rétention** : 7 jours
- **Emplacement** : `/backup/`

### Sauvegarde Manuelle
```bash
# Créer une sauvegarde
sudo ./maintenance.sh backup

# Restaurer depuis une sauvegarde
sudo ./maintenance.sh restore
```

## 🚨 Dépannage

### Problèmes Courants

1. **Erreur 500 - Internal Server Error**
   ```bash
   sudo ./maintenance.sh logs
   sudo ./maintenance.sh cache
   ```

2. **Problème de Base de Données**
   ```bash
   sudo ./maintenance.sh status
   sudo ./maintenance.sh migrate
   ```

3. **Problème de Permissions**
   ```bash
   sudo chown -R www-data:www-data /var/www/html/impact-auto
   sudo chmod -R 755 /var/www/html/impact-auto
   ```

### Logs et Diagnostic
```bash
# Logs Apache en temps réel
sudo tail -f /var/log/apache2/impact-auto_error.log

# Logs Symfony en temps réel
sudo tail -f /var/www/html/impact-auto/api/var/log/prod.log

# Diagnostic complet
sudo ./maintenance.sh health
```

## 📞 Support

### Vérifications Rapides
1. **Services actifs** : `sudo ./maintenance.sh status`
2. **Santé application** : `sudo ./maintenance.sh health`
3. **Logs récents** : `sudo ./maintenance.sh logs`
4. **Espace disque** : `df -h`
5. **Mémoire** : `free -h`

### Informations Système
- **OS :** Ubuntu Server 24.04 LTS
- **Apache :** 2.4+
- **MySQL :** 8.0+
- **PHP :** 8.2+
- **Composer :** 2.0+

## 🎉 Post-Déploiement

### Première Connexion
1. Ouvrir [https://vps114702.serveur-vps.net/](https://vps114702.serveur-vps.net/)
2. Créer un compte administrateur
3. Configurer les paramètres de base
4. Tester les fonctionnalités principales

### Configuration Initiale
- ✅ **Paramètres système** (devise, TVA, etc.)
- ✅ **Utilisateurs** et rôles
- ✅ **Types de véhicules** et interventions
- ✅ **Configuration des notifications**

## 📚 Documentation

- [Guide de Déploiement Complet](DEPLOIEMENT_UBUNTU.md)
- [Documentation Technique](../README.md)
- [Guide d'Utilisation](../docs/)

---

**🎯 Impact Auto** - Optimisation de Parc Automobile  
**🌐 URL :** [https://vps114702.serveur-vps.net/](https://vps114702.serveur-vps.net/)  
**📧 Support :** [admin@vps114702.serveur-vps.net](mailto:admin@vps114702.serveur-vps.net)
