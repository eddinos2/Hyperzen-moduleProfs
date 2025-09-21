import { createClient } from '@supabase/supabase-js';

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
  console.error('\nVeuillez définir ces variables dans votre fichier .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface TestAccount {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'DIRECTEUR_CAMPUS' | 'COMPTABLE' | 'ENSEIGNANT';
  campusName?: string;
}

const testAccounts: TestAccount[] = [
  // Super Admin (déjà existant)
  {
    email: 'houssam@aurlom.com',
    password: '1313ImIm.',
    firstName: 'Houssam',
    lastName: 'Admin',
    role: 'SUPER_ADMIN'
  },
  
  // Comptables
  {
    email: 'comptable@aurlom.com',
    password: 'Test123!',
    firstName: 'Sophie',
    lastName: 'Comptable',
    role: 'COMPTABLE'
  },
  {
    email: 'marie.finance@aurlom.com',
    password: 'Test123!',
    firstName: 'Marie',
    lastName: 'Finance',
    role: 'COMPTABLE'
  },

  // Directeurs de Campus
  {
    email: 'directeur.roquette@aurlom.com',
    password: 'Test123!',
    firstName: 'Pierre',
    lastName: 'Directeur',
    role: 'DIRECTEUR_CAMPUS',
    campusName: 'Roquette'
  },
  {
    email: 'directeur.picpus@aurlom.com',
    password: 'Test123!',
    firstName: 'Marie',
    lastName: 'Directrice',
    role: 'DIRECTEUR_CAMPUS',
    campusName: 'Picpus'
  },
  {
    email: 'directeur.sentier@aurlom.com',
    password: 'Test123!',
    firstName: 'Jean',
    lastName: 'Directeur',
    role: 'DIRECTEUR_CAMPUS',
    campusName: 'Sentier'
  },
  {
    email: 'directeur.douai@aurlom.com',
    password: 'Test123!',
    firstName: 'Claire',
    lastName: 'Directrice',
    role: 'DIRECTEUR_CAMPUS',
    campusName: 'Douai'
  },

  // Professeurs - Campus Roquette
  {
    email: 'prof.martin@aurlom.com',
    password: 'Test123!',
    firstName: 'Jean',
    lastName: 'Martin',
    role: 'ENSEIGNANT',
    campusName: 'Roquette'
  },
  {
    email: 'prof.durand@aurlom.com',
    password: 'Test123!',
    firstName: 'Claire',
    lastName: 'Durand',
    role: 'ENSEIGNANT',
    campusName: 'Roquette'
  },
  {
    email: 'prof.bernard@aurlom.com',
    password: 'Test123!',
    firstName: 'Michel',
    lastName: 'Bernard',
    role: 'ENSEIGNANT',
    campusName: 'Roquette'
  },

  // Professeurs - Campus Picpus
  {
    email: 'prof.moreau@aurlom.com',
    password: 'Test123!',
    firstName: 'Sophie',
    lastName: 'Moreau',
    role: 'ENSEIGNANT',
    campusName: 'Picpus'
  },
  {
    email: 'prof.petit@aurlom.com',
    password: 'Test123!',
    firstName: 'Antoine',
    lastName: 'Petit',
    role: 'ENSEIGNANT',
    campusName: 'Picpus'
  },
  {
    email: 'prof.robert@aurlom.com',
    password: 'Test123!',
    firstName: 'Isabelle',
    lastName: 'Robert',
    role: 'ENSEIGNANT',
    campusName: 'Picpus'
  },

  // Professeurs - Campus Sentier
  {
    email: 'prof.richard@aurlom.com',
    password: 'Test123!',
    firstName: 'Paul',
    lastName: 'Richard',
    role: 'ENSEIGNANT',
    campusName: 'Sentier'
  },
  {
    email: 'prof.simon@aurlom.com',
    password: 'Test123!',
    firstName: 'Julie',
    lastName: 'Simon',
    role: 'ENSEIGNANT',
    campusName: 'Sentier'
  },

  // Professeurs - Campus Douai
  {
    email: 'prof.michel@aurlom.com',
    password: 'Test123!',
    firstName: 'François',
    lastName: 'Michel',
    role: 'ENSEIGNANT',
    campusName: 'Douai'
  },
  {
    email: 'prof.laurent@aurlom.com',
    password: 'Test123!',
    firstName: 'Nathalie',
    lastName: 'Laurent',
    role: 'ENSEIGNANT',
    campusName: 'Douai'
  },

  // Professeurs sans campus assigné (pour tester l'assignation)
  {
    email: 'prof.nouveau1@aurlom.com',
    password: 'Test123!',
    firstName: 'Thomas',
    lastName: 'Nouveau',
    role: 'ENSEIGNANT'
  },
  {
    email: 'prof.nouveau2@aurlom.com',
    password: 'Test123!',
    firstName: 'Emma',
    lastName: 'Nouvelle',
    role: 'ENSEIGNANT'
  }
];

// Données de factures de test
const testInvoices = [
  {
    professorEmail: 'prof.martin@aurlom.com',
    campusName: 'Jaurès',
    monthYear: '2026-02',
    status: 'pending',
    lines: [
      {
        date: '2026-02-03',
        heureDebut: '08:30',
        heureFin: '10:00',
        filiere: 'BTS SIO',
        classe: 'SIO1',
        intitule: 'Programmation Java',
        quantiteHeures: 1.5,
        prixUnitaire: 60.00,
        totalTTC: 90.00
      },
      {
        date: '2026-02-05',
        heureDebut: '14:00',
        heureFin: '16:00',
        filiere: 'BTS SIO',
        classe: 'SIO2',
        intitule: 'Base de données',
        quantiteHeures: 2.0,
        prixUnitaire: 60.00,
        totalTTC: 120.00
      },
      {
        date: '2026-02-07',
        heureDebut: '09:00',
        heureFin: '11:00',
        filiere: 'BTS SIO',
        classe: 'SIO1',
        intitule: 'Projet Java',
        quantiteHeures: 2.0,
        prixUnitaire: 60.00,
        totalTTC: 120.00
      }
    ]
  },
  {
    professorEmail: 'prof.durand@aurlom.com',
    campusName: 'Roquette',
    monthYear: '2026-02',
    status: 'prevalidated',
    lines: [
      {
        date: '2026-02-04',
        heureDebut: '09:00',
        heureFin: '11:00',
        filiere: 'BTS MCO',
        classe: 'MCO1',
        intitule: 'Marketing',
        quantiteHeures: 2.0,
        prixUnitaire: 60.00,
        totalTTC: 120.00
      },
      {
        date: '2026-02-06',
        heureDebut: '14:00',
        heureFin: '16:00',
        filiere: 'BTS MCO',
        classe: 'MCO2',
        intitule: 'Communication',
        quantiteHeures: 2.0,
        prixUnitaire: 60.00,
        totalTTC: 120.00
      }
    ]
  },
  {
    professorEmail: 'prof.moreau@aurlom.com',
    campusName: 'Picpus',
    monthYear: '2026-02',
    status: 'validated',
    lines: [
      {
        date: '2026-02-06',
        heureDebut: '10:00',
        heureFin: '12:00',
        filiere: 'BTS NDRC',
        classe: 'NDRC1',
        intitule: 'Négociation',
        quantiteHeures: 2.0,
        prixUnitaire: 60.00,
        totalTTC: 120.00
      }
    ]
  },
  {
    professorEmail: 'prof.petit@aurlom.com',
    campusName: 'Picpus',
    monthYear: '2026-01',
    status: 'paid',
    lines: [
      {
        date: '2026-01-15',
        heureDebut: '13:30',
        heureFin: '15:30',
        filiere: 'BTS CG',
        classe: 'CG1',
        intitule: 'Comptabilité',
        quantiteHeures: 2.0,
        prixUnitaire: 60.00,
        totalTTC: 120.00
      }
    ]
  }
];

async function createCompleteTestData() {
  console.log('🚀 Création des données de test complètes...\n');

  try {
    // 1. Créer les comptes utilisateurs
    console.log('👥 Création des comptes utilisateurs...');
    for (const account of testAccounts) {
      try {
        // Vérifier si l'utilisateur existe déjà
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const userExists = existingUser.users.some(u => u.email === account.email);
        
        if (userExists) {
          console.log(`⏭️  ${account.email} existe déjà`);
          continue;
        }

        console.log(`📧 Création de ${account.email}...`);

        // Créer l'utilisateur dans auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            first_name: account.firstName,
            last_name: account.lastName
          }
        });

        if (authError) {
          console.error(`❌ Erreur auth pour ${account.email}:`, authError.message);
          continue;
        }

        // Récupérer l'ID du campus si nécessaire
        let campusId = null;
        if (account.campusName) {
          const { data: campus, error: campusError } = await supabase
            .from('campus')
            .select('id')
            .eq('name', account.campusName)
            .single();

          if (campusError) {
            console.error(`❌ Campus ${account.campusName} non trouvé:`, campusError.message);
            continue;
          }
          campusId = campus.id;
        }

        // Créer le profil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user!.id,
            email: account.email,
            first_name: account.firstName,
            last_name: account.lastName,
            role: account.role,
            campus_id: campusId
          });

        if (profileError) {
          console.error(`❌ Erreur profil pour ${account.email}:`, profileError.message);
          continue;
        }

        // Si c'est un directeur de campus, mettre à jour le campus
        if (account.role === 'DIRECTEUR_CAMPUS' && campusId) {
          const { error: updateCampusError } = await supabase
            .from('campus')
            .update({ directeur_id: authUser.user!.id })
            .eq('id', campusId);

          if (updateCampusError) {
            console.error(`❌ Erreur mise à jour campus:`, updateCampusError.message);
          }
        }

        console.log(`✅ ${account.email} créé avec succès (${account.role})`);

      } catch (error) {
        console.error(`❌ Erreur générale pour ${account.email}:`, error);
      }
    }

    // 2. Créer les factures de test
    console.log('\n📄 Création des factures de test...');
    for (const invoiceData of testInvoices) {
      try {
        // Récupérer le professeur
        const { data: professor } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', invoiceData.professorEmail)
          .single();

        if (!professor) {
          console.error(`❌ Professeur ${invoiceData.professorEmail} non trouvé`);
          continue;
        }

        // Récupérer le campus
        const { data: campus } = await supabase
          .from('campus')
          .select('id')
          .eq('name', invoiceData.campusName)
          .single();

        if (!campus) {
          console.error(`❌ Campus ${invoiceData.campusName} non trouvé`);
          continue;
        }

        // Calculer le montant total
        const totalAmount = invoiceData.lines.reduce((sum, line) => sum + line.totalTTC, 0);

        // Créer la facture
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            enseignant_id: professor.id,
            campus_id: campus.id,
            month_year: invoiceData.monthYear,
            status: invoiceData.status,
            total_amount: totalAmount,
            ...(invoiceData.status === 'prevalidated' && {
              prevalidated_by: professor.id,
              prevalidated_at: new Date().toISOString()
            }),
            ...(invoiceData.status === 'validated' && {
              prevalidated_by: professor.id,
              prevalidated_at: new Date().toISOString(),
              validated_by: professor.id,
              validated_at: new Date().toISOString()
            }),
            ...(invoiceData.status === 'paid' && {
              prevalidated_by: professor.id,
              prevalidated_at: new Date().toISOString(),
              validated_by: professor.id,
              validated_at: new Date().toISOString(),
              paid_by: professor.id,
              payment_date: new Date().toISOString()
            })
          })
          .select()
          .single();

        if (invoiceError) {
          console.error(`❌ Erreur création facture:`, invoiceError.message);
          continue;
        }

        // Créer les lignes de facture
        const linesToInsert = invoiceData.lines.map(line => ({
          invoice_id: invoice.id,
          date_cours: line.date,
          heure_debut: line.heureDebut,
          heure_fin: line.heureFin,
          campus: invoiceData.campusName,
          filiere: line.filiere,
          classe: line.classe,
          intitule: line.intitule,
          retard: false,
          quantite_heures: line.quantiteHeures,
          prix_unitaire: line.prixUnitaire,
          total_ttc: line.totalTTC,
          status: invoiceData.status
        }));

        const { error: linesError } = await supabase
          .from('invoice_lines')
          .insert(linesToInsert);

        if (linesError) {
          console.error(`❌ Erreur création lignes:`, linesError.message);
          continue;
        }

        console.log(`✅ Facture créée pour ${invoiceData.professorEmail} (${invoiceData.status})`);

      } catch (error) {
        console.error(`❌ Erreur création facture:`, error);
      }
    }

    console.log('\n🎉 Création des données de test terminée !');
    console.log('\n📋 Récapitulatif des comptes créés :');
    console.log('┌─────────────────────────────────────┬─────────────────┬──────────────────┬─────────────────┐');
    console.log('│ Email                               │ Mot de passe    │ Rôle             │ Campus          │');
    console.log('├─────────────────────────────────────┼─────────────────┼──────────────────┼─────────────────┤');
    
    testAccounts.forEach(account => {
      const role = account.role.replace('_', ' ');
      const campus = account.campusName || 'Non assigné';
      console.log(`│ ${account.email.padEnd(35)} │ ${account.password.padEnd(15)} │ ${role.padEnd(16)} │ ${campus.padEnd(15)} │`);
    });
    
    console.log('└─────────────────────────────────────┴─────────────────┴──────────────────┴─────────────────┘');

    console.log('\n📊 Statistiques :');
    console.log(`• ${testAccounts.filter(a => a.role === 'SUPER_ADMIN').length} Super Admin`);
    console.log(`• ${testAccounts.filter(a => a.role === 'COMPTABLE').length} Comptables`);
    console.log(`• ${testAccounts.filter(a => a.role === 'DIRECTEUR_CAMPUS').length} Directeurs de Campus`);
    console.log(`• ${testAccounts.filter(a => a.role === 'ENSEIGNANT').length} Professeurs`);
    console.log(`• ${testInvoices.length} Factures de test`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
createCompleteTestData().catch(console.error);