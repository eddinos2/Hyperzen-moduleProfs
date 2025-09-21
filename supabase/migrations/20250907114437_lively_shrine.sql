/*
  # Création des énumérations de base

  1. Énumérations
    - `app_role` : Rôles des utilisateurs (SUPER_ADMIN, DIRECTEUR_CAMPUS, COMPTABLE, ENSEIGNANT)
    - `invoice_status` : Statuts des factures (pending, prevalidated, validated, paid, rejected)
    - `campus_name` : Noms des campus officiels
    - `audit_action` : Actions d'audit pour la traçabilité

  2. Sécurité
    - Pas de RLS nécessaire pour les enums
*/

-- Énumération des rôles applicatifs
CREATE TYPE app_role AS ENUM (
  'SUPER_ADMIN',
  'DIRECTEUR_CAMPUS', 
  'COMPTABLE',
  'ENSEIGNANT'
);

-- Énumération des statuts de facture
CREATE TYPE invoice_status AS ENUM (
  'pending',
  'prevalidated',
  'validated', 
  'paid',
  'rejected'
);

-- Énumération des campus officiels
CREATE TYPE campus_name AS ENUM (
  'Roquette',
  'Picpus',
  'Sentier', 
  'Douai',
  'Saint-Sébastien',
  'Jaurès',
  'Parmentier',
  'Boulogne'
);

-- Énumération des actions d'audit
CREATE TYPE audit_action AS ENUM (
  'created',
  'updated',
  'prevalidated',
  'validated',
  'paid',
  'rejected',
  'imported'
);