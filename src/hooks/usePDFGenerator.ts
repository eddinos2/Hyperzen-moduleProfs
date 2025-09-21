import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { formatDate, formatAmount } from '../lib/utils';

interface InvoicePDFData {
  invoice: any;
  lines: any[];
  profile: any;
}

export function usePDFGenerator() {
  return useMutation({
    mutationFn: async ({ invoice, lines, profile }: InvoicePDFData) => {
      // Générer le contenu HTML pour le PDF
      const htmlContent = generateInvoiceHTML(invoice, lines, profile);
      
      // Créer un blob avec le contenu HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Ouvrir dans une nouvelle fenêtre pour impression
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            URL.revokeObjectURL(url);
          }, 500);
        };
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('PDF généré avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur génération PDF: ${(error as Error).message}`);
    },
  });
}

function generateInvoiceHTML(invoice: any, lines: any[], profile: any): string {
  const totalAmount = lines.reduce((sum, line) => sum + line.total_ttc, 0);
  const totalHours = lines.reduce((sum, line) => sum + line.quantite_heures, 0);
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoice.id.slice(0, 8)} - ${invoice.profiles?.first_name} ${invoice.profiles?.last_name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        .company-info h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .company-info p {
            margin: 2px 0;
            color: #666;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-info h2 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 20px;
        }
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .section h3 {
            color: #374151;
            margin: 0 0 10px 0;
            font-size: 16px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .section p {
            margin: 5px 0;
        }
        .prestations-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .prestations-table th,
        .prestations-table td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: left;
        }
        .prestations-table th {
            background-color: #f9fafb;
            font-weight: bold;
            color: #374151;
        }
        .prestations-table tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .summary {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 30px;
            margin-top: 30px;
        }
        .summary-table {
            margin-left: auto;
            min-width: 300px;
        }
        .summary-table tr td {
            padding: 8px;
            border: none;
        }
        .summary-table tr:last-child td {
            border-top: 2px solid #2563eb;
            font-weight: bold;
            font-size: 16px;
        }
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status.pending { background-color: #fef3c7; color: #92400e; }
        .status.prevalidated { background-color: #dbeafe; color: #1e40af; }
        .status.validated { background-color: #d1fae5; color: #065f46; }
        .status.paid { background-color: #ecfdf5; color: #047857; }
        .status.rejected { background-color: #fee2e2; color: #991b1b; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <h1>AURLOM PREPA SARL</h1>
            <p>48 rue de la Roquette, 75011 Paris</p>
            <p>Tél: 01 44 82 65 67</p>
            <p>Email: info@aurlom.com</p>
            <p>SIRET: 123 456 789 00012</p>
        </div>
        <div class="invoice-info">
            <h2>FACTURE</h2>
            <p><strong>N° ${invoice.id.slice(0, 8).toUpperCase()}</strong></p>
            <p>Date: ${formatDate(invoice.created_at, 'dd/MM/yyyy')}</p>
            <p>Statut: <span class="status ${invoice.status}">${getStatusLabel(invoice.status)}</span></p>
        </div>
    </div>

    <div class="invoice-details">
        <div class="section">
            <h3>Professeur</h3>
            <p><strong>${invoice.profiles?.first_name} ${invoice.profiles?.last_name}</strong></p>
            <p>${invoice.profiles?.email}</p>
            <p>Rôle: ${getRoleLabel(invoice.profiles?.role)}</p>
        </div>
        <div class="section">
            <h3>Campus et Période</h3>
            <p><strong>Campus ${invoice.campus?.name}</strong></p>
            <p>${invoice.campus?.address}</p>
            <p>Période: <strong>${formatMonthYear(invoice.month_year)}</strong></p>
        </div>
    </div>

    <table class="prestations-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Horaires</th>
                <th>Filière/Classe</th>
                <th>Intitulé du cours</th>
                <th>Heures</th>
                <th>Prix unitaire</th>
                <th>Total TTC</th>
            </tr>
        </thead>
        <tbody>
            ${lines.map(line => `
                <tr>
                    <td>${formatDate(line.date_cours, 'dd/MM/yyyy')}</td>
                    <td>${line.heure_debut} - ${line.heure_fin}</td>
                    <td>${line.filiere}<br><small>${line.classe}</small></td>
                    <td>${line.intitule}${line.retard ? '<br><small style="color: #dc2626;">⚠ Retard</small>' : ''}</td>
                    <td>${line.quantite_heures}h</td>
                    <td>${formatAmount(line.prix_unitaire)}</td>
                    <td><strong>${formatAmount(line.total_ttc)}</strong></td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="summary">
        <div>
            ${invoice.status === 'paid' && invoice.payment_date ? `
                <div class="section">
                    <h3>Informations de paiement</h3>
                    <p>Date de paiement: <strong>${formatDate(invoice.payment_date, 'dd/MM/yyyy')}</strong></p>
                    <p>Payé par: ${invoice.paid_profile?.first_name} ${invoice.paid_profile?.last_name}</p>
                </div>
            ` : ''}
        </div>
        <table class="summary-table">
            <tr>
                <td>Nombre de prestations:</td>
                <td><strong>${lines.length}</strong></td>
            </tr>
            <tr>
                <td>Total heures:</td>
                <td><strong>${totalHours.toFixed(1)}h</strong></td>
            </tr>
            <tr>
                <td>Taux horaire moyen:</td>
                <td><strong>${formatAmount(totalAmount / totalHours)}</strong></td>
            </tr>
            <tr>
                <td><strong>TOTAL TTC:</strong></td>
                <td><strong>${formatAmount(totalAmount)}</strong></td>
            </tr>
        </table>
    </div>

    ${invoice.prevalidated_at || invoice.validated_at ? `
        <div class="section" style="margin-top: 30px;">
            <h3>Historique de validation</h3>
            ${invoice.prevalidated_at ? `
                <p>✓ Prévalidée le ${formatDate(invoice.prevalidated_at, 'dd/MM/yyyy à HH:mm')} 
                   ${invoice.prevalidated_profile ? `par ${invoice.prevalidated_profile.first_name} ${invoice.prevalidated_profile.last_name}` : ''}</p>
            ` : ''}
            ${invoice.validated_at ? `
                <p>✓ Validée le ${formatDate(invoice.validated_at, 'dd/MM/yyyy à HH:mm')} 
                   ${invoice.validated_profile ? `par ${invoice.validated_profile.first_name} ${invoice.validated_profile.last_name}` : ''}</p>
            ` : ''}
        </div>
    ` : ''}

    <div class="footer">
        <p>Document généré automatiquement le ${formatDate(new Date(), 'dd/MM/yyyy à HH:mm')}</p>
        <p>AURLOM PREPA SARL - SIRET: 123 456 789 00012 - APE: 8559A</p>
    </div>
</body>
</html>
  `;
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