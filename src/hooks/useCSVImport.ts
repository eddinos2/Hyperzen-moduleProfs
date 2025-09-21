import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, InvoiceLine, CampusName } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { parseCSV, normalizeDate, normalizeDecimal, generateMonthYear, normalizeCampusName } from '../lib/utils';
import toast from 'react-hot-toast';

interface CSVRow {
  mois: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  campus: string;
  filiere: string;
  classe: string;
  intitule: string;
  retard: string;
  quantite: string;
  prixUnitaire: string;
  totalTTC: string;
}

export function useCSVImport() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (csvContent: string) => {
      if (!profile) throw new Error('Non authentifié');
      
      // Parse le CSV
      const rows = parseCSV(csvContent);
      if (rows.length < 2) throw new Error('Fichier CSV vide ou invalide');
      
      const [headers, ...dataRows] = rows;
      
      // Normaliser les lignes
      const invoiceLines: Partial<InvoiceLine>[] = [];
      let campusId: string | null = null;
      let monthYear: string | null = null;
      
      for (const row of dataRows) {
        if (row.length < 12) continue; // Skip lignes incomplètes
        
        const csvRow: CSVRow = {
          mois: row[0],
          date: row[1],
          heureDebut: row[2],
          heureFin: row[3],
          campus: row[4],
          filiere: row[5],
          classe: row[6],
          intitule: row[7],
          retard: row[8],
          quantite: row[9],
          prixUnitaire: row[10],
          totalTTC: row[11],
        };
        
        // Normaliser la date
        let normalizedDate: string;
        try {
          // Extraire la date de "mardi 3 février 2026" (ignorer le jour de la semaine)
          const dateMatch = csvRow.date.match(/(?:[\p{L}]+\s+)?(\d{1,2})\s+([\p{L}]+)\s+(\d{4})/u);
          if (dateMatch) {
            const [, day, monthName, year] = dateMatch;
            const monthMap: Record<string, string> = {
              'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
              'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
              'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
            };
            const monthNum = monthMap[monthName.toLowerCase()];
            if (!monthNum) throw new Error(`Mois invalide: ${monthName}`);
            
            normalizedDate = `${year}-${monthNum}-${day.padStart(2, '0')}`;
            if (!monthYear) monthYear = `${year}-${monthNum}`;
          } else {
            normalizedDate = normalizeDate(csvRow.date);
            if (!monthYear) monthYear = generateMonthYear(new Date(normalizedDate));
          }
        } catch (error) {
          throw new Error(`Date invalide ligne ${dataRows.indexOf(row) + 2}: ${csvRow.date}`);
        }
        
        // Vérifier le campus
        if (!campusId) {
          const normalizedCampus = normalizeCampusName(csvRow.campus);
          const { data: campus } = await supabase
            .from('campus')
            .select('id')
            .eq('name', normalizedCampus as CampusName)
            .single();
          
          if (!campus) {
            throw new Error(`Campus invalide: ${csvRow.campus} (normalisé: ${normalizedCampus})`);
          }
          campusId = campus.id;
        }
        
        // Créer la ligne de facture
        const line: Partial<InvoiceLine> = {
          date_cours: normalizedDate,
          heure_debut: csvRow.heureDebut,
          heure_fin: csvRow.heureFin,
          campus: normalizeCampusName(csvRow.campus) as CampusName,
          filiere: csvRow.filiere,
          classe: csvRow.classe,
          intitule: csvRow.intitule,
          retard: csvRow.retard.toLowerCase() !== 'aucun',
          quantite_heures: normalizeDecimal(csvRow.quantite),
          prix_unitaire: normalizeDecimal(csvRow.prixUnitaire.replace('€', '').trim()),
          total_ttc: normalizeDecimal(csvRow.totalTTC.replace('€', '').trim()),
          status: 'pending' as InvoiceStatus,
        };
        
        invoiceLines.push(line);
      }
      
      if (!campusId || !monthYear || invoiceLines.length === 0) {
        throw new Error('Données CSV invalides');
      }
      
      // Calculer le total
      const totalAmount = invoiceLines.reduce((sum, line) => sum + (line.total_ttc || 0), 0);
      
      // Créer ou récupérer la facture
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('enseignant_id', profile.id)
        .eq('month_year', monthYear)
        .single();
      
      let invoiceId: string;
      
      if (existingInvoice) {
        // Mettre à jour la facture existante
        const { error } = await supabase
          .from('invoices')
          .update({ 
            total_amount: totalAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInvoice.id);
        
        if (error) throw error;
        invoiceId = existingInvoice.id;
        
        // Supprimer les anciennes lignes
        await supabase
          .from('invoice_lines')
          .delete()
          .eq('invoice_id', invoiceId);
      } else {
        // Créer nouvelle facture
        const { data: newInvoice, error } = await supabase
          .from('invoices')
          .insert({
            enseignant_id: profile.id,
            campus_id: campusId,
            month_year: monthYear,
            total_amount: totalAmount,
          })
          .select()
          .single();
        
        if (error) throw error;
        invoiceId = newInvoice.id;
      }
      
      // Insérer les lignes de facture
      const linesToInsert = invoiceLines.map(line => ({
        ...line,
        invoice_id: invoiceId,
      }));
      
      const { error: linesError } = await supabase
        .from('invoice_lines')
        .insert(linesToInsert);
      
      if (linesError) throw linesError;
      
      return {
        invoiceId,
        linesCount: invoiceLines.length,
        totalAmount,
        monthYear,
      };
    },
    onSuccess: (data) => {
      toast.success(`Facture importée: ${data.linesCount} lignes, ${data.totalAmount.toFixed(2)}€`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      toast.error(`Erreur d'import: ${(error as Error).message}`);
      console.error(error);
    },
  });
}