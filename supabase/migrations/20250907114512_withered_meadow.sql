/*
  # Création des politiques RLS

  1. Politiques par table
    - `profiles` : Accès selon le rôle et relations campus
    - `campus` : Lecture pour tous, modification pour admins
    - `invoices` : Professeurs voient leurs factures, directeurs leur campus
    - `invoice_lines` : Même logique que les factures
    - `audit_logs` : Lecture pour admins, écriture système
    - `import_professeurs` : Réservé aux super admins

  2. Logique métier
    - ENSEIGNANT : accès à ses propres données
    - DIRECTEUR_CAMPUS : accès aux données de son campus
    - COMPTABLE/SUPER_ADMIN : accès global
*/

-- Policies pour profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE  
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
    )
  );

CREATE POLICY "Campus directors can read their campus teachers"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN campus c ON c.directeur_id = p.id
      WHERE p.id = auth.uid()
      AND p.role = 'DIRECTEUR_CAMPUS'
      AND profiles.campus_id = c.id
    )
  );

-- Policies pour campus
CREATE POLICY "Everyone can read campus"
  ON campus FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage campus"
  ON campus FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
    )
  );

-- Policies pour invoices
CREATE POLICY "Teachers can read own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (enseignant_id = auth.uid());

CREATE POLICY "Teachers can create own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (enseignant_id = auth.uid());

CREATE POLICY "Teachers can update own pending invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (enseignant_id = auth.uid() AND status = 'pending');

CREATE POLICY "Campus directors can read their campus invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN campus c ON c.directeur_id = p.id
      WHERE p.id = auth.uid()
      AND p.role = 'DIRECTEUR_CAMPUS'
      AND invoices.campus_id = c.id
    )
  );

CREATE POLICY "Admins can read all invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
    )
  );

CREATE POLICY "Admins can update all invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
    )
  );

-- Policies pour invoice_lines
CREATE POLICY "Teachers can read own invoice lines"
  ON invoice_lines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_lines.invoice_id
      AND i.enseignant_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create own invoice lines"
  ON invoice_lines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_lines.invoice_id
      AND i.enseignant_id = auth.uid()
      AND i.status = 'pending'
    )
  );

CREATE POLICY "Campus directors can read their campus invoice lines"
  ON invoice_lines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN campus c ON c.directeur_id = p.id
      JOIN invoices i ON i.campus_id = c.id
      WHERE p.id = auth.uid()
      AND p.role = 'DIRECTEUR_CAMPUS'
      AND invoice_lines.invoice_id = i.id
    )
  );

CREATE POLICY "Admins can manage all invoice lines"
  ON invoice_lines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
    )
  );

-- Policies pour audit_logs
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies pour import_professeurs
CREATE POLICY "Super admins can manage professor imports"
  ON import_professeurs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'SUPER_ADMIN'
    )
  );