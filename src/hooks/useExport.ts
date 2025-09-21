import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { formatAmount, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

export function useExportData() {
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ type, filters = {} }: { type: 'invoices' | 'personnel' | 'campus' | 'audit', filters?: any }) => {
      if (!profile) throw new Error('Non authentifié');

      let data: any[] = [];
      let filename = '';
      let headers: string[] = [];

      switch (type) {
        case 'invoices':
          const { data: invoicesData, error: invoicesError } = await supabase
            .from('invoices')
            .select(`
              *,
              profiles!invoices_enseignant_id_fkey(first_name, last_name, email),
              campus!invoices_campus_id_fkey(name),
              invoice_lines(*)
            `)
            .order('created_at', { ascending: false });

          if (invoicesError) throw invoicesError;

          data = (invoicesData || []).map(invoice => ({
            'Professeur': `${invoice.profiles?.first_name} ${invoice.profiles?.last_name}`,
            'Email': invoice.profiles?.email,
            'Campus': invoice.campus?.name,
            'Période': formatMonthYear(invoice.month_year),
            'Statut': getStatusLabel(invoice.status),
            'Montant': formatAmount(invoice.total_amount),
            'Heures': invoice.invoice_lines?.reduce((sum: number, line: any) => sum + line.quantite_heures, 0) || 0,
            'Prestations': invoice.invoice_lines?.length || 0,
            'Date création': formatDate(invoice.created_at, 'dd/MM/yyyy'),
            'Date prévalidation': invoice.prevalidated_at ? formatDate(invoice.prevalidated_at, 'dd/MM/yyyy') : '',
            'Date validation': invoice.validated_at ? formatDate(invoice.validated_at, 'dd/MM/yyyy') : '',
            'Date paiement': invoice.payment_date ? formatDate(invoice.payment_date, 'dd/MM/yyyy') : ''
          }));

          filename = `factures_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'personnel':
          const { data: personnelData, error: personnelError } = await supabase
            .from('profiles')
            .select('*, campus(name)')
            .order('created_at', { ascending: false });

          if (personnelError) throw personnelError;

          data = (personnelData || []).map(person => ({
            'Prénom': person.first_name,
            'Nom': person.last_name,
            'Email': person.email,
            'Rôle': getRoleLabel(person.role),
            'Campus': person.campus?.name || 'Non assigné',
            'Date création': formatDate(person.created_at, 'dd/MM/yyyy'),
            'Dernière modification': formatDate(person.updated_at, 'dd/MM/yyyy')
          }));

          filename = `personnel_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'campus':
          const { data: campusData, error: campusError } = await supabase
            .from('campus')
            .select(`
              *,
              profiles!campus_directeur_id_fkey(first_name, last_name, email)
            `)
            .order('name', { ascending: true });

          if (campusError) throw campusError;

          data = (campusData || []).map(campus => ({
            'Nom': campus.name,
            'Adresse': campus.address,
            'Directeur': campus.profiles ? `${campus.profiles.first_name} ${campus.profiles.last_name}` : 'Non assigné',
            'Email directeur': campus.profiles?.email || '',
            'Date création': formatDate(campus.created_at, 'dd/MM/yyyy')
          }));

          filename = `campus_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'audit':
          if (profile.role !== 'SUPER_ADMIN') {
            throw new Error('Accès refusé aux logs d\'audit');
          }

          const { data: auditData, error: auditError } = await supabase
            .from('audit_logs')
            .select(`
              *,
              profiles!audit_logs_actor_id_fkey(first_name, last_name, email, role)
            `)
            .order('created_at', { ascending: false })
            .limit(1000);

          if (auditError) throw auditError;

          data = (auditData || []).map(log => ({
            'Date': formatDate(log.created_at, 'dd/MM/yyyy HH:mm:ss'),
            'Utilisateur': log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : 'Système',
            'Email': log.profiles?.email || '',
            'Rôle': log.profiles?.role || '',
            'Action': getActionLabel(log.action),
            'Table': log.table_name,
            'Ancien statut': log.prev_status || '',
            'Nouveau statut': log.new_status || '',
            'Détails': log.details ? JSON.stringify(log.details) : ''
          }));

          filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        default:
          throw new Error('Type d\'export non supporté');
      }

      // Générer le CSV
      if (data.length === 0) {
        throw new Error('Aucune donnée à exporter');
      }

      const csvContent = generateCSV(data);
      downloadCSV(csvContent, filename);

      return { success: true, count: data.length, filename };
    },
    onSuccess: (result) => {
      toast.success(`Export réussi: ${result.count} lignes exportées`);
    },
    onError: (error) => {
      toast.error(`Erreur export: ${(error as Error).message}`);
    },
  });
}

function generateCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Échapper les guillemets et virgules
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

function formatMonthYear(monthYear: string) {
  const [year, month] = monthYear.split('-');
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    prevalidated: 'Prévalidée',
    validated: 'Validée',
    paid: 'Payée',
    rejected: 'Rejetée',
  };
  return labels[status] || status;
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ENSEIGNANT: 'Enseignant',
    DIRECTEUR_CAMPUS: 'Directeur de Campus',
    COMPTABLE: 'Comptable',
    SUPER_ADMIN: 'Super Administrateur',
  };
  return labels[role] || role;
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    created: 'Créé',
    updated: 'Modifié',
    prevalidated: 'Prévalidé',
    validated: 'Validé',
    paid: 'Payé',
    rejected: 'Rejeté',
    imported: 'Importé',
  };
  return labels[action] || action;
}