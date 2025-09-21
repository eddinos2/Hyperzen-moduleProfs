#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:30001';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function auditCompleteSchema() {
  console.log('📋 AUDIT COMPLET DU SCHÉMA BASE DE DONNÉES');
  console.log('==========================================\n');

  try {
    // 1. RÉCUPÉRER TOUTES LES TABLES
    console.log('🗂️ 1. TABLES EXISTANTES');
    console.log('------------------------');

    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT table_name, table_schema 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `
      });

    if (tablesError) {
      console.log(`❌ Erreur récupération tables: ${tablesError.message}`);
    } else {
      console.log('📊 Tables publiques:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }

    console.log('\n');

    // 2. RÉCUPÉRER TOUS LES ENUMS
    console.log('🏷️ 2. TYPES ENUM');
    console.log('-----------------');

    const { data: enums, error: enumsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT t.typname as enum_name, e.enumlabel as enum_value
          FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid  
          WHERE t.typtype = 'e'
          ORDER BY t.typname, e.enumsortorder;
        `
      });

    if (enumsError) {
      console.log(`❌ Erreur récupération enums: ${enumsError.message}`);
    } else {
      const enumGroups = enums.reduce((acc, enumItem) => {
        if (!acc[enumItem.enum_name]) {
          acc[enumItem.enum_name] = [];
        }
        acc[enumItem.enum_name].push(enumItem.enum_value);
        return acc;
      }, {} as any);

      console.log('📊 Types enum:');
      Object.entries(enumGroups).forEach(([enumName, values]) => {
        console.log(`   - ${enumName}: [${values.join(', ')}]`);
      });
    }

    console.log('\n');

    // 3. AUDITER TABLE PROFILES
    console.log('👤 3. STRUCTURE TABLE PROFILES');
    console.log('-------------------------------');

    const { data: profilesStructure, error: profilesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'profiles' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (profilesError) {
      console.log(`❌ Erreur structure profiles: ${profilesError.message}`);
    } else {
      console.log('📊 Colonnes table profiles:');
      profilesStructure.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    console.log('\n');

    // 4. AUDITER TABLE INVOICES
    console.log('📄 4. STRUCTURE TABLE INVOICES');
    console.log('------------------------------');

    const { data: invoicesStructure, error: invoicesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'invoices' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (invoicesError) {
      console.log(`❌ Erreur structure invoices: ${invoicesError.message}`);
    } else {
      console.log('📊 Colonnes table invoices:');
      invoicesStructure.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    console.log('\n');

    // 5. AUDITER TABLE CAMPUS
    console.log('🏢 5. STRUCTURE TABLE CAMPUS');
    console.log('-----------------------------');

    const { data: campusStructure, error: campusError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'campus' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (campusError) {
      console.log(`❌ Erreur structure campus: ${campusError.message}`);
    } else {
      console.log('📊 Colonnes table campus:');
      campusStructure.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    console.log('\n');

    // 6. RÉCUPÉRER LES RPC FUNCTIONS
    console.log('⚙️ 6. RPC FUNCTIONS');
    console.log('--------------------');

    const { data: functions, error: functionsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT routine_name, routine_type
          FROM information_schema.routines 
          WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
          ORDER BY routine_name;
        `
      });

    if (functionsError) {
      console.log(`❌ Erreur récupération fonctions: ${functionsError.message}`);
    } else {
      console.log('📊 Fonctions RPC disponibles:');
      functions.forEach(func => {
        console.log(`   - ${func.routine_name} (${func.routine_type})`);
      });
    }

    console.log('\n');

    // 7. DOCUMENTATION FINALE
    console.log('📚 7. DOCUMENTATION FINALE');
    console.log('---------------------------');

    const schemaDoc = {
      tables: ['profiles', 'invoices', 'invoice_lines', 'campus', 'audit_logs', 'import_professeurs'],
      enums: enumGroups,
      profiles_columns: profilesStructure?.map(col => col.column_name) || [],
      invoices_columns: invoicesStructure?.map(col => col.column_name) || [],
      campus_columns: campusStructure?.map(col => col.column_name) || [],
      rpc_functions: functions?.map(func => func.routine_name) || []
    };

    // Sauvegarder la documentation
    const fs = require('fs');
    fs.writeFileSync('SCHEMA_DOCUMENTATION.json', JSON.stringify(schemaDoc, null, 2));
    console.log('✅ Documentation sauvegardée dans SCHEMA_DOCUMENTATION.json');

    console.log('\n🎉 AUDIT TERMINÉ !');
    console.log('==================');
    console.log('✅ Schéma complet documenté');
    console.log('✅ Prêt pour les corrections de scripts');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

auditCompleteSchema();
