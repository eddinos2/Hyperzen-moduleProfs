/*
  # Insertion des données initiales

  1. Campus officiels
    - Insertion des 8 campus Aurlom avec adresses complètes
    
  2. Utilisateur admin initial
    - Profil super admin pour la configuration initiale
    
  3. Données de test
    - Quelques professeurs et directeurs pour les tests
*/

-- Insertion des campus officiels
INSERT INTO campus (name, address) VALUES
('Roquette', '48 rue de la Roquette, 75011 Paris'),
('Picpus', '146 rue de Picpus, 75012 Paris'), 
('Sentier', '43 rue du Sentier, 75002 Paris'),
('Douai', '69 rue de Douai, 75009 Paris'),
('Saint-Sébastien', '45 rue Saint-Sébastien, 75011 Paris'),
('Jaurès', '118 avenue Jean-Jaurès, 75019 Paris'),
('Parmentier', '16 avenue Parmentier, 75011 Paris'),
('Boulogne', '59 rue de Billancourt, 92100 Boulogne');

-- Note: Les profils utilisateurs seront créés via l'interface d'authentification
-- ou l'import CSV pour les professeurs