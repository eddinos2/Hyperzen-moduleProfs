import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addAuditColumns() {
  console.log('🔧 Ajout des colonnes d\'audit à invoice_lines...');
  
  try {
    // Vérifier la connexion
    const { error: testError } = await supabase
      .from('invoice_lines')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erreur connexion:', testError.message);
      return;
    }
    
    console.log('✅ Connexion DB OK');
    
    // Ajouter les colonnes une par une
    const columns = [
      { name: 'prevalidated_by', type: 'uuid REFERENCES profiles(id)' },
      { name: 'prevalidated_at', type: 'timestamptz' },
      { name: 'validated_by', type: 'uuid REFERENCES profiles(id)' },
      { name: 'validated_at', type: 'timestamptz' },
      { name: 'paid_by', type: 'uuid REFERENCES profiles(id)' },
      { name: 'paid_at', type: 'timestamptz' },
      { name: 'updated_at', type: 'timestamptz DEFAULT now()' }
    ];
    
    for (const column of columns) {
      console.log(`📝 Ajout de ${column.name}...`);
      
      // Simuler l'ajout (on ne peut pas exécuter ALTER TABLE via Supabase client)
      console.log(`   ✅ ${column.name} (${column.type}) - Simulation`);
    }
    
    console.log('🎉 Colonnes d\'audit ajoutées (simulation)');
    console.log('📋 Pour appliquer réellement, exécutez le SQL dans Supabase Studio');
    
  } catch (err) {
    console.log('❌ Erreur:', err);
  }
}

addAuditColumns();
