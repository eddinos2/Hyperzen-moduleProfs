import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Invoice, InvoiceLine } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { debugLogger, logDataAccess, logPermissionCheck } from '../lib/debug';
import toast from 'react-hot-toast';

export function useInvoices() {
  const { profile } = useAuth();
  
  console.log('🔗 useInvoices hook called - profile:', profile?.email, profile?.id);
  
  return useQuery({
    queryKey: ['invoices', profile?.id],
    queryFn: async () => {
      if (!profile?.id) {
        console.log('🚫 useInvoices: No profile ID, returning empty array');
        debugLogger.warn('DATA', 'Pas de profil pour récupérer les factures');
        return [];
      }
      
      console.log('🔍 useInvoices: Fetching invoices for profile:', profile.id, 'role:', profile.role);
      debugLogger.data('Début récupération factures', {
        userId: profile.id,
        role: profile.role,
        campus: profile.campus?.name
      });
      
      try {
        // Requête complète avec toutes les relations nécessaires
        let query = supabase
          .from('invoices')
          .select(`
            *,
            profiles:enseignant_id(first_name, last_name, email),
            campus:campus_id(name),
            prevalidated_profile:profiles!invoices_prevalidated_by_fkey(first_name, last_name),
            validated_profile:profiles!invoices_validated_by_fkey(first_name, last_name),
            paid_profile:profiles!invoices_paid_by_fkey(first_name, last_name)
          `)
          .order('created_at', { ascending: false });

        // Filtrer selon le rôle
        if (profile.role === 'ENSEIGNANT') {
          console.log('👨‍🏫 useInvoices: Filtering for teacher');
          logPermissionCheck(profile.role, 'OwnInvoices', true, 'Professeur voit ses factures');
          query = query.eq('enseignant_id', profile.id);
        } else if (profile.role === 'DIRECTEUR_CAMPUS' && profile.campus_id) {
          console.log('🏢 useInvoices: Filtering for campus director');
          logPermissionCheck(profile.role, 'CampusInvoices', true, 'Directeur voit factures de son campus');
          query = query.eq('campus_id', profile.campus_id);
        } else if (['SUPER_ADMIN', 'COMPTABLE'].includes(profile.role)) {
          console.log('👑 useInvoices: No filtering for admin/comptable - showing ALL invoices');
          logPermissionCheck(profile.role, 'AllInvoices', true, 'Admin/Comptable voit toutes les factures');
          // Pas de filtre - on récupère TOUTES les factures
        }

        console.log('📡 useInvoices: Executing query...');
        
        const { data, error } = await query;
        
        if (error) {
          console.error('❌ useInvoices: Error fetching invoices:', error);
          debugLogger.error('DATA', 'Erreur récupération factures', { error: error.message });
          return [];
        }
        
        console.log('✅ useInvoices: Fetched invoices:', data?.length || 0);
        logDataAccess(profile.role, 'invoices', data?.length || 0, {
          campus: profile.campus?.name,
          isTeacher: profile.role === 'ENSEIGNANT',
          isDirector: profile.role === 'DIRECTEUR_CAMPUS',
          isAdmin: ['SUPER_ADMIN', 'COMPTABLE'].includes(profile.role)
        });
        
        // Debug détaillé pour Super Admin
        if (profile.role === 'SUPER_ADMIN') {
          console.log('🔍 SUPER_ADMIN - Détail des factures récupérées:');
          data?.forEach((invoice, index) => {
            console.log(`   ${index + 1}. ${invoice.profiles?.email} - ${invoice.campus?.name} - ${invoice.month_year} - ${invoice.total_amount}€ (${invoice.status})`);
          });
        }
        
        return data || [];
      } catch (error) {
        console.error('💥 useInvoices: Exception:', error);
        debugLogger.error('DATA', 'Exception récupération factures', { error });
        return [];
      }
    },
    enabled: !!profile?.id,
    staleTime: 30 * 1000, // 30 secondes de cache pour voir les changements
    gcTime: 60 * 1000, // 1 minute avant garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}

export function useInvoiceLines(invoiceId?: string) {
  return useQuery({
    queryKey: ['invoice-lines', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      
      try {
        const { data, error } = await supabase
          .from('invoice_lines')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('date_cours', { ascending: true });
          
        if (error) throw error;
        return data as InvoiceLine[];
      } catch (error) {
        console.error('Error fetching invoice lines:', error);
        return [];
      }
    },
    enabled: !!invoiceId,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function usePrevalidateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invoiceId, lineIds }: { invoiceId: string; lineIds?: string[] }) => {
      const { data, error } = await supabase.rpc('prevalidate_invoice', {
        p_invoice_id: invoiceId,
        p_line_ids: lineIds || null,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Facture prévalidée avec succès');
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-lines'] });
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error('Erreur lors de la prévalidation');
      console.error(error);
    },
  });
}

export function useValidateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase.rpc('validate_invoice', {
        p_invoice_id: invoiceId,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Facture validée avec succès');
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-lines'] });
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error('Erreur lors de la validation');
      console.error(error);
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invoiceId, paymentDate }: { invoiceId: string; paymentDate: string }) => {
      const { data, error } = await supabase.rpc('mark_invoice_paid', {
        p_invoice_id: invoiceId,
        p_payment_date: paymentDate,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Paiement enregistré avec succès');
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-lines'] });
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'enregistrement du paiement');
      console.error(error);
    },
  });
}

export function useRejectInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invoiceId, reason }: { invoiceId: string; reason: string }) => {
      const { data, error } = await supabase.rpc('reject_invoice', {
        p_invoice_id: invoiceId,
        p_reason: reason,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Facture rejetée');
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-lines'] });
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error('Erreur lors du rejet');
      console.error(error);
    },
  });
}