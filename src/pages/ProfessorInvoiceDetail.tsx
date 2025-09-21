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
  AlertCircle,
  Eye,
  FileText,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useInvoiceLines } from '../hooks/useInvoices';
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

export default function ProfessorInvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: lines = [], isLoading } = useInvoiceLines(invoiceId!);
  
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  if (!profile || profile.role !== 'ENSEIGNANT') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600">Seuls les professeurs peuvent accéder à cette page.</p>
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

  // Filtrer les lignes selon le statut
  const filteredLines = showOnlyPending 
    ? lines.filter(line => line.status === 'pending')
    : lines;

  // Grouper les lignes par statut
  const linesByStatus = lines.reduce((acc, line) => {
    if (!acc[line.status]) {
      acc[line.status] = [];
    }
    acc[line.status].push(line);
    return acc;
  }, {} as Record<string, InvoiceLine[]>);

  // Grouper les lignes par campus
  const linesByCampus = lines.reduce((acc, line) => {
    if (!acc[line.campus]) {
      acc[line.campus] = [];
    }
    acc[line.campus].push(line);
    return acc;
  }, {} as Record<string, InvoiceLine[]>);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'prevalidated':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'validated':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'paid':
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'prevalidated':
        return 'Prévalidé par le directeur';
      case 'validated':
        return 'Validé par la comptabilité';
      case 'paid':
        return 'Payé';
      case 'rejected':
        return 'Rejeté';
      default:
        return 'En attente de prévalidation';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prevalidated':
        return 'bg-green-100 text-green-800';
      case 'validated':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const totalAmount = lines.reduce((sum, line) => sum + line.total_ttc, 0);
  const pendingAmount = lines
    .filter(line => line.status === 'pending')
    .reduce((sum, line) => sum + line.total_ttc, 0);
  const prevalidatedAmount = lines
    .filter(line => line.status === 'prevalidated')
    .reduce((sum, line) => sum + line.total_ttc, 0);
  const validatedAmount = lines
    .filter(line => line.status === 'validated')
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
              <h1 className="text-2xl font-bold text-gray-900">Détail de ma facture</h1>
              <p className="text-gray-600">Facture #{invoiceId?.slice(-8)}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">Montant total</p>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Statistiques de statut */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {linesByStatus.pending?.length || 0}
              </p>
              <p className="text-sm text-gray-500">{formatAmount(pendingAmount)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Prévalidé</p>
              <p className="text-2xl font-bold text-gray-900">
                {linesByStatus.prevalidated?.length || 0}
              </p>
              <p className="text-sm text-gray-500">{formatAmount(prevalidatedAmount)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Validé</p>
              <p className="text-2xl font-bold text-gray-900">
                {linesByStatus.validated?.length || 0}
              </p>
              <p className="text-sm text-gray-500">{formatAmount(validatedAmount)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Payé</p>
              <p className="text-2xl font-bold text-gray-900">
                {linesByStatus.paid?.length || 0}
              </p>
              <p className="text-sm text-gray-500">
                {formatAmount(linesByStatus.paid?.reduce((sum, line) => sum + line.total_ttc, 0) || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showOnlyPending}
                onChange={(e) => setShowOnlyPending(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Afficher seulement les lignes en attente
              </span>
            </label>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredLines.length} ligne(s) sur {lines.length}
          </div>
        </div>
      </div>

      {/* Lignes par campus */}
      <div className="space-y-6">
        {Object.entries(linesByCampus).map(([campus, campusLines]) => {
          const filteredCampusLines = showOnlyPending 
            ? campusLines.filter(line => line.status === 'pending')
            : campusLines;
            
          if (filteredCampusLines.length === 0) return null;
          
          return (
            <div key={campus} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{campus}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {filteredCampusLines.length} ligne(s)
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatAmount(filteredCampusLines.reduce((sum, line) => sum + line.total_ttc, 0))}
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredCampusLines.map((line) => (
                  <div key={line.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
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
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(line.status)}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(line.status)}`}>
                              {getStatusText(line.status)}
                            </span>
                          </div>
                          <div className="text-lg font-bold text-gray-900">
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
          );
        })}
      </div>
    </div>
  );
}
