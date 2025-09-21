import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2, 
  User, 
  Euro, 
  Calendar,
  BookOpen,
  Users,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useInvoiceLines, usePrevalidateInvoice } from '../hooks/useInvoices';
import { formatAmount, formatDate } from '../lib/utils';
import { debugLogger } from '../lib/debug';

interface InvoiceLine {
  id: string;
  date_cours: string;
  heure_debut: string;
  heure_fin: string;
  campus: string;
  filiere: string;
  classe: string;
  intitule: string;
  retard: boolean;
  quantite_heures: number;
  prix_unitaire: number;
  total_ttc: number;
  status: string;
}

export default function InvoiceDetailPrevalidation() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: lines = [], isLoading } = useInvoiceLines(invoiceId!);
  const prevalidateMutation = usePrevalidateInvoice();
  
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [showOnlyMyCampus, setShowOnlyMyCampus] = useState(true);

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

  // Filtrer les lignes selon le campus du directeur
  const filteredLines = showOnlyMyCampus 
    ? lines.filter(line => line.campus === profile.campus?.name)
    : lines;

  // Grouper les lignes par campus
  const linesByCampus = lines.reduce((acc, line) => {
    if (!acc[line.campus]) {
      acc[line.campus] = [];
    }
    acc[line.campus].push(line);
    return acc;
  }, {} as Record<string, InvoiceLine[]>);

  const handleLineSelect = (lineId: string) => {
    setSelectedLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineId)) {
        newSet.delete(lineId);
      } else {
        newSet.add(lineId);
      }
      return newSet;
    });
  };

  const handleSelectAllMyCampus = () => {
    const myCampusLines = filteredLines
      .filter(line => line.status === 'pending')
      .map(line => line.id);
    
    setSelectedLines(new Set(myCampusLines));
  };

  const handleDeselectAll = () => {
    setSelectedLines(new Set());
  };

  const handlePrevalidateSelected = async () => {
    if (selectedLines.size === 0) return;

    try {
      await prevalidateMutation.mutateAsync({
        invoiceId: invoiceId!,
        lineIds: Array.from(selectedLines)
      });
      
      setSelectedLines(new Set());
      debugLogger.info('PREVALIDATION', 'Lignes prévalidées', { 
        count: selectedLines.size,
        lines: Array.from(selectedLines)
      });
    } catch (error) {
      console.error('Erreur prévalidation:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'prevalidated':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'validated':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'prevalidated':
        return 'Prévalidé';
      case 'validated':
        return 'Validé';
      case 'rejected':
        return 'Rejeté';
      default:
        return 'En attente';
    }
  };

  const totalAmount = filteredLines.reduce((sum, line) => sum + line.total_ttc, 0);
  const selectedAmount = filteredLines
    .filter(line => selectedLines.has(line.id))
    .reduce((sum, line) => sum + line.total_ttc, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prévalidation de facture</h1>
              <p className="text-gray-600">Facture #{invoiceId?.slice(-8)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Montant total</p>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showOnlyMyCampus}
                onChange={(e) => setShowOnlyMyCampus(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Afficher seulement mon campus ({profile.campus?.name})
              </span>
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSelectAllMyCampus}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Sélectionner tout mon campus
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Désélectionner tout
            </button>
            <button
              onClick={handlePrevalidateSelected}
              disabled={selectedLines.size === 0 || prevalidateMutation.isPending}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {prevalidateMutation.isPending ? 'Prévalidation...' : `Prévalider (${selectedLines.size})`}
            </button>
          </div>
        </div>
        
        {selectedLines.size > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {selectedLines.size} ligne(s) sélectionnée(s)
                </span>
              </div>
              <span className="text-sm font-bold text-green-800">
                {formatAmount(selectedAmount)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lignes par campus */}
      <div className="space-y-6">
        {Object.entries(linesByCampus).map(([campus, campusLines]) => (
          <div key={campus} className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{campus}</h3>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    {campusLines.length} ligne(s)
                  </span>
                </div>
                {campus === profile.campus?.name && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    Votre campus
                  </span>
                )}
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {campusLines.map((line) => (
                <div
                  key={line.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    selectedLines.has(line.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedLines.has(line.id)}
                        onChange={() => handleLineSelect(line.id)}
                        disabled={line.status !== 'pending'}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatDate(line.date_cours, 'dd/MM/yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {line.heure_debut} - {line.heure_fin}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {line.filiere} - {line.classe}
                            </span>
                          </div>
                        </div>
                        
                        <h4 className="mt-2 text-lg font-medium text-gray-900">
                          {line.intitule}
                        </h4>
                        
                        <div className="mt-2 flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{line.filiere}</span>
                          </div>
                          {line.retard && (
                            <div className="flex items-center space-x-1">
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              <span className="text-sm text-orange-600">Retard</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(line.status)}
                          <span className="text-sm font-medium text-gray-700">
                            {getStatusText(line.status)}
                          </span>
                        </div>
                        <div className="mt-1 text-lg font-bold text-gray-900">
                          {formatAmount(line.total_ttc)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {line.quantite_heures}h × {formatAmount(line.prix_unitaire)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
