-- Corriger les assignations des directeurs aux campus

-- Mettre à jour chaque campus avec le bon directeur
UPDATE campus SET directeur_id = '87638c49-0358-4f25-bc7a-d8a0b0694052' WHERE name = 'Roquette';
UPDATE campus SET directeur_id = 'd904d36c-9f7f-49dd-889f-9f07a1e2c112' WHERE name = 'Picpus';
UPDATE campus SET directeur_id = '00e5aa22-0e34-4ae3-a353-3e3e74146232' WHERE name = 'Sentier';
UPDATE campus SET directeur_id = '6b29003e-3a03-4362-a441-052c8904f93c' WHERE name = 'Douai';
UPDATE campus SET directeur_id = '25b02685-3313-4c5b-a10d-1192155e5395' WHERE name = 'Saint-Sébastien';
UPDATE campus SET directeur_id = '93b9cbcf-0c6b-4e03-9f35-0358577be1b3' WHERE name = 'Jaurès';
UPDATE campus SET directeur_id = 'a4d940f9-b65a-406c-aee2-5f3e72105ad5' WHERE name = 'Parmentier';
UPDATE campus SET directeur_id = '279b8d32-177f-4a29-b14b-36d464f23e65' WHERE name = 'Boulogne';

-- Vérifier les assignations
SELECT c.name as campus_name, p.first_name, p.last_name, p.email 
FROM campus c 
JOIN profiles p ON c.directeur_id = p.id 
ORDER BY c.name;
