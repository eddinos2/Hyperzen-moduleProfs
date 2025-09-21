import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditDBSchema() {
  console.log('🔍 AUDIT COMPLET DU SCHÉMA DB LOCAL');
  console.log('=====================================\n');

  try {
    // 1. Lister toutes les tables
    console.log('📋 1. TABLES EXISTANTES');
    console.log('----------------------');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (tablesError) {
      console.log('❌ Erreur récupération tables:', tablesError.message);
    } else {
      tables?.forEach(table => {
        console.log(`   📄 ${table.table_name} (${table.table_type})`);
      });
    }

    // 2. Détail des colonnes pour chaque table importante
    const importantTables = ['profiles', 'campus', 'invoices', 'invoice_lines', 'audit_logs'];
    
    for (const tableName of importantTables) {
      console.log(`\n📊 2. COLONNES DE LA TABLE ${tableName.toUpperCase()}`);
      console.log('----------------------------------------');
      
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (columnsError) {
        console.log(`❌ Erreur récupération colonnes ${tableName}:`, columnsError.message);
      } else if (columns && columns.length > 0) {
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`   🔹 ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
        });
      } else {
        console.log(`   ⚠️  Table ${tableName} non trouvée`);
      }
    }

    // 3. Contraintes et index
    console.log('\n🔗 3. CONTRAINTES ET INDEX');
    console.log('---------------------------');
    
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('table_name, constraint_name, constraint_type')
      .eq('table_schema', 'public')
      .in('table_name', importantTables)
      .order('table_name');
    
    if (constraintsError) {
      console.log('❌ Erreur récupération contraintes:', constraintsError.message);
    } else {
      constraints?.forEach(constraint => {
        console.log(`   🔸 ${constraint.table_name}.${constraint.constraint_name} (${constraint.constraint_type})`);
      });
    }

    // 4. Types personnalisés
    console.log('\n🏷️  4. TYPES PERSONNALISÉS');
    console.log('---------------------------');
    
    const { data: types, error: typesError } = await supabase
      .from('information_schema.udt_name')
      .select('udt_name')
      .eq('udt_schema', 'public')
      .order('udt_name');
    
    if (typesError) {
      console.log('❌ Erreur récupération types:', typesError.message);
    } else {
      types?.forEach(type => {
        console.log(`   🏷️  ${type.udt_name}`);
      });
    }

    // 5. Fonctions RPC
    console.log('\n⚙️  5. FONCTIONS RPC');
    console.log('-------------------');
    
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname, proargnames')
      .eq('pronamespace', (await supabase.from('pg_namespace').select('oid').eq('nspname', 'public').single()).data?.oid)
      .order('proname');
    
    if (functionsError) {
      console.log('❌ Erreur récupération fonctions:', functionsError.message);
    } else {
      functions?.forEach(func => {
        const args = func.proargnames ? `(${func.proargnames.join(', ')})` : '()';
        console.log(`   ⚙️  ${func.proname}${args}`);
      });
    }

  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

auditDBSchema();
