import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditDatabaseComplete() {
  console.log('🔍 AUDIT COMPLET DE LA BASE DE DONNÉES');
  console.log('======================================\n');

  try {
    // 1. Vérifier la connexion
    console.log('📋 1. VÉRIFICATION CONNEXION');
    console.log('----------------------------');
    console.log('🔗 URL Supabase:', process.env.VITE_SUPABASE_URL);
    console.log('🔑 Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

    // 2. Lister tous les schémas
    console.log('\n📋 2. SCHÉMAS DISPONIBLES');
    console.log('-------------------------');
    
    const { data: schemas, error: schemasError } = await supabase
      .rpc('get_schemas');
    
    if (schemasError) {
      console.log('❌ Erreur schémas:', schemasError.message);
    } else {
      console.log('✅ Schémas trouvés:', schemas);
    }

    // 3. Lister toutes les tables
    console.log('\n📋 3. TABLES DISPONIBLES');
    console.log('------------------------');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (tablesError) {
      console.log('❌ Erreur tables:', tablesError.message);
    } else {
      console.log(`✅ Tables trouvées: ${tables?.length || 0}`);
      tables?.forEach(table => {
        console.log(`   📄 ${table.table_schema}.${table.table_name} (${table.table_type})`);
      });
    }

    // 4. Détail des colonnes pour chaque table
    console.log('\n📋 4. DÉTAIL DES COLONNES');
    console.log('-------------------------');
    
    const tableNames = ['profiles', 'campus', 'invoices', 'invoice_lines', 'audit_logs'];
    
    for (const tableName of tableNames) {
      console.log(`\n🔍 Table: ${tableName}`);
      console.log('-'.repeat(30));
      
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (columnsError) {
        console.log(`❌ Erreur colonnes ${tableName}:`, columnsError.message);
      } else if (columns && columns.length > 0) {
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          console.log(`   📝 ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
        });
      } else {
        console.log(`   ⚠️  Table ${tableName} non trouvée ou vide`);
      }
    }

    // 5. Contraintes de clés étrangères
    console.log('\n📋 5. CONTRAINTES DE CLÉS ÉTRANGÈRES');
    console.log('------------------------------------');
    
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        table_name,
        constraint_type,
        is_deferrable,
        initially_deferred
      `)
      .eq('table_schema', 'public')
      .eq('constraint_type', 'FOREIGN KEY')
      .order('table_name');
    
    if (constraintsError) {
      console.log('❌ Erreur contraintes:', constraintsError.message);
    } else {
      console.log(`✅ Contraintes FK trouvées: ${constraints?.length || 0}`);
      constraints?.forEach(constraint => {
        console.log(`   🔗 ${constraint.table_name}.${constraint.constraint_name} (${constraint.constraint_type})`);
      });
    }

    // 6. Détail des relations FK
    console.log('\n📋 6. DÉTAIL DES RELATIONS FK');
    console.log('-----------------------------');
    
    const { data: fkDetails, error: fkError } = await supabase
      .from('information_schema.key_column_usage')
      .select(`
        table_name,
        column_name,
        constraint_name,
        referenced_table_name,
        referenced_column_name
      `)
      .eq('table_schema', 'public')
      .not('referenced_table_name', 'is', null)
      .order('table_name');
    
    if (fkError) {
      console.log('❌ Erreur détails FK:', fkError.message);
    } else {
      console.log(`✅ Relations FK détaillées: ${fkDetails?.length || 0}`);
      fkDetails?.forEach(fk => {
        console.log(`   🔗 ${fk.table_name}.${fk.column_name} → ${fk.referenced_table_name}.${fk.referenced_column_name}`);
      });
    }

    // 7. Types personnalisés (ENUMs)
    console.log('\n📋 7. TYPES PERSONNALISÉS (ENUMs)');
    console.log('---------------------------------');
    
    const { data: types, error: typesError } = await supabase
      .from('pg_type')
      .select('typname, typtype, enumlabel')
      .eq('typtype', 'e')
      .order('typname');
    
    if (typesError) {
      console.log('❌ Erreur types:', typesError.message);
    } else {
      console.log(`✅ Types ENUM trouvés: ${types?.length || 0}`);
      const enumGroups = types?.reduce((acc, type) => {
        if (!acc[type.typname]) {
          acc[type.typname] = [];
        }
        if (type.enumlabel) {
          acc[type.typname].push(type.enumlabel);
        }
        return acc;
      }, {} as Record<string, string[]>);
      
      Object.entries(enumGroups || {}).forEach(([name, values]) => {
        console.log(`   📝 ${name}: [${values.join(', ')}]`);
      });
    }

    // 8. Données existantes
    console.log('\n📋 8. DONNÉES EXISTANTES');
    console.log('------------------------');
    
    for (const tableName of tableNames) {
      const { data: count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`❌ Erreur count ${tableName}:`, countError.message);
      } else {
        console.log(`   📊 ${tableName}: ${count?.length || 0} enregistrements`);
      }
    }

    // 9. Test des requêtes de base
    console.log('\n📋 9. TEST DES REQUÊTES DE BASE');
    console.log('-------------------------------');
    
    // Test profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);
    
    if (profilesError) {
      console.log('❌ Erreur profiles:', profilesError.message);
    } else {
      console.log(`✅ Profiles: ${profiles?.length || 0} trouvés`);
      profiles?.forEach(profile => {
        console.log(`   👤 ${profile.email} - ${profile.first_name} ${profile.last_name} (${profile.role})`);
      });
    }

    // Test campus
    const { data: campuses, error: campusError } = await supabase
      .from('campus')
      .select('*')
      .limit(3);
    
    if (campusError) {
      console.log('❌ Erreur campus:', campusError.message);
    } else {
      console.log(`✅ Campus: ${campuses?.length || 0} trouvés`);
      campuses?.forEach(campus => {
        console.log(`   🏢 ${campus.name} - ${campus.address}`);
      });
    }

    // 10. Test des relations
    console.log('\n📋 10. TEST DES RELATIONS');
    console.log('-------------------------');
    
    const { data: profilesWithCampus, error: relationError } = await supabase
      .from('profiles')
      .select(`
        *,
        campus:campus_id(name, address)
      `)
      .limit(3);
    
    if (relationError) {
      console.log('❌ Erreur relation profiles-campus:', relationError.message);
    } else {
      console.log(`✅ Relations profiles-campus: ${profilesWithCampus?.length || 0} testées`);
      profilesWithCampus?.forEach(profile => {
        const campusName = profile.campus?.name || 'Aucun';
        console.log(`   👤 ${profile.email} → 🏢 ${campusName}`);
      });
    }

    console.log('\n🎯 RÉSUMÉ DE L\'AUDIT');
    console.log('=====================');
    console.log('✅ Audit terminé avec succès');
    console.log('💡 Vérifiez les résultats ci-dessus pour identifier les problèmes');

  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

auditDatabaseComplete();
