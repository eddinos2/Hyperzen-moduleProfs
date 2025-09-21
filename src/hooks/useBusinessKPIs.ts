import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { formatAmount } from '../lib/utils';

export function useBusinessKPIs() {
  return useQuery({
    queryKey: ['business-kpis'],
    queryFn: async () => {
      // Récupérer toutes les données nécessaires
      const [personnelResult, invoicesResult, invoiceLinesResult, campusResult] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, role, campus_id'),
        supabase.from('invoices').select('id, enseignant_id, campus_id, status, total_amount, created_at'),
        supabase.from('invoice_lines').select('id, invoice_id, quantite_heures, prix_unitaire, date_cours, campus_id, intitule'),
        supabase.from('campus').select('id, name')
      ]);

      if (personnelResult.error) throw personnelResult.error;
      if (invoicesResult.error) throw invoicesResult.error;
      if (invoiceLinesResult.error) throw invoiceLinesResult.error;
      if (campusResult.error) throw campusResult.error;

      const personnel = personnelResult.data || [];
      const invoices = invoicesResult.data || [];
      const invoiceLines = invoiceLinesResult.data || [];
      const campuses = campusResult.data || [];

      // Calculer les KPI métier intelligents

      // 1. ANALYSE DES PROFESSEURS
      const professorAnalysis = personnel
        .filter(p => p.role === 'ENSEIGNANT')
        .map(prof => {
          const profInvoices = invoices.filter(i => i.enseignant_id === prof.id);
          const profLines = invoiceLines.filter(line => {
            const invoice = invoices.find(i => i.id === line.invoice_id);
            return invoice?.enseignant_id === prof.id;
          });

          const totalEarned = profInvoices
            .filter(i => i.status === 'validated')
            .reduce((sum, i) => sum + (i.total_amount || 0), 0);

          const totalHours = profLines.reduce((sum, line) => 
            sum + (line.quantite_heures || 0), 0);

          const averageHourlyRate = totalHours > 0 ? totalEarned / totalHours : 0;

          // Calculer l'efficacité (ratio prestations/heures)
          const totalPrestations = profLines.length;
          const hoursPerPrestation = totalPrestations > 0 ? totalHours / totalPrestations : 0;

          // Calculer la régularité (écart-type des montants)
          const invoiceAmounts = profInvoices
            .filter(i => i.status === 'validated')
            .map(i => i.total_amount || 0);
          const avgAmount = invoiceAmounts.length > 0 ? 
            invoiceAmounts.reduce((sum, amt) => sum + amt, 0) / invoiceAmounts.length : 0;
          const variance = invoiceAmounts.length > 0 ?
            invoiceAmounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / invoiceAmounts.length : 0;
          const regularity = Math.sqrt(variance);

          return {
            id: prof.id,
            name: `${prof.first_name} ${prof.last_name}`,
            campus: campuses.find(c => c.id === prof.campus_id)?.name || 'Non assigné',
            totalEarned,
            totalHours,
            totalPrestations,
            averageHourlyRate,
            hoursPerPrestation,
            invoiceCount: profInvoices.length,
            regularity: avgAmount - regularity, // Plus c'est proche de 0, plus c'est régulier
            efficiency: totalHours > 0 ? totalEarned / totalHours : 0,
            productivity: totalPrestations / Math.max(1, Math.floor(totalHours / 40)) // Prestations par semaine supposée
          };
        });

      // 2. ANALYSE DES CAMPUS
      const campusAnalysis = campuses.map(campus => {
        const campusInvoices = invoices.filter(i => i.campus_id === campus.id);
        const campusLines = invoiceLines.filter(line => line.campus_id === campus.id);
        const campusProfessors = personnel.filter(p => 
          p.campus_id === campus.id && p.role === 'ENSEIGNANT'
        );

        const totalRevenue = campusInvoices
          .filter(i => i.status === 'validated')
          .reduce((sum, i) => sum + (i.total_amount || 0), 0);

        const totalHours = campusLines.reduce((sum, line) => 
          sum + (line.quantite_heures || 0), 0);

        const totalPrestations = campusLines.length;
        const professorCount = campusProfessors.length;

        // Calculer les KPI de performance
        const averageHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;
        const revenuePerProfessor = professorCount > 0 ? totalRevenue / professorCount : 0;
        const hoursPerProfessor = professorCount > 0 ? totalHours / professorCount : 0;
        const prestationsPerProfessor = professorCount > 0 ? totalPrestations / professorCount : 0;

        // Calculer la diversité des prestations
        const uniquePrestations = [...new Set(campusLines.map(line => line.intitule))].length;
        const diversityIndex = totalPrestations > 0 ? uniquePrestations / totalPrestations : 0;

        // Calculer la croissance (comparaison mois précédent)
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const currentMonthRevenue = campusInvoices
          .filter(i => i.status === 'validated' && new Date(i.created_at) >= currentMonth)
          .reduce((sum, i) => sum + (i.total_amount || 0), 0);

        const lastMonthRevenue = campusInvoices
          .filter(i => i.status === 'validated' && 
            new Date(i.created_at) >= lastMonth && 
            new Date(i.created_at) < currentMonth)
          .reduce((sum, i) => sum + (i.total_amount || 0), 0);

        const growthRate = lastMonthRevenue > 0 ? 
          ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

        return {
          id: campus.id,
          name: campus.name,
          totalRevenue,
          totalHours,
          totalPrestations,
          professorCount,
          averageHourlyRate,
          revenuePerProfessor,
          hoursPerProfessor,
          prestationsPerProfessor,
          diversityIndex,
          growthRate,
          efficiency: professorCount > 0 ? totalRevenue / professorCount : 0,
          utilization: totalHours / Math.max(1, professorCount * 160) // 160h/mois supposées
        };
      });

      // 3. ANALYSE GLOBALE
      const totalSystemRevenue = invoices
        .filter(i => i.status === 'validated')
        .reduce((sum, i) => sum + (i.total_amount || 0), 0);

      const totalSystemHours = invoiceLines.reduce((sum, line) => 
        sum + (line.quantite_heures || 0), 0);

      const totalProfessors = personnel.filter(p => p.role === 'ENSEIGNANT').length;
      const totalPrestations = invoiceLines.length;

      const systemAverageHourlyRate = totalSystemHours > 0 ? totalSystemRevenue / totalSystemHours : 0;
      const systemRevenuePerProfessor = totalProfessors > 0 ? totalSystemRevenue / totalProfessors : 0;

      // 4. TOP PERFORMERS
      const topProfessorsByRevenue = [...professorAnalysis]
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, 5);

      const topProfessorsByEfficiency = [...professorAnalysis]
        .sort((a, b) => b.efficiency - a.efficiency)
        .slice(0, 5);

      const topProfessorsByProductivity = [...professorAnalysis]
        .sort((a, b) => b.productivity - a.productivity)
        .slice(0, 5);

      const topCampusesByRevenue = [...campusAnalysis]
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

      const topCampusesByEfficiency = [...campusAnalysis]
        .sort((a, b) => b.efficiency - a.efficiency)
        .slice(0, 5);

      return {
        professorAnalysis,
        campusAnalysis,
        globalMetrics: {
          totalSystemRevenue,
          totalSystemHours,
          totalProfessors,
          totalPrestations,
          systemAverageHourlyRate,
          systemRevenuePerProfessor
        },
        topPerformers: {
          professorsByRevenue: topProfessorsByRevenue,
          professorsByEfficiency: topProfessorsByEfficiency,
          professorsByProductivity: topProfessorsByProductivity,
          campusesByRevenue: topCampusesByRevenue,
          campusesByEfficiency: topCampusesByEfficiency
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}
