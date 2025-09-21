-- Corriger la logique : les directeurs ne peuvent prévalider que les lignes de leur campus

-- 1. D'abord, vérifier la relation entre campus et directeurs
-- Les campus doivent avoir un champ directeur_id qui pointe vers le profil du directeur

-- 2. Vérifier si la table campus a bien un champ directeur_id
-- Si ce n'est pas le cas, l'ajouter
ALTER TABLE campus 
ADD COLUMN IF NOT EXISTS directeur_id uuid REFERENCES profiles(id);

-- 3. Mettre à jour les campus avec leurs directeurs
UPDATE campus SET directeur_id = (
  SELECT id FROM profiles 
  WHERE role = 'DIRECTEUR_CAMPUS' 
  AND campus_id = campus.id
  LIMIT 1
) WHERE directeur_id IS NULL;

-- 4. Corriger les politiques RLS pour les directeurs
-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Campus directors can update their campus invoice lines" ON invoice_lines;

-- Créer la nouvelle politique avec la logique correcte
CREATE POLICY "Campus directors can update their campus invoice lines" 
ON invoice_lines 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p 
    JOIN campus c ON c.directeur_id = p.id
    WHERE p.id = auth.uid() 
    AND p.role = 'DIRECTEUR_CAMPUS'
    AND invoice_lines.campus_id = c.id
  )
);

-- 5. Ajouter une politique similaire pour la lecture
DROP POLICY IF EXISTS "Campus directors can read their campus invoice lines" ON invoice_lines;

CREATE POLICY "Campus directors can read their campus invoice lines" 
ON invoice_lines 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p 
    JOIN campus c ON c.directeur_id = p.id
    WHERE p.id = auth.uid() 
    AND p.role = 'DIRECTEUR_CAMPUS'
    AND invoice_lines.campus_id = c.id
  )
);
