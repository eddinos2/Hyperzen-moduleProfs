import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { debugLogger } from '../lib/debug';
import toast from 'react-hot-toast';

export function usePrevalidateInvoiceLine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      lineId, 
      observations = '' 
    }: { 
      lineId: string; 
      observations?: string; 
    }) => {
      debugLogger.info('INVOICE_LINES', 'Prévalidation ligne', { lineId, observations });
      
      // 1. Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Utilisateur non connecté');
      
      // 2. Récupérer le profil de l'utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, campus_id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) throw new Error('Profil utilisateur non trouvé');
      
      // 3. Vérifier que c'est un directeur de campus
      if (profile.role !== 'DIRECTEUR_CAMPUS') {
        throw new Error('Seuls les directeurs de campus peuvent prévalider des lignes');
      }
      
      // 4. Récupérer la ligne à prévalider
      const { data: line, error: lineError } = await supabase
        .from('invoice_lines')
        .select('id, campus_id, intitule')
        .eq('id', lineId)
        .single();
      
      if (lineError || !line) throw new Error('Ligne de facture non trouvée');
      
      // 5. VÉRIFICATION CRUCIALE : Le directeur ne peut prévalider que les lignes de son campus
      if (line.campus_id !== profile.campus_id) {
        throw new Error(`Vous ne pouvez prévalider que les lignes de votre campus. Cette ligne appartient à un autre campus.`);
      }
      
      debugLogger.info('INVOICE_LINES', 'Vérifications OK, prévalidation autorisée', { 
        lineId, 
        directorCampus: profile.campus_id, 
        lineCampus: line.campus_id 
      });
      
      // 6. Effectuer la prévalidation
      const { data, error } = await supabase
        .from('invoice_lines')
        .update({
          prevalidated_by: user.id,
          prevalidated_at: new Date().toISOString(),
          observations: observations.trim() || null,
          status: 'prevalidated'
        })
        .eq('id', lineId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      debugLogger.info('INVOICE_LINES', 'Ligne prévalidée avec succès', { lineId: data.id });
      toast.success('Ligne prévalidée avec succès');
      
      // Invalider les requêtes liées avec plus de spécificité
      queryClient.invalidateQueries({ queryKey: ['invoice-lines'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-lines', data.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.invoice_id] });
      
      // Forcer le rafraîchissement immédiat
      queryClient.refetchQueries({ queryKey: ['invoice-lines', data.invoice_id] });
    },
    onError: (error) => {
      debugLogger.error('INVOICE_LINES', 'Erreur prévalidation ligne', error);
      toast.error(`Erreur prévalidation: ${(error as Error).message}`);
    },
  });
}

export function useRejectInvoiceLine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      lineId, 
      observations = '' 
    }: { 
      lineId: string; 
      observations?: string; 
    }) => {
      debugLogger.info('INVOICE_LINES', 'Rejet ligne', { lineId, observations });
      
      // 1. Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Utilisateur non connecté');
      
      // 2. Récupérer le profil de l'utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, campus_id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) throw new Error('Profil utilisateur non trouvé');
      
      // 3. Vérifier que c'est un directeur de campus
      if (profile.role !== 'DIRECTEUR_CAMPUS') {
        throw new Error('Seuls les directeurs de campus peuvent rejeter des lignes');
      }
      
      // 4. Récupérer la ligne à rejeter
      const { data: line, error: lineError } = await supabase
        .from('invoice_lines')
        .select('id, campus_id, intitule')
        .eq('id', lineId)
        .single();
      
      if (lineError || !line) throw new Error('Ligne de facture non trouvée');
      
      // 5. VÉRIFICATION CRUCIALE : Le directeur ne peut rejeter que les lignes de son campus
      if (line.campus_id !== profile.campus_id) {
        throw new Error(`Vous ne pouvez rejeter que les lignes de votre campus. Cette ligne appartient à un autre campus.`);
      }
      
      debugLogger.info('INVOICE_LINES', 'Vérifications OK, rejet autorisé', { 
        lineId, 
        directorCampus: profile.campus_id, 
        lineCampus: line.campus_id 
      });
      
      // 6. Effectuer le rejet
      const { data, error } = await supabase
        .from('invoice_lines')
        .update({
          prevalidated_by: user.id,
          prevalidated_at: new Date().toISOString(),
          observations: `REJETÉ: ${observations.trim()}`,
          status: 'rejected'
        })
        .eq('id', lineId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      debugLogger.info('INVOICE_LINES', 'Ligne rejetée avec succès', { lineId: data.id });
      toast.success('Ligne rejetée');
      
      // Invalider les requêtes liées avec plus de spécificité
      queryClient.invalidateQueries({ queryKey: ['invoice-lines'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-lines', data.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.invoice_id] });
      
      // Forcer le rafraîchissement immédiat
      queryClient.refetchQueries({ queryKey: ['invoice-lines', data.invoice_id] });
    },
    onError: (error) => {
      debugLogger.error('INVOICE_LINES', 'Erreur rejet ligne', error);
      toast.error(`Erreur rejet: ${(error as Error).message}`);
    },
  });
}
