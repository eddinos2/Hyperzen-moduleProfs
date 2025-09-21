import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyTestFunctions() {
  console.log('🔧 Application des fonctions RPC de test...');
  
  try {
    // Lire le fichier de migration
    const sql = fs.readFileSync('supabase/migrations/20250115000000_test_rpc_functions.sql', 'utf8');
    
    // Diviser le SQL en instructions individuelles
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📝 Exécution: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec', { sql: statement.trim() });
        
        if (error) {
          console.log(`❌ Erreur: ${error.message}`);
        } else {
          console.log(`✅ Succès`);
        }
      }
    }
    
    console.log('🎉 Fonctions RPC de test appliquées');
  } catch (err) {
    console.log('❌ Erreur:', err);
  }
}

applyTestFunctions();
