import { useState } from 'react';
import { FileText, Eye, Download, Filter, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInvoicesWithBanking } from '../hooks/useInvoicesWithBanking';
import { usePDFGenerator } from '../hooks/usePDFGenerator';
import { formatAmount, formatDate, getStatusColor, getStatusLabel } from '../lib/utils';
import InvoiceBankingModal from '../components/InvoiceBankingModal';
import { supabase } from '../lib/supabase';

export function InvoiceList() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [showBankingModal, setShowBankingModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const { data: invoices = [], isLoading } = useInvoicesWithBanking();
  const pdfMutation = usePDFGenerator();

  const filteredInvoices = invoices
    .filter(invoice => statusFilter === 'all' || invoice.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'amount') {
        return b.total_amount - a.total_amount;
      }
      if (sortBy === 'month') {
        return b.month_year.localeCompare(a.month_year);
      }
      return 0;
    });

  const handleDownloadPDF = async (invoice: any) => {
    try {
      // Récupérer les lignes de la facture
      const { data: lines, error } = await supabase
        .from('invoice_lines')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('date_cours', { ascending: true });

      if (error) throw error;

      await pdfMutation.mutateAsync({ 
        invoice, 
        lines: lines || [], 
        profile: null 
      });
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
    }
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-serif font-medium text-foreground">Mes factures</h1>
              <p className="text-muted-foreground font-ui">
                {filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <a
            href="/import"
            className="brutal-button-primary inline-flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Nouvelle facture
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="brutal-card">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div>
              <label className="block text-sm font-ui font-medium text-foreground mb-1">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="brutal-input"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="prevalidated">Prévalidées</option>
                <option value="validated">Validées</option>
                <option value="paid">Payées</option>
                <option value="rejected">Rejetées</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-ui font-medium text-foreground mb-1">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="brutal-input"
              >
                <option value="created_at">Date de création</option>
                <option value="month">Mois</option>
                <option value="amount">Montant</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="brutal-card overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-serif font-medium text-foreground mb-2">Aucune facture</h3>
            <p className="text-muted-foreground font-ui mb-6">
              Vous n'avez pas encore de factures. Commencez par en importer une.
            </p>
            <a
              href="/import"
              className="brutal-button-primary inline-flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Importer une facture
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-ui font-medium text-secondary-foreground uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-ui font-medium text-secondary-foreground uppercase tracking-wider">
                    Campus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-ui font-medium text-secondary-foreground uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-ui font-medium text-secondary-foreground uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-ui font-medium text-secondary-foreground uppercase tracking-wider">
                    Date création
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-ui font-medium text-secondary-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-accent">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-ui font-medium text-foreground">
                        {formatMonthYear(invoice.month_year)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-ui text-foreground">
                        {invoice.campus?.name || 'Campus non défini'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-ui font-medium text-foreground">
                        {formatAmount(invoice.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`brutal-badge ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-ui text-muted-foreground">
                      {formatDate(invoice.created_at, 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-ui font-medium space-x-2">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="text-primary hover:text-primary/80 inline-flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Link>
                      <button
                        onClick={() => handleDownloadPDF(invoice)}
                        disabled={pdfMutation.isPending}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center"
                      >
                        {pdfMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground mr-1"></div>
                        ) : (
                          <Download className="w-4 h-4 mr-1" />
                        )}
                        PDF
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowBankingModal(true);
                        }}
                        className="text-green-600 hover:text-green-700 inline-flex items-center"
                        title="RIB et facture originale"
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        RIB
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal pour les informations bancaires */}
      {showBankingModal && selectedInvoice && (
        <InvoiceBankingModal
          isOpen={showBankingModal}
          onClose={() => {
            setShowBankingModal(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
}

function formatMonthYear(monthYear: string) {
  const [year, month] = monthYear.split('-');
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function downloadInvoice(invoiceId: string) {
  // TODO: Génération et téléchargement du PDF
  console.log('Download invoice:', invoiceId);
}