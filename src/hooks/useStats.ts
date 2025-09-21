import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export function useGlobalStats() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => {
      // Récupérer toutes les données nécessaires
      const [profilesResult, campusResult, invoicesResult] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('campus').select('*'),
        supabase.from('invoices').select('*')
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (campusResult.error) throw campusResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      const profiles = profilesResult.data || [];
      const campuses = campusResult.data || [];
      const invoices = invoicesResult.data || [];

      // Calculer les statistiques
      const stats = {
        totalProfiles: profiles.length,
        totalTeachers: profiles.filter(p => p.role === 'ENSEIGNANT').length,
        totalDirectors: profiles.filter(p => p.role === 'DIRECTEUR_CAMPUS').length,
        totalAccountants: profiles.filter(p => p.role === 'COMPTABLE').length,
        totalAdmins: profiles.filter(p => p.role === 'SUPER_ADMIN').length,
        
        totalCampuses: campuses.length,
        campusesWithDirector: campuses.filter(c => c.directeur_id).length,
        campusesWithoutDirector: campuses.filter(c => !c.directeur_id).length,
        
        totalInvoices: invoices.length,
        pendingInvoices: invoices.filter(i => i.status === 'pending').length,
        prevalidatedInvoices: invoices.filter(i => i.status === 'prevalidated').length,
        validatedInvoices: invoices.filter(i => i.status === 'validated').length,
        paidInvoices: invoices.filter(i => i.status === 'paid').length,
        rejectedInvoices: invoices.filter(i => i.status === 'rejected').length,
        
        totalAmount: invoices.reduce((sum, i) => sum + i.total_amount, 0),
        paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0),
        pendingAmount: invoices.filter(i => ['pending', 'prevalidated', 'validated'].includes(i.status)).reduce((sum, i) => sum + i.total_amount, 0),
        
        uniqueTeachersWithInvoices: new Set(invoices.map(i => i.enseignant_id)).size,
        uniqueCampusesWithInvoices: new Set(invoices.map(i => i.campus_id)).size,
      };

      return stats;
    },
    enabled: !!profile,
    staleTime: 30 * 1000, // 30 secondes
  });
}

export function useCampusStats(campusId?: string) {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['campus-stats', campusId],
    queryFn: async () => {
      if (!campusId) return null;
      
      // Récupérer les données du campus
      const [profilesResult, invoicesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('campus_id', campusId),
        supabase.from('invoices').select('*').eq('campus_id', campusId)
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      const profiles = profilesResult.data || [];
      const invoices = invoicesResult.data || [];

      return {
        totalTeachers: profiles.filter(p => p.role === 'ENSEIGNANT').length,
        totalInvoices: invoices.length,
        pendingInvoices: invoices.filter(i => i.status === 'pending').length,
        prevalidatedInvoices: invoices.filter(i => i.status === 'prevalidated').length,
        validatedInvoices: invoices.filter(i => i.status === 'validated').length,
        paidInvoices: invoices.filter(i => i.status === 'paid').length,
        totalAmount: invoices.reduce((sum, i) => sum + i.total_amount, 0),
        paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0),
      };
    },
    enabled: !!profile && !!campusId,
    staleTime: 30 * 1000,
  });
}

export function useTeacherStats(teacherId?: string) {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['teacher-stats', teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('enseignant_id', teacherId);

      if (error) throw error;

      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentMonthInvoices = invoices?.filter(i => i.month_year === currentMonth) || [];

      return {
        totalInvoices: invoices?.length || 0,
        currentMonthInvoices: currentMonthInvoices.length,
        totalAmount: invoices?.reduce((sum, i) => sum + i.total_amount, 0) || 0,
        currentMonthAmount: currentMonthInvoices.reduce((sum, i) => sum + i.total_amount, 0),
        paidAmount: invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0) || 0,
        pendingAmount: invoices?.filter(i => ['pending', 'prevalidated', 'validated'].includes(i.status)).reduce((sum, i) => sum + i.total_amount, 0) || 0,
      };
    },
    enabled: !!profile && !!teacherId,
    staleTime: 30 * 1000,
  });
}

// Nouveau hook pour les statistiques des professeurs (utilise la fonction RPC)
export function useAllTeacherStats() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['all-teacher-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_teacher_stats');
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
    staleTime: 30 * 1000,
  });
}