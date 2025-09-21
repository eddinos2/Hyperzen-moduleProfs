# 📋 TODOLIST - Module de Gestion des Factures Professeurs Aurlom

## 🔴 CRITIQUES - À développer en priorité

### 1. Pages manquantes essentielles
- [ ] **Page Prévalidation** (`/prevalidation`) - Pour directeurs de campus
- [ ] **Page Validation** (`/validation`) - Pour super admin/comptable  
- [ ] **Page Paiements** (`/payments`) - Pour enregistrer les paiements
- [ ] **Page Détail Facture** - Voir le détail d'une facture avec toutes ses lignes
- [ ] **Page Gestion Professeurs** (`/professors`) - Import/gestion des professeurs
- [ ] **Page Gestion Campus** (`/campus`) - Administration des campus

### 2. Fonctionnalités critiques manquantes
- [ ] **Fonctions RPC Supabase** - Prévalidation, validation, paiement
- [ ] **Génération PDF** - Export des factures en PDF
- [ ] **Import professeurs CSV** - Système d'import des professeurs
- [ ] **Système de notifications** - Alertes pour les changements de statut
- [ ] **Audit trail** - Historique des actions sur les factures

## 🟡 IMPORTANTES - Fonctionnalités métier

### 3. Workflow de validation
- [ ] **Prévalidation par directeur** - Interface pour prévalider les factures
- [ ] **Validation comptable** - Interface pour valider les factures prévalidées
- [ ] **Enregistrement paiements** - Marquer les factures comme payées
- [ ] **Système de rejet** - Rejeter une facture avec commentaire

### 4. Gestion des utilisateurs
- [ ] **Création comptes professeurs** - Depuis l'import CSV
- [ ] **Assignation campus** - Lier professeurs aux campus
- [ ] **Gestion des rôles** - Interface pour changer les rôles
- [ ] **Réinitialisation mots de passe** - Système de reset

### 5. Reporting et statistiques
- [ ] **Dashboard avancé** - Statistiques détaillées par rôle
- [ ] **Rapports mensuels** - Export des données par mois
- [ ] **Suivi des paiements** - État des paiements par campus/professeur
- [ ] **Graphiques** - Visualisation des données

## 🟢 AMÉLIORATIONS - Nice to have

### 6. UX/UI
- [ ] **Mode sombre** - Thème sombre pour l'interface
- [ ] **Responsive mobile** - Optimisation mobile complète
- [ ] **Animations** - Micro-interactions et transitions
- [ ] **Accessibilité** - Support ARIA et navigation clavier

### 7. Fonctionnalités avancées
- [ ] **Recherche avancée** - Filtres multiples sur les factures
- [ ] **Export Excel** - Export des données en Excel
- [ ] **Notifications email** - Alertes par email
- [ ] **API REST** - API pour intégrations externes

### 8. Sécurité et performance
- [ ] **Rate limiting** - Limitation des requêtes
- [ ] **Logs détaillés** - Logging complet des actions
- [ ] **Cache** - Mise en cache des données fréquentes
- [ ] **Backup automatique** - Sauvegarde des données

## 🔧 TECHNIQUE - Infrastructure

### 9. Base de données
- [ ] **Fonctions RPC manquantes** - prevalidate_invoice, validate_invoice, mark_invoice_paid
- [ ] **Triggers audit** - Enregistrement automatique des changements
- [ ] **Indexes optimisation** - Performance des requêtes
- [ ] **Contraintes métier** - Validation au niveau DB

### 10. Déploiement
- [ ] **CI/CD Pipeline** - Déploiement automatique
- [ ] **Environnements** - Dev, staging, production
- [ ] **Monitoring** - Surveillance de l'application
- [ ] **Documentation** - Guide utilisateur et technique

---

## 📊 PRIORITÉS PAR RÔLE

### Pour les ENSEIGNANTS (Priorité 1)
1. ✅ Import CSV factures
2. ✅ Liste des factures
3. [ ] Détail facture avec lignes
4. [ ] Génération PDF
5. [ ] Notifications de changement de statut

### Pour les DIRECTEURS_CAMPUS (Priorité 2)
1. [ ] Page prévalidation
2. [ ] Interface de prévalidation des factures
3. [ ] Dashboard campus
4. [ ] Rapports par professeur

### Pour les COMPTABLES/SUPER_ADMIN (Priorité 3)
1. [ ] Page validation
2. [ ] Page paiements
3. [ ] Gestion professeurs
4. [ ] Rapports globaux
5. [ ] Audit trail

---

## 🎯 ROADMAP SUGGÉRÉE

### Phase 1 (2-3 semaines) - MVP Fonctionnel
- [ ] Fonctions RPC Supabase
- [ ] Pages prévalidation/validation/paiements
- [ ] Détail facture
- [ ] Génération PDF basique

### Phase 2 (2-3 semaines) - Gestion utilisateurs
- [ ] Import professeurs
- [ ] Gestion campus
- [ ] Système de notifications
- [ ] Dashboard avancé

### Phase 3 (2-3 semaines) - Finitions
- [ ] Rapports et exports
- [ ] UX/UI améliorée
- [ ] Tests et optimisations
- [ ] Documentation

---

**Total estimé : 6-9 semaines de développement**