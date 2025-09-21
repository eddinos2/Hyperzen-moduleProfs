import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, Clock, Building2, User, Euro, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useInvoices, usePrevalidateInvoice } from '../hooks/useInvoices';
import { formatAmount, formatDate } from '../lib/utils';

export default function PrevalidationPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: invoices = [], isLoading } = useInvoices();
  const prevalidateMutation = usePrevalidateInvoice();
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

  if (!profile || profile.role !== 'DIRECTEUR_CAMPUS') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600">Seuls les directeurs de campus peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filtrer les factures en attente pour ce campus
  const pendingInvoices = invoices.filter(invoice => 
    invoice.status === 'pending' && 
    invoice.campus_id === profile.campus_id
  );

  const handlePrevalidate = async (invoiceId: string) => {
    try {
      await prevalidateMutation.mutateAsync({ invoiceId });
      setSelectedInvoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
    } catch (error) {
      console.error('Erreur prévalidation:', error);
    }
  };

  const handleBulkPrevalidate = async () => {
    for (const invoiceId of selectedInvoices) {
      await handlePrevalidate(invoiceId);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prévalidation des factures</h1>
              <p className="text-gray-600">
                {pendingInvoices.length} facture{pendingInvoices.length > 1 ? 's' : ''} en attente de prévalidation
              </p>
            </div>
          </div>
          {selectedInvoices.size > 0 && (
            <button
              onClick={handleBulkPrevalidate}
              disabled={prevalidateMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Prévalider {selectedInvoices.size} facture{selectedInvoices.size > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{pendingInvoices.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Euro className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Montant total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(pendingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <User className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Professeurs</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(pendingInvoices.map(inv => inv.enseignant_id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {pendingInvoices.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune facture en attente</h3>
            <p className="text-gray-500">
              Toutes les factures de votre campus ont été prévalidées.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.size === pendingInvoices.length && pendingInvoices.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(new Set(pendingInvoices.map(inv => inv.id)));
                        } else {
                          setSelectedInvoices(new Set());
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Professeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heures
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date soumission
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingInvoices.map((invoice) => {
                  const hours = invoice.total_amount / 60;
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.has(invoice.id)}
                          onChange={() => toggleInvoiceSelection(invoice.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.profiles?.first_name} {invoice.profiles?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{invoice.profiles?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatMonthYear(invoice.month_year)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatAmount(invoice.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{hours.toFixed(1)}h</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.created_at, 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => navigate(`/prevalidation/${invoice.id}`)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Prévalider ligne par ligne
                        </button>
                        <button
                          onClick={() => handlePrevalidate(invoice.id)}
                          disabled={prevalidateMutation.isPending}
                          className="text-green-600 hover:text-green-900 inline-flex items-center disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Prévalider tout
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
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