import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseAdminKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

async function applyRLSFixes() {
  console.log('🔧 Application des corrections RLS');
  console.log('==================================\n');

  try {
    // 1. Supprimer les anciennes politiques
    console.log('1️⃣ Suppression des anciennes politiques...');
    
    const policiesToDrop = [
      'DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;',
      'DROP POLICY IF EXISTS "Teachers can view own invoices" ON public.invoices;',
      'DROP POLICY IF EXISTS "Teachers can insert own invoices" ON public.invoices;',
      'DROP POLICY IF EXISTS "Teachers can update own invoices" ON public.invoices;',
      'DROP POLICY IF EXISTS "Users can view own invoice lines" ON public.invoice_lines;',
      'DROP POLICY IF EXISTS "Teachers can view own invoice lines" ON public.invoice_lines;'
    ];

    for (const policy of policiesToDrop) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy });
      if (error) {
        console.log(`   ⚠️  ${policy}: ${error.message}`);
      } else {
        console.log(`   ✅ ${policy}`);
      }
    }

    // 2. Créer les nouvelles politiques pour les factures
    console.log('\n2️⃣ Création des nouvelles politiques pour les factures...');
    
    const invoicePolicies = [
      `CREATE POLICY "Teachers can view own invoices"
       ON public.invoices FOR SELECT
       TO authenticated
       USING (auth.uid() = enseignant_id);`,

      `CREATE POLICY "Teachers can insert own invoices"
       ON public.invoices FOR INSERT
       TO authenticated
       WITH CHECK (auth.uid() = enseignant_id);`,

      `CREATE POLICY "Teachers can update own invoices"
       ON public.invoices FOR UPDATE
       TO authenticated
       USING (auth.uid() = enseignant_id)
       WITH CHECK (auth.uid() = enseignant_id);`,

      `CREATE POLICY "Directors can view campus invoices"
       ON public.invoices FOR SELECT
       TO authenticated
       USING (
         EXISTS (
           SELECT 1 FROM profiles p 
           WHERE p.id = auth.uid() 
           AND p.role = 'DIRECTEUR_CAMPUS'
           AND p.campus_id = invoices.campus_id
         )
       );`,

      `CREATE POLICY "Admins can view all invoices"
       ON public.invoices FOR SELECT
       TO authenticated
       USING (
         EXISTS (
           SELECT 1 FROM profiles p 
           WHERE p.id = auth.uid() 
           AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
         )
       );`,

      `CREATE POLICY "Admins can insert invoices"
       ON public.invoices FOR INSERT
       TO authenticated
       WITH CHECK (
         EXISTS (
           SELECT 1 FROM profiles p 
           WHERE p.id = auth.uid() 
           AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
         )
       );`,

      `CREATE POLICY "Admins can update invoices"
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
       );`
    ];

    for (const policy of invoicePolicies) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy });
      if (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      } else {
        console.log(`   ✅ Politique créée`);
      }
    }

    // 3. Créer les politiques pour les lignes de facture
    console.log('\n3️⃣ Création des politiques pour les lignes de facture...');
    
    const invoiceLinesPolicies = [
      `CREATE POLICY "Teachers can view own invoice lines"
       ON public.invoice_lines FOR SELECT
       TO authenticated
       USING (
         EXISTS (
           SELECT 1 FROM invoices i 
           WHERE i.id = invoice_lines.invoice_id 
           AND i.enseignant_id = auth.uid()
         )
       );`,

      `CREATE POLICY "Directors can view campus invoice lines"
       ON public.invoice_lines FOR SELECT
       TO authenticated
       USING (
         EXISTS (
           SELECT 1 FROM profiles p 
           WHERE p.id = auth.uid() 
           AND p.role = 'DIRECTEUR_CAMPUS'
           AND p.campus_id = invoice_lines.campus_id
         )
       );`,

      `CREATE POLICY "Admins can view all invoice lines"
       ON public.invoice_lines FOR SELECT
       TO authenticated
       USING (
         EXISTS (
           SELECT 1 FROM profiles p 
           WHERE p.id = auth.uid() 
           AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
         )
       );`
    ];

    for (const policy of invoiceLinesPolicies) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy });
      if (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      } else {
        console.log(`   ✅ Politique créée`);
      }
    }

    console.log('\n✅ Corrections RLS appliquées !');
    console.log('Les professeurs peuvent maintenant voir leurs propres factures.');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

applyRLSFixes();
