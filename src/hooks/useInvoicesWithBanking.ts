import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { debugLogger } from '../lib/debug';
import toast from 'react-hot-toast';

export function useInvoicesWithBanking() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['invoices-with-banking'],
    queryFn: async () => {
      debugLogger.info('INVOICES', 'Récupération factures avec infos bancaires');
      
      const { data, error } = await supabase
        .rpc('get_invoices_with_banking_info');

      if (error) {
        debugLogger.error('INVOICES', 'Erreur RPC get_invoices_with_banking_info', error);
        throw error;
      }

      debugLogger.info('INVOICES', 'Factures avec infos bancaires récupérées', { count: data?.length || 0 });
      return data || [];
    },
    enabled: !!profile,
  });
}

export function useUpdateInvoiceBanking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      iban, 
      bic, 
      bank_name, 
      account_holder, 
      drive_invoice_link 
    }: {
      invoiceId: string;
      iban: string;
      bic: string;
      bank_name: string;
      account_holder: string;
      drive_invoice_link: string;
    }) => {
      debugLogger.info('INVOICES', 'Mise à jour infos bancaires facture', { invoiceId });

      const { data, error } = await supabase
        .from('invoices')
        .update({
          iban,
          bic,
          bank_name,
          account_holder,
          drive_invoice_link
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        debugLogger.error('INVOICES', 'Erreur mise à jour infos bancaires', error);
        throw error;
      }

      debugLogger.info('INVOICES', 'Infos bancaires mises à jour', { invoiceId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices-with-banking'] });
      toast.success('Informations bancaires mises à jour');
    },
    onError: (error) => {
      debugLogger.error('INVOICES', 'Erreur mutation infos bancaires', error);
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useConfirmInvoiceRIB() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      debugLogger.info('INVOICES', 'Confirmation RIB facture', { invoiceId });

      const { data, error } = await supabase
        .from('invoices')
        .update({
          rib_confirmed_at: new Date().toISOString(),
          rib_confirmed_by: profile?.id
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        debugLogger.error('INVOICES', 'Erreur confirmation RIB', error);
        throw error;
      }

      debugLogger.info('INVOICES', 'RIB confirmé', { invoiceId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices-with-banking'] });
      toast.success('RIB confirmé avec succès');
    },
    onError: (error) => {
      debugLogger.error('INVOICES', 'Erreur confirmation RIB', error);
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
