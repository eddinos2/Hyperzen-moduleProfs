#!/usr/bin/env npx tsx

/**
 * Création d'un système de test complet - VERSION CORRIGÉE
 * Utilise la fonction RPC create_user_profile pour créer les utilisateurs auth + profils
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Données de test
const campusNames = ['Roquette', 'Picpus', 'Sentier', 'Douai', 'Saint-Sébastien', 'Jaurès', 'Parmentier', 'Boulogne'];
const filieres = ['BTS MUC', 'BTS NRC', 'BTS GPME', 'BTS CG', 'BTS SIO', 'BTS ESF'];
const classes = ['1ère année', '2ème année', 'Terminale'];
const matieres = ['Mathématiques', 'Français', 'Anglais', 'Économie', 'Droit', 'Informatique', 'Communication'];

interface Campus {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  campus_id?: string;
}

async function createCompleteTestSystemFixed() {
  console.log('🚀 CRÉATION SYSTÈME DE TEST COMPLET - VERSION CORRIGÉE');
  console.log('=====================================================\n');

  try {
    // 1. Récupérer les campus existants
    console.log('📋 1. RÉCUPÉRATION DES CAMPUS');
    console.log('-----------------------------');
    
    const { data: campuses, error: campusesError } = await supabase
      .from('campus')
      .select('id, name');
    
    if (campusesError) {
      console.log('❌ Erreur récupération campus:', campusesError.message);
      return;
    }
    
    console.log(`✅ ${campuses.length} campus récupérés`);

    // 2. Créer les directeurs (1 par campus) via auth.admin.createUser
    console.log('\n📋 2. CRÉATION DES DIRECTEURS');
    console.log('-----------------------------');
    
    const directors: Profile[] = [];
    
    for (let i = 0; i < campuses.length; i++) {
      const campus = campuses[i];
      const directorEmail = `directeur.${campus.name.toLowerCase().replace('é', 'e').replace('è', 'e')}@aurlom.com`;
      const directorPassword = `directeur${i + 1}123`;
      
      try {
        // Créer l'utilisateur auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: directorEmail,
          password: directorPassword,
          email_confirm: true
        });
        
        if (authError) {
          console.log(`❌ Erreur auth directeur ${campus.name}:`, authError.message);
          continue;
        }
        
        // Créer le profil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user.id,
            email: directorEmail,
            first_name: `Directeur`,
            last_name: `${campus.name}`,
            role: 'DIRECTEUR_CAMPUS',
            campus_id: campus.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.log(`❌ Erreur profil directeur ${campus.name}:`, profileError.message);
        } else {
          console.log(`✅ Directeur ${campus.name}: ${directorEmail} / ${directorPassword}`);
          
          // Assigner le directeur au campus
          await supabase
            .from('campus')
            .update({ directeur_id: authUser.user.id })
            .eq('id', campus.id);
          
          directors.push({
            id: authUser.user.id,
            email: directorEmail,
            first_name: `Directeur`,
            last_name: `${campus.name}`,
            role: 'DIRECTEUR_CAMPUS',
            campus_id: campus.id
          });
        }
      } catch (error) {
        console.log(`❌ Erreur création directeur ${campus.name}:`, error);
      }
    }

    // 3. Créer 20 professeurs
    console.log('\n📋 3. CRÉATION DES PROFESSEURS');
    console.log('------------------------------');
    
    const teachers: Profile[] = [];
    const teacherNames = [
      'Martin', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Garcia',
      'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André',
      'Lefebvre', 'Mercier', 'Garcia', 'Petit'
    ];
    
    for (let i = 0; i < 20; i++) {
      const teacherName = teacherNames[i];
      const campus = campuses[i % campuses.length];
      const teacherEmail = `prof.${teacherName.toLowerCase()}${i + 1}@aurlom.com`;
      const teacherPassword = `prof${i + 1}123`;
      
      try {
        // Créer l'utilisateur auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: teacherEmail,
          password: teacherPassword,
          email_confirm: true
        });
        
        if (authError) {
          console.log(`❌ Erreur auth professeur ${teacherName}:`, authError.message);
          continue;
        }
        
        // Créer le profil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user.id,
            email: teacherEmail,
            first_name: `Professeur`,
            last_name: teacherName,
            role: 'ENSEIGNANT',
            campus_id: campus.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.log(`❌ Erreur profil professeur ${teacherName}:`, profileError.message);
        } else {
          console.log(`✅ Professeur ${teacherName}: ${teacherEmail} / ${teacherPassword} (${campus.name})`);
          
          teachers.push({
            id: authUser.user.id,
            email: teacherEmail,
            first_name: `Professeur`,
            last_name: teacherName,
            role: 'ENSEIGNANT',
            campus_id: campus.id
          });
        }
      } catch (error) {
        console.log(`❌ Erreur création professeur ${teacherName}:`, error);
      }
    }

    // 4. Créer des factures fictives pour chaque professeur
    console.log('\n📋 4. CRÉATION DES FACTURES');
    console.log('----------------------------');
    
    const months = ['2024-09', '2024-10', '2024-11'];
    const invoices: any[] = [];
    
    for (const teacher of teachers) {
      for (const month of months) {
        const invoiceId = crypto.randomUUID();
        
        // Créer la facture
        const { error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            id: invoiceId,
            enseignant_id: teacher.id,
            campus_id: teacher.campus_id,
            month_year: month,
            status: 'pending',
            total_amount: 0, // Sera calculé avec les lignes
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (invoiceError) {
          console.log(`❌ Erreur facture ${teacher.last_name} ${month}:`, invoiceError.message);
        } else {
          console.log(`✅ Facture ${teacher.last_name} ${month}: ${invoiceId}`);
          invoices.push({
            id: invoiceId,
            enseignant_id: teacher.id,
            campus_id: teacher.campus_id,
            month_year: month,
            teacher_name: teacher.last_name
          });
        }
      }
    }

    // 5. Créer des lignes de facture pour chaque facture
    console.log('\n📋 5. CRÉATION DES LIGNES DE FACTURE');
    console.log('-------------------------------------');
    
    let totalLinesCreated = 0;
    
    for (const invoice of invoices) {
      const numLines = Math.floor(Math.random() * 8) + 3; // 3 à 10 lignes par facture
      let invoiceTotal = 0;
      
      for (let i = 0; i < numLines; i++) {
        const lineId = crypto.randomUUID();
        const randomCampus = campuses[Math.floor(Math.random() * campuses.length)];
        const randomFiliere = filieres[Math.floor(Math.random() * filieres.length)];
        const randomClasse = classes[Math.floor(Math.random() * classes.length)];
        const randomMatiere = matieres[Math.floor(Math.random() * matieres.length)];
        
        // Date aléatoire dans le mois
        const monthDate = new Date(invoice.month_year + '-01');
        const dayInMonth = Math.floor(Math.random() * 28) + 1;
        const dateCours = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayInMonth);
        
        // Heures aléatoires
        const heureDebut = `${8 + Math.floor(Math.random() * 8)}:00`;
        const heureFin = `${parseInt(heureDebut) + 2}:00`;
        const quantiteHeures = 2;
        const prixUnitaire = 25 + Math.floor(Math.random() * 15); // 25-40€/h
        const totalTtc = quantiteHeures * prixUnitaire;
        
        const { error: lineError } = await supabase
          .from('invoice_lines')
          .insert({
            id: lineId,
            invoice_id: invoice.id,
            date_cours: dateCours.toISOString().split('T')[0],
            heure_debut: heureDebut,
            heure_fin: heureFin,
            campus: randomCampus.name,
            filiere: randomFiliere,
            classe: randomClasse,
            intitule: randomMatiere,
            retard: Math.random() > 0.8, // 20% de chance de retard
            quantite_heures: quantiteHeures,
            prix_unitaire: prixUnitaire,
            total_ttc: totalTtc,
            status: 'pending',
            created_at: new Date().toISOString()
          });
        
        if (lineError) {
          console.log(`❌ Erreur ligne facture:`, lineError.message);
        } else {
          invoiceTotal += totalTtc;
          totalLinesCreated++;
        }
      }
      
      // Mettre à jour le total de la facture
      await supabase
        .from('invoices')
        .update({ total_amount: invoiceTotal })
        .eq('id', invoice.id);
      
      console.log(`✅ Facture ${invoice.teacher_name} ${invoice.month_year}: ${numLines} lignes, ${invoiceTotal}€`);
    }

    // 6. Vérification finale
    console.log('\n📋 6. VÉRIFICATION FINALE');
    console.log('--------------------------');
    
    const { data: finalProfiles } = await supabase
      .from('profiles')
      .select('role');
    
    const { data: finalInvoices } = await supabase
      .from('invoices')
      .select('id');
    
    const { data: finalLines } = await supabase
      .from('invoice_lines')
      .select('id');
    
    console.log(`✅ Profils créés: ${finalProfiles?.length || 0}`);
    console.log(`   - Super Admin: ${finalProfiles?.filter(p => p.role === 'SUPER_ADMIN').length || 0}`);
    console.log(`   - Directeurs: ${directors.length}`);
    console.log(`   - Professeurs: ${teachers.length}`);
    console.log(`✅ Factures créées: ${finalInvoices?.length || 0}`);
    console.log(`✅ Lignes de facture créées: ${totalLinesCreated}`);
    
    console.log('\n🎉 SYSTÈME DE TEST COMPLET CRÉÉ !');
    console.log('================================');
    console.log('\n📋 UTILISATEURS CRÉÉS :');
    console.log('------------------------');
    console.log('SUPER ADMIN:');
    console.log('  houssam@aurlom.com / password123');
    console.log('\nDIRECTEURS:');
    directors.forEach((d, i) => {
      console.log(`  ${d.email} / directeur${i + 1}123`);
    });
    console.log('\nPROFESSEURS (premiers 5):');
    teachers.slice(0, 5).forEach((t, i) => {
      console.log(`  ${t.email} / prof${i + 1}123`);
    });
    console.log(`  ... et ${teachers.length - 5} autres professeurs`);
    
    console.log('\n🚀 TESTS À EFFECTUER :');
    console.log('----------------------');
    console.log('1. Connexion directeurs → Vérification panel directeur');
    console.log('2. Connexion professeurs → Vérification factures');
    console.log('3. Prévalidation factures → Panel directeur');
    console.log('4. Validation factures → Panel super admin');
    console.log('5. Système de paiement → Panel comptable');
    console.log('6. Synchronisation entre panels');

  } catch (error) {
    console.log('❌ Erreur inattendue:', error);
  }
}

createCompleteTestSystemFixed();
