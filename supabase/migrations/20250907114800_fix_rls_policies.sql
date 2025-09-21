-- ===========================================
-- CORRECTION DES POLITIQUES RLS
-- ===========================================

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Campus directors can read their campus teachers" ON profiles;
DROP POLICY IF EXISTS "Everyone can read campus" ON campus;
DROP POLICY IF EXISTS "Admins can manage campus" ON campus;
DROP POLICY IF EXISTS "Teachers can read own invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can manage all invoices" ON invoices;
DROP POLICY IF EXISTS "Teachers can read own invoice lines" ON invoice_lines;
DROP POLICY IF EXISTS "Admins can manage all invoice lines" ON invoice_lines;
DROP POLICY IF EXISTS "Admins can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can write audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can manage import_professeurs" ON import_professeurs;

-- Recréer les politiques sans récursion
-- Policy simple pour lecture de son propre profil
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy simple pour mise à jour de son propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE  
  TO authenticated
  USING (auth.uid() = id);

-- Policy pour les admins (sans récursion)
CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true);

-- Policy pour campus (lecture pour tous)
CREATE POLICY "Everyone can read campus"
  ON campus FOR SELECT
  TO authenticated
  USING (true);

-- Policy pour gestion des campus (service role uniquement)
CREATE POLICY "Service role can manage campus"
  ON campus FOR ALL
  TO service_role
  USING (true);

-- Policy pour les factures
CREATE POLICY "Service role can manage invoices"
  ON invoices FOR ALL
  TO service_role
  USING (true);

-- Policy pour les lignes de facture
CREATE POLICY "Service role can manage invoice_lines"
  ON invoice_lines FOR ALL
  TO service_role
  USING (true);

-- Policy pour les logs d'audit
CREATE POLICY "Service role can manage audit_logs"
  ON audit_logs FOR ALL
  TO service_role
  USING (true);

-- Policy pour import professeurs
CREATE POLICY "Service role can manage import_professeurs"
  ON import_professeurs FOR ALL
  TO service_role
  USING (true);
