import React, { useState } from 'react';
import { DollarSign, CheckCircle, Eye, Calendar, Building2, User, Euro, Filter, Search, CreditCard, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useInvoicesWithBanking } from '../hooks/useInvoicesWithBanking';
import { useMarkInvoicePaid } from '../hooks/useInvoices';
import { formatAmount, formatDate } from '../lib/utils';

export default function PaymentsPage() {
  const { profile } = useAuth();
  const { data: invoices = [], isLoading } = useInvoicesWithBanking();
  const markPaidMutation = useMarkInvoicePaid();
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [campusFilter, setCampusFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('validated');

  if (!profile || !['SUPER_ADMIN', 'COMPTABLE'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="brutal-card text-center">
          <DollarSign className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-medium text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground font-ui">Seuls les administrateurs et comptables peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filtrer les factures validées (prêtes pour paiement)
  const validatedInvoices = invoices.filter(invoice => invoice.status === 'validated');
  const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
  
  // Filtrage avancé
  const filteredInvoices = (statusFilter === 'validated' ? validatedInvoices : paidInvoices).filter(invoice => {
    const matchesSearch = invoice.enseignant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.enseignant_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCampus = campusFilter === 'all' || invoice.campus?.id === campusFilter;
    
    return matchesSearch && matchesCampus;
  });

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      await markPaidMutation.mutateAsync({ invoiceId, paymentDate });
      setSelectedInvoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
    } catch (error) {
      console.error('Erreur paiement:', error);
    }
  };

  const handleBulkPayment = async () => {
    const promises = Array.from(selectedInvoices).map(invoiceId => 
      markPaidMutation.mutateAsync({ invoiceId, paymentDate })
    );
    
    try {
      await Promise.all(promises);
      setSelectedInvoices(new Set());
    } catch (error) {
      console.error('Erreur paiement en lot:', error);
    }
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const totalValidatedAmount = validatedInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  const totalPaidAmount = paidInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  const totalFilteredAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-brutal flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-medium text-foreground">Gestion des Paiements</h1>
              <p className="text-muted-foreground font-ui mt-1">
                {statusFilter === 'validated' ? 'Factures à payer' : 'Historique des paiements'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {statusFilter === 'validated' && (
              <button
                onClick={handleBulkPayment}
                disabled={selectedInvoices.size === 0}
                className="brutal-button-primary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Marquer comme payé ({selectedInvoices.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">À payer</p>
              <p className="text-2xl font-serif font-medium text-foreground">{validatedInvoices.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">Montant à payer</p>
              <p className="text-2xl font-serif font-medium text-foreground">{formatAmount(totalValidatedAmount)}</p>
            </div>
            <Euro className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">Payées</p>
              <p className="text-2xl font-serif font-medium text-foreground">{paidInvoices.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">Total payé</p>
              <p className="text-2xl font-serif font-medium text-foreground">{formatAmount(totalPaidAmount)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="brutal-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-grow">
            <label htmlFor="search" className="sr-only">Rechercher</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                id="search"
                name="search"
                className="brutal-input pl-10"
                placeholder="Rechercher par professeur..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="brutal-input w-auto"
            >
              <option value="all">Tous les campus</option>
              {/* TODO: Add campus options */}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="brutal-input w-auto"
            >
              <option value="validated">À payer</option>
              <option value="paid">Payées</option>
            </select>
          </div>

          {statusFilter === 'validated' && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="brutal-input w-auto"
              />
            </div>
          )}
        </div>
      </div>

      {/* Liste des factures */}
      <div className="brutal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                {statusFilter === 'validated' && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="focus:ring-primary h-4 w-4 text-primary border-border rounded"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(new Set(filteredInvoices.map(i => i.id)));
                        } else {
                          setSelectedInvoices(new Set());
                        }
                      }}
                      checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                      disabled={filteredInvoices.length === 0}
                    />
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Professeur
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Campus
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Montant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Statut
                </th>
                {statusFilter === 'paid' && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                    Date paiement
                  </th>
                )}
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-accent transition-colors duration-200">
                  {statusFilter === 'validated' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="focus:ring-primary h-4 w-4 text-primary border-border rounded"
                        checked={selectedInvoices.has(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-secondary rounded-brutal flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-ui font-medium text-foreground">
                          {invoice.enseignant_name}
                        </div>
                        <div className="text-sm text-muted-foreground font-ui">
                          {invoice.enseignant_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 text-muted-foreground mr-2" />
                      <span className="text-sm font-ui text-foreground">
                        {invoice.campus_name || 'Non assigné'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-ui">
                    {formatDate(invoice.created_at, 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-ui font-medium text-foreground">
                      {formatAmount(invoice.total_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`brutal-badge text-xs ${
                      invoice.status === 'validated' ? 'brutal-badge-info' : 'brutal-badge-success'
                    }`}>
                      {invoice.status === 'validated' ? 'À payer' : 'Payé'}
                    </span>
                  </td>
                  {statusFilter === 'paid' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-ui">
                      {invoice.payment_date ? formatDate(invoice.payment_date, 'dd/MM/yyyy') : '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="brutal-button-secondary p-2"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {statusFilter === 'validated' && (
                        <button
                          onClick={() => handleMarkPaid(invoice.id)}
                          className="brutal-button-primary p-2"
                          title="Marquer comme payé"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-serif font-medium text-foreground mb-2">
              {statusFilter === 'validated' ? 'Aucune facture à payer' : 'Aucun paiement effectué'}
            </h3>
            <p className="text-muted-foreground font-ui">
              {statusFilter === 'validated' 
                ? 'Toutes les factures validées ont été payées.' 
                : 'Aucun paiement n\'a encore été enregistré.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}