#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createMassiveTestData() {
  console.log('📊 CRÉATION DE DONNÉES DE TEST MASSIVES');
  console.log('======================================');
  
  try {
    // 1. Connexion Super Admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'houssam@aurlom.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.log('❌ Erreur connexion super admin:', authError.message);
      return;
    }
    
    console.log('✅ Super admin connecté:', authData.user?.email);
    
    // 2. Récupérer tous les campus
    const { data: campuses, error: campusesError } = await supabase
      .from('campus')
      .select('id, name')
      .order('name');
    
    if (campusesError) {
      console.log('❌ Erreur récupération campus:', campusesError.message);
      return;
    }
    
    console.log(`\n🏢 ${campuses.length} campus récupérés:`);
    campuses.forEach((campus, index) => {
      console.log(`   ${index + 1}. ${campus.name} (${campus.id})`);
    });
    
    // 3. Récupérer tous les professeurs
    const { data: professors, error: professorsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, campus_id')
      .eq('role', 'ENSEIGNANT')
      .order('campus_id');
    
    if (professorsError) {
      console.log('❌ Erreur récupération professeurs:', professorsError.message);
      return;
    }
    
    console.log(`\n👨‍🏫 ${professors.length} professeurs récupérés`);
    
    // 4. Créer des factures pour chaque professeur
    console.log('\n📋 CRÉATION DE FACTURES POUR CHAQUE PROFESSEUR');
    console.log('==============================================');
    
    const courses = [
      'Mathématiques', 'Français', 'Anglais', 'Informatique', 'Économie',
      'Droit', 'Communication', 'Gestion', 'Marketing', 'Comptabilité',
      'Physique', 'Chimie', 'Histoire', 'Géographie', 'Philosophie'
    ];
    
    const filieres = ['BTS ESF', 'BTS MUC', 'BTS GPME', 'BTS CGO', 'BTS SIO'];
    const classes = ['1ère année', '2ème année', 'Terminale'];
    
    let totalInvoices = 0;
    let totalLines = 0;
    
    for (const professor of professors) {
      console.log(`\n👨‍🏫 Professeur: ${professor.first_name} ${professor.last_name} (Campus: ${professor.campus_id})`);
      
      // Créer 3 factures par professeur (3 derniers mois)
      for (let month = 9; month <= 11; month++) {
        const year = 2024;
        const monthYear = `${year}-${month.toString().padStart(2, '0')}`;
        
        // Vérifier si la facture existe déjà
        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('enseignant_id', professor.id)
          .eq('month_year', monthYear)
          .single();
        
        if (existingInvoice) {
          console.log(`   ℹ️ Facture ${monthYear} existe déjà`);
          continue;
        }
        
        // Créer la facture
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            enseignant_id: professor.id,
            campus_id: professor.campus_id,
            month_year: monthYear,
            total_amount: 0, // Sera calculé
            status: 'pending'
          })
          .select()
          .single();
        
        if (invoiceError) {
          console.log(`   ❌ Erreur création facture ${monthYear}:`, invoiceError.message);
          continue;
        }
        
        console.log(`   ✅ Facture ${monthYear} créée (${newInvoice.id})`);
        totalInvoices++;
        
        // Créer 5-8 lignes de facture par mois
        const nbLines = Math.floor(Math.random() * 4) + 5; // 5 à 8 lignes
        let invoiceTotal = 0;
        
        for (let i = 0; i < nbLines; i++) {
          const course = courses[Math.floor(Math.random() * courses.length)];
          const filiere = filieres[Math.floor(Math.random() * filieres.length)];
          const classe = classes[Math.floor(Math.random() * classes.length)];
          const quantiteHeures = 2;
          const prixUnitaire = Math.floor(Math.random() * 20) + 25; // 25€ à 45€
          const totalTtc = quantiteHeures * prixUnitaire;
          
          // Date aléatoire dans le mois
          const day = Math.floor(Math.random() * 28) + 1;
          const dateCours = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          
          // Heures aléatoires
          const startHour = Math.floor(Math.random() * 8) + 8; // 8h à 15h
          const heureDebut = `${startHour.toString().padStart(2, '0')}:00:00`;
          const heureFin = `${(startHour + 2).toString().padStart(2, '0')}:00:00`;
          
          const { error: lineError } = await supabase
            .from('invoice_lines')
            .insert({
              invoice_id: newInvoice.id,
              date_cours: dateCours,
              heure_debut: heureDebut,
              heure_fin: heureFin,
              campus: professor.campus_id, // Utiliser l'ancienne colonne pour compatibilité
              campus_id: professor.campus_id, // Nouvelle colonne
              filiere,
              classe,
              intitule: course,
              retard: Math.random() < 0.1, // 10% de retard
              quantite_heures: quantiteHeures,
              prix_unitaire: prixUnitaire,
              total_ttc: totalTtc,
              status: 'pending',
              submitted_by: professor.id
            });
          
          if (lineError) {
            console.log(`     ❌ Erreur création ligne ${i + 1}:`, lineError.message);
          } else {
            totalLines++;
            invoiceTotal += totalTtc;
          }
        }
        
        // Mettre à jour le total de la facture
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ total_amount: invoiceTotal })
          .eq('id', newInvoice.id);
        
        if (updateError) {
          console.log(`   ⚠️ Erreur mise à jour total facture:`, updateError.message);
        }
        
        console.log(`   📊 ${nbLines} lignes créées - Total: ${invoiceTotal}€`);
      }
    }
    
    // 5. Statistiques finales
    console.log('\n📈 STATISTIQUES FINALES');
    console.log('========================');
    
    console.log(`✅ Données créées:`);
    console.log(`   - ${totalInvoices} nouvelles factures`);
    console.log(`   - ${totalLines} nouvelles lignes de facture`);
    console.log(`   - Réparties sur ${campuses.length} campus`);
    console.log(`   - Réparties sur ${professors.length} professeurs`);
    
    // 6. Vérification par campus
    console.log('\n🏢 RÉPARTITION PAR CAMPUS:');
    
    for (const campus of campuses) {
      const { data: campusLines, error: campusError } = await supabase
        .from('invoice_lines')
        .select('id, total_ttc')
        .eq('campus_id', campus.id);
      
      if (campusError) {
        console.log(`   ❌ Erreur campus ${campus.name}:`, campusError.message);
      } else {
        const totalAmount = campusLines.reduce((sum, line) => sum + parseFloat(line.total_ttc), 0);
        console.log(`   📊 ${campus.name}: ${campusLines.length} lignes - ${totalAmount.toFixed(2)}€`);
      }
    }
    
    console.log('\n🎉 DONNÉES DE TEST MASSIVES CRÉÉES AVEC SUCCÈS !');
    console.log('=================================================');
    console.log('✅ Prêt pour les tests à grande échelle');
    console.log('✅ Tous les campus ont des données');
    console.log('✅ Tous les professeurs ont des factures');
    console.log('✅ Prêt pour tester la logique des directeurs');
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

createMassiveTestData();
