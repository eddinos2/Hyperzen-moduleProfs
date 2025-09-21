import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, Clock, Building2, User, Euro, Filter, Search, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useInvoicesWithBanking } from '../hooks/useInvoicesWithBanking';
import { useValidateInvoice } from '../hooks/useInvoices';
import { formatAmount, formatDate } from '../lib/utils';

export default function ValidationPage() {
  const { profile } = useAuth();
  const { data: invoices = [], isLoading } = useInvoicesWithBanking();
  const validateMutation = useValidateInvoice();
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [campusFilter, setCampusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  if (!profile || !['SUPER_ADMIN', 'COMPTABLE'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="brutal-card text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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

  // Filtrer les factures prévalidées
  const prevalidatedInvoices = invoices.filter(invoice => invoice.status === 'prevalidated');
  
  // Filtrage avancé
  const filteredInvoices = prevalidatedInvoices.filter(invoice => {
    const matchesSearch = invoice.enseignant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.enseignant_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCampus = campusFilter === 'all' || invoice.campus?.id === campusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const invoiceDate = new Date(invoice.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
      }
    }
    
    return matchesSearch && matchesCampus && matchesDate;
  });

  const handleValidate = async (invoiceId: string) => {
    try {
      await validateMutation.mutateAsync(invoiceId);
      setSelectedInvoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
    } catch (error) {
      console.error('Erreur validation:', error);
    }
  };

  const handleBulkValidate = async () => {
    const promises = Array.from(selectedInvoices).map(invoiceId => 
      validateMutation.mutateAsync(invoiceId)
    );
    
    try {
      await Promise.all(promises);
      setSelectedInvoices(new Set());
    } catch (error) {
      console.error('Erreur validation en lot:', error);
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

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-brutal flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-medium text-foreground">Validation des Factures</h1>
              <p className="text-muted-foreground font-ui mt-1">
                {filteredInvoices.length} factures en attente de validation
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleBulkValidate}
              disabled={selectedInvoices.size === 0}
              className="brutal-button-primary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Valider la sélection ({selectedInvoices.size})
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">Factures en attente</p>
              <p className="text-2xl font-serif font-medium text-foreground">{filteredInvoices.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">Montant total</p>
              <p className="text-2xl font-serif font-medium text-foreground">{formatAmount(totalAmount)}</p>
            </div>
            <Euro className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">Sélectionnées</p>
              <p className="text-2xl font-serif font-medium text-foreground">{selectedInvoices.size}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
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
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="brutal-input w-auto"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des factures */}
      <div className="brutal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
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
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-accent transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="focus:ring-primary h-4 w-4 text-primary border-border rounded"
                      checked={selectedInvoices.has(invoice.id)}
                      onChange={() => toggleInvoiceSelection(invoice.id)}
                    />
                  </td>
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
                    <span className="brutal-badge-warning text-xs">
                      Prévalidé
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="brutal-button-secondary p-2"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleValidate(invoice.id)}
                        className="brutal-button-primary p-2"
                        title="Valider la facture"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-serif font-medium text-foreground mb-2">
              Aucune facture en attente
            </h3>
            <p className="text-muted-foreground font-ui">
              Toutes les factures prévalidées ont été traitées.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}