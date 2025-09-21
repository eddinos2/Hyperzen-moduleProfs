-- Correction des politiques RLS pour les professeurs
-- Les professeurs doivent pouvoir voir leurs propres factures

-- Supprimer les anciennes politiques pour les factures
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Teachers can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Teachers can insert own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Teachers can update own invoices" ON public.invoices;

-- Créer les nouvelles politiques pour les professeurs
CREATE POLICY "Teachers can view own invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (
  auth.uid() = enseignant_id
);

CREATE POLICY "Teachers can insert own invoices"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = enseignant_id
);

CREATE POLICY "Teachers can update own invoices"
ON public.invoices FOR UPDATE
TO authenticated
USING (
  auth.uid() = enseignant_id
)
WITH CHECK (
  auth.uid() = enseignant_id
);

-- Politiques pour les directeurs de campus
CREATE POLICY "Directors can view campus invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'DIRECTEUR_CAMPUS'
    AND p.campus_id = invoices.campus_id
  )
);

-- Politiques pour les admins et comptables
CREATE POLICY "Admins can view all invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
  )
);

CREATE POLICY "Admins can insert invoices"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
  )
);

CREATE POLICY "Admins can update invoices"
ON public.invoices FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
  )
);

-- Politiques pour les lignes de facture
DROP POLICY IF EXISTS "Users can view own invoice lines" ON public.invoice_lines;
DROP POLICY IF EXISTS "Teachers can view own invoice lines" ON public.invoice_lines;

CREATE POLICY "Teachers can view own invoice lines"
ON public.invoice_lines FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invoices i 
    WHERE i.id = invoice_lines.invoice_id 
    AND i.enseignant_id = auth.uid()
  )
);

CREATE POLICY "Directors can view campus invoice lines"
ON public.invoice_lines FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'DIRECTEUR_CAMPUS'
    AND p.campus_id = invoice_lines.campus_id
  )
);

CREATE POLICY "Admins can view all invoice lines"
ON public.invoice_lines FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
  )
);
