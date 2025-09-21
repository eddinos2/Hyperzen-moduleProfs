-- Corriger les assignations des directeurs aux campus par ID

-- Mettre à jour chaque campus avec le bon directeur
UPDATE campus SET directeur_id = '87638c49-0358-4f25-bc7a-d8a0b0694052' WHERE id = '0f65143e-6f1a-4824-b5bc-465213219360'; -- Roquette
UPDATE campus SET directeur_id = 'd904d36c-9f7f-49dd-889f-9f07a1e2c112' WHERE id = '5d4422f4-0eb0-43f0-8051-0bde6de43398'; -- Picpus
UPDATE campus SET directeur_id = '00e5aa22-0e34-4ae3-a353-3e3e74146232' WHERE id = 'c0f0bc7b-19d5-4f73-b986-9fd1e7ea120c'; -- Sentier
UPDATE campus SET directeur_id = '6b29003e-3a03-4362-a441-052c8904f93c' WHERE id = '2fbfaff1-3f6c-4ffe-8137-863545be000f'; -- Douai
UPDATE campus SET directeur_id = '25b02685-3313-4c5b-a10d-1192155e5395' WHERE id = '3d3e4453-e980-488f-8b3b-1844c4e172bf'; -- Saint-Sébastien
UPDATE campus SET directeur_id = '93b9cbcf-0c6b-4e03-9f35-0358577be1b3' WHERE id = '3c9ef881-6f2f-49ff-a87a-fb05594a56e4'; -- Jaurès
UPDATE campus SET directeur_id = 'a4d940f9-b65a-406c-aee2-5f3e72105ad5' WHERE id = '1642e4c1-218c-4b88-8646-bc729096cd66'; -- Parmentier
UPDATE campus SET directeur_id = '279b8d32-177f-4a29-b14b-36d464f23e65' WHERE id = 'c828c921-68fd-42eb-9d85-dfb5ffa4e618'; -- Boulogne

-- Vérifier les assignations
SELECT c.name as campus_name, p.first_name, p.last_name, p.email 
FROM campus c 
JOIN profiles p ON c.directeur_id = p.id 
ORDER BY c.name;
