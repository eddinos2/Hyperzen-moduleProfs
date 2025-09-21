import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { formatAmount } from '../lib/utils';

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      // Récupérer toutes les données nécessaires
      const [personnelResult, invoicesResult, campusResult, invoiceLinesResult] = await Promise.all([
        supabase.from('profiles').select('id, role, created_at, campus_id'),
        supabase.from('invoices').select('id, status, created_at, campus_id, total_amount, enseignant_id'),
        supabase.from('campus').select('id, name, created_at'),
        supabase.from('invoice_lines').select('id, invoice_id, quantite_heures, prix_unitaire, date_cours, campus_id')
      ]);

      if (personnelResult.error) throw personnelResult.error;
      if (invoicesResult.error) throw invoicesResult.error;
      if (campusResult.error) throw campusResult.error;
      if (invoiceLinesResult.error) throw invoiceLinesResult.error;

      const personnel = personnelResult.data || [];
      const invoices = invoicesResult.data || [];
      const campuses = campusResult.data || [];
      const invoiceLines = invoiceLinesResult.data || [];

      // Calculer les statistiques
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1. Total utilisateurs
      const totalUsers = personnel.length;
      const usersLastMonth = personnel.filter(p => 
        new Date(p.created_at) < currentMonth
      ).length;
      const userGrowth = usersLastMonth > 0 ? 
        ((totalUsers - usersLastMonth) / usersLastMonth * 100).toFixed(1) : '0';

      // 2. Factures en cours (submitted, prevalidated)
      const pendingInvoices = invoices.filter(i => 
        ['submitted', 'prevalidated'].includes(i.status)
      ).length;
      const pendingLastMonth = invoices.filter(i => 
        ['submitted', 'prevalidated'].includes(i.status) &&
        new Date(i.created_at) < currentMonth
      ).length;
      const invoiceGrowth = pendingLastMonth > 0 ? 
        ((pendingInvoices - pendingLastMonth) / pendingLastMonth * 100).toFixed(1) : '0';

      // 3. Campus actifs (avec au moins une facture ce mois)
      const activeCampuses = [...new Set(invoices
        .filter(i => new Date(i.created_at) >= currentMonth)
        .map(i => i.campus_id)
      )].length;
      const totalCampuses = campuses.length;

      // 4. Montant total des factures validées ce mois
      const currentMonthInvoices = invoices.filter(i => 
        i.status === 'validated' && new Date(i.created_at) >= currentMonth
      );
      const totalAmount = currentMonthInvoices.reduce((sum, i) => 
        sum + (i.total_amount || 0), 0
      );
      
      const lastMonthInvoices = invoices.filter(i => 
        i.status === 'validated' && 
        new Date(i.created_at) >= lastMonth && 
        new Date(i.created_at) < currentMonth
      );
      const lastMonthAmount = lastMonthInvoices.reduce((sum, i) => 
        sum + (i.total_amount || 0), 0
      );
      const amountGrowth = lastMonthAmount > 0 ? 
        ((totalAmount - lastMonthAmount) / lastMonthAmount * 100).toFixed(1) : '0';

      // 5. KPI métier intelligents
      
      // Top professeurs par montant gagné
      const professorEarnings = personnel
        .filter(p => p.role === 'ENSEIGNANT')
        .map(prof => {
          const profInvoices = invoices.filter(i => i.enseignant_id === prof.id);
          const totalEarned = profInvoices
            .filter(i => i.status === 'validated')
            .reduce((sum, i) => sum + (i.total_amount || 0), 0);
          
          const totalHours = invoiceLines
            .filter(line => {
              const invoice = invoices.find(i => i.id === line.invoice_id);
              return invoice?.enseignant_id === prof.id;
            })
            .reduce((sum, line) => sum + (line.quantite_heures || 0), 0);

          return {
            id: prof.id,
            name: `${prof.first_name} ${prof.last_name}`,
            totalEarned,
            totalHours,
            averageHourlyRate: totalHours > 0 ? totalEarned / totalHours : 0,
            invoiceCount: profInvoices.length
          };
        })
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, 5);

      // Performance par campus
      const campusPerformance = campuses.map(campus => {
        const campusInvoices = invoices.filter(i => i.campus_id === campus.id);
        const campusLines = invoiceLines.filter(line => line.campus_id === campus.id);
        
        const totalRevenue = campusInvoices
          .filter(i => i.status === 'validated')
          .reduce((sum, i) => sum + (i.total_amount || 0), 0);
        
        const totalHours = campusLines.reduce((sum, line) => 
          sum + (line.quantite_heures || 0), 0);
        
        const averageHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;
        const professorCount = personnel.filter(p => 
          p.campus_id === campus.id && p.role === 'ENSEIGNANT'
        ).length;

        return {
          id: campus.id,
          name: campus.name,
          totalRevenue,
          totalHours,
          averageHourlyRate,
          professorCount,
          invoiceCount: campusInvoices.length,
          efficiency: professorCount > 0 ? totalRevenue / professorCount : 0
        };
      }).sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Activités récentes
      const recentActivities = invoices
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(invoice => {
          const professor = personnel.find(p => p.id === invoice.enseignant_id);
          const campus = campuses.find(c => c.id === invoice.campus_id);
          
          return {
            id: invoice.id,
            type: 'invoice',
            title: getActivityTitle(invoice.status),
            description: `${professor?.first_name} ${professor?.last_name} - ${campus?.name}`,
            time: getRelativeTime(invoice.created_at),
            status: invoice.status,
            amount: invoice.total_amount
          };
        });

      return {
        stats: [
          {
            name: 'Total Utilisateurs',
            value: totalUsers.toString(),
            change: `${userGrowth > 0 ? '+' : ''}${userGrowth}%`,
            changeType: parseFloat(userGrowth) > 0 ? 'positive' : parseFloat(userGrowth) < 0 ? 'negative' : 'neutral',
            icon: 'Users',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
          },
          {
            name: 'Factures en cours',
            value: pendingInvoices.toString(),
            change: `${invoiceGrowth > 0 ? '+' : ''}${invoiceGrowth}%`,
            changeType: parseFloat(invoiceGrowth) > 0 ? 'positive' : parseFloat(invoiceGrowth) < 0 ? 'negative' : 'neutral',
            icon: 'FileText',
            color: 'text-green-600',
            bgColor: 'bg-green-100'
          },
          {
            name: 'Campus actifs',
            value: `${activeCampuses}/${totalCampuses}`,
            change: '0%',
            changeType: 'neutral',
            icon: 'Building2',
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
          },
          {
            name: 'Montant validé ce mois',
            value: formatAmount(totalAmount),
            change: `${amountGrowth > 0 ? '+' : ''}${amountGrowth}%`,
            changeType: parseFloat(amountGrowth) > 0 ? 'positive' : parseFloat(amountGrowth) < 0 ? 'negative' : 'neutral',
            icon: 'DollarSign',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100'
          }
        ],
        topProfessors: professorEarnings,
        campusPerformance,
        recentActivities
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false
  });
}

function getActivityTitle(status: string): string {
  const titles: Record<string, string> = {
    'submitted': 'Nouvelle facture soumise',
    'prevalidated': 'Facture prévalidée',
    'validated': 'Facture validée',
    'paid': 'Facture payée',
    'rejected': 'Facture rejetée'
  };
  return titles[status] || 'Facture mise à jour';
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Il y a moins d\'une heure';
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  return date.toLocaleDateString();
}
