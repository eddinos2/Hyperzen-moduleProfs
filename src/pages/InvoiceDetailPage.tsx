import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building2, 
  Calendar,
  Euro,
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { usePrevalidateInvoice, useValidateInvoice, useMarkInvoicePaid, useRejectInvoice } from '../hooks/useInvoices';
import { usePrevalidateInvoiceLine, useRejectInvoiceLine } from '../hooks/useInvoiceLines';
import { usePDFGenerator } from '../hooks/usePDFGenerator';
import { PDFGenerator } from '../components/PDFGenerator';
import { PrevalidateLineModal } from '../components/PrevalidateLineModal';
import { formatAmount, formatDate, getStatusColor, getStatusLabel } from '../lib/utils';

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showPrevalidateModal, setShowPrevalidateModal] = useState(false);
  const [showRejectLineModal, setShowRejectLineModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState<any>(null);

  const prevalidateMutation = usePrevalidateInvoice();
  const validateMutation = useValidateInvoice();
  const markPaidMutation = useMarkInvoicePaid();
  const rejectMutation = useRejectInvoice();
  const pdfMutation = usePDFGenerator();
  const prevalidateLineMutation = usePrevalidateInvoiceLine();
  const rejectLineMutation = useRejectInvoiceLine();

  // Récupérer la facture avec toutes ses relations
  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          profiles:enseignant_id(first_name, last_name, email, role),
          campus:campus_id(name, address),
          prevalidated_profile:profiles!invoices_prevalidated_by_fkey(first_name, last_name),
          validated_profile:profiles!invoices_validated_by_fkey(first_name, last_name),
          paid_profile:profiles!invoices_paid_by_fkey(first_name, last_name)
        `)
        .eq('id', invoiceId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });

  // Récupérer les lignes de facture avec les relations
      const { data: lines = [], isLoading: linesLoading } = useQuery({
        queryKey: ['invoice-lines', invoiceId],
        queryFn: async () => {
          if (!invoiceId) return [];
          
          const { data, error } = await supabase
            .from('invoice_lines')
            .select(`
              *,
              campus_info:campus!campus_id(name),
              submitted_by_info:profiles!submitted_by(first_name, last_name),
              prevalidated_by_info:profiles!prevalidated_by(first_name, last_name)
            `)
            .eq('invoice_id', invoiceId)
            .order('date_cours', { ascending: true });
            
          if (error) throw error;
          
          // Trier les lignes : d'abord celles du campus du directeur, puis les autres
          if (data && profile?.role === 'DIRECTEUR_CAMPUS') {
            const myCampusLines = data.filter(line => line.campus_id === profile.campus_id);
            const otherCampusLines = data.filter(line => line.campus_id !== profile.campus_id);
            return [...myCampusLines, ...otherCampusLines];
          }
          
          return data || [];
        },
        enabled: !!invoiceId,
      });

  if (invoiceLoading || linesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Facture non trouvée</h3>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-500"
        >
          Retour
        </button>
      </div>
    );
  }

  // Calculer les totaux depuis les lignes
  const totalAmount = lines.reduce((sum, line) => sum + line.total_ttc, 0);
  const totalHours = lines.reduce((sum, line) => sum + line.quantite_heures, 0);

  const toggleLineSelection = (lineId: string) => {
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

  // Permissions
  const canEdit = profile?.role === 'ENSEIGNANT' && invoice.status === 'pending' && invoice.enseignant_id === profile.id;
  const canPrevalidate = profile?.role === 'DIRECTEUR_CAMPUS' && invoice.status === 'pending' && invoice.campus_id === profile.campus_id;
  const canValidate = ['SUPER_ADMIN', 'COMPTABLE'].includes(profile?.role || '') && invoice.status === 'prevalidated';
  const canMarkPaid = ['SUPER_ADMIN', 'COMPTABLE'].includes(profile?.role || '') && invoice.status === 'validated';
  const canReject = (
    (profile?.role === 'DIRECTEUR_CAMPUS' && invoice.campus_id === profile.campus_id && invoice.status === 'pending') ||
    (['SUPER_ADMIN', 'COMPTABLE'].includes(profile?.role || '') && ['pending', 'prevalidated'].includes(invoice.status))
  );

  const handlePrevalidate = async () => {
    const lineIds = selectedLines.size > 0 ? Array.from(selectedLines) : undefined;
    await prevalidateMutation.mutateAsync({ invoiceId: invoice.id, lineIds });
  };

  const handleValidate = async () => {
    await validateMutation.mutateAsync(invoice.id);
  };

  const handleMarkPaid = async () => {
    const paymentDate = new Date().toISOString().split('T')[0];
    await markPaidMutation.mutateAsync({ invoiceId: invoice.id, paymentDate });
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await rejectMutation.mutateAsync({ invoiceId: invoice.id, reason: rejectReason });
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleGeneratePDF = async () => {
    await pdfMutation.mutateAsync({ invoice, lines, profile });
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Détail de la facture</h1>
                <p className="text-gray-600">
                  {formatMonthYear(invoice.month_year)} • {lines.length} prestation{lines.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
              {getStatusLabel(invoice.status)}
            </span>
            <button 
              onClick={handleGeneratePDF}
              disabled={pdfMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {pdfMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Génération...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Professor Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations professeur</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Professeur</p>
                  <p className="font-medium text-gray-900">
                    {invoice.profiles?.first_name} {invoice.profiles?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{invoice.profiles?.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Campus</p>
                  <p className="font-medium text-gray-900">{invoice.campus?.name}</p>
                  <p className="text-sm text-gray-500">{invoice.campus?.address}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Période</p>
                  <p className="font-medium text-gray-900">{formatMonthYear(invoice.month_year)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Soumis le</p>
                  <p className="font-medium text-gray-900">{formatDate(invoice.created_at, 'dd MMM yyyy')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Lines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Détail des prestations</h3>
              {canEdit && (
                <button className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {(canPrevalidate || canEdit) && (
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedLines.size === lines.length && lines.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLines(new Set(lines.map(line => line.id)));
                            } else {
                              setSelectedLines(new Set());
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horaires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Heures
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix unitaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prévalidé par
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observations
                    </th>
                    {canEdit && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lines.map((line, index) => {
                    // Vérifier si c'est la première ligne d'un autre campus pour ajouter une séparation
                    const isFirstOtherCampusLine = profile?.role === 'DIRECTEUR_CAMPUS' && 
                      line.campus_id !== profile.campus_id && 
                      index > 0 && 
                      lines[index - 1].campus_id === profile.campus_id;
                    
                    return (
                      <>
                        {isFirstOtherCampusLine && (
                          <tr>
                            <td colSpan={8} className="px-6 py-2 bg-gray-50 border-t-2 border-gray-200">
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Lignes d'autres campus (non disponibles pour prévalidation)
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr key={line.id} className={`hover:bg-gray-50 ${
                          profile?.role === 'DIRECTEUR_CAMPUS' && line.campus_id === profile.campus_id 
                            ? 'bg-green-50 border-l-4 border-l-green-500' 
                            : ''
                        }`}>
                      {(canPrevalidate || canEdit) && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedLines.has(line.id)}
                            onChange={() => toggleLineSelection(line.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(line.date_cours, 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {line.heure_debut} - {line.heure_fin}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{line.intitule}</div>
                          <div className="text-gray-500">{line.filiere} - {line.classe}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {line.quantite_heures}h
                        {line.retard && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Retard
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatAmount(line.prix_unitaire)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatAmount(line.total_ttc)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {line.campus_info?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {line.prevalidated_by_info ? (
                          <div className={`${
                            profile?.role === 'DIRECTEUR_CAMPUS' && line.prevalidated_by === profile.id
                              ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full'
                              : ''
                          }`}>
                            <div className="font-medium">
                              {line.prevalidated_by_info.first_name} {line.prevalidated_by_info.last_name}
                              {profile?.role === 'DIRECTEUR_CAMPUS' && line.prevalidated_by === profile.id && (
                                <span className="ml-2 text-xs">(Vous)</span>
                              )}
                            </div>
                            {line.prevalidated_at && (
                              <div className="text-xs text-gray-500">
                                {formatDate(line.prevalidated_at, 'dd/MM/yyyy')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Non prévalidé</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        {line.observations ? (
                          <div className={`truncate ${
                            profile?.role === 'DIRECTEUR_CAMPUS' && line.prevalidated_by === profile.id
                              ? 'bg-blue-50 text-blue-800 px-2 py-1 rounded'
                              : ''
                          }`} title={line.observations}>
                            {line.observations}
                            {profile?.role === 'DIRECTEUR_CAMPUS' && line.prevalidated_by === profile.id && (
                              <span className="ml-1 text-xs">📝</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Boutons pour les directeurs - prévalidation des lignes */}
                          {profile?.role === 'DIRECTEUR_CAMPUS' && !line.prevalidated_by && (
                            <>
                              {/* Vérifier si c'est une ligne du campus du directeur */}
                              {line.campus_id === profile.campus_id ? (
                                // Boutons actifs pour les lignes de son campus
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedLine(line);
                                      setShowPrevalidateModal(true);
                                    }}
                                    className="text-green-600 hover:text-green-900 p-1"
                                    title="Prévalider cette ligne"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedLine(line);
                                      setShowRejectLineModal(true);
                                    }}
                                    className="text-red-600 hover:text-red-900 p-1"
                                    title="Rejeter cette ligne"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                // Boutons désactivés pour les lignes d'autres campus
                                <>
                                  <button
                                    disabled
                                    className="text-gray-300 cursor-not-allowed p-1"
                                    title={`Vous ne pouvez prévalider que les lignes de votre campus (${profile.campus?.name || 'votre campus'})`}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    disabled
                                    className="text-gray-300 cursor-not-allowed p-1"
                                    title={`Vous ne pouvez rejeter que les lignes de votre campus (${profile.campus?.name || 'votre campus'})`}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          
                          {/* Boutons pour les autres rôles */}
                          {canEdit && profile?.role !== 'DIRECTEUR_CAMPUS' && (
                            <button className="text-red-600 hover:text-red-900 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PDF Generator */}
          <PDFGenerator
            invoice={invoice}
            lines={lines}
            onGenerate={handleGeneratePDF}
            isGenerating={pdfMutation.isPending}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Résumé</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre de prestations</span>
                <span className="font-medium">{lines.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total heures</span>
                <span className="font-medium">{totalHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taux horaire moyen</span>
                <span className="font-medium">{formatAmount(totalAmount / totalHours)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-medium text-gray-900">Total TTC</span>
                  <span className="text-lg font-bold text-gray-900">{formatAmount(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {canPrevalidate && (
                <button
                  onClick={handlePrevalidate}
                  disabled={prevalidateMutation.isPending}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {selectedLines.size > 0 ? `Prévalider ${selectedLines.size} ligne(s)` : 'Prévalider tout'}
                </button>
              )}
              {canValidate && (
                <button
                  onClick={handleValidate}
                  disabled={validateMutation.isPending}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider la facture
                </button>
              )}
              {canMarkPaid && (
                <button
                  onClick={handleMarkPaid}
                  disabled={markPaidMutation.isPending}
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Euro className="w-4 h-4 mr-2" />
                  Marquer payé
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter
                </button>
              )}
            </div>
          </div>

          {/* Workflow History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Historique</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Facture créée</p>
                  <p className="text-xs text-gray-500">{formatDate(invoice.created_at, 'dd MMM yyyy HH:mm')}</p>
                  <p className="text-xs text-gray-400">par {invoice.profiles?.first_name} {invoice.profiles?.last_name}</p>
                </div>
              </div>
              {invoice.prevalidated_at && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Prévalidée</p>
                    <p className="text-xs text-gray-500">{formatDate(invoice.prevalidated_at, 'dd MMM yyyy HH:mm')}</p>
                    {invoice.prevalidated_profile && (
                      <p className="text-xs text-gray-400">par {invoice.prevalidated_profile.first_name} {invoice.prevalidated_profile.last_name}</p>
                    )}
                  </div>
                </div>
              )}
              {invoice.validated_at && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Validée</p>
                    <p className="text-xs text-gray-500">{formatDate(invoice.validated_at, 'dd MMM yyyy HH:mm')}</p>
                    {invoice.validated_profile && (
                      <p className="text-xs text-gray-400">par {invoice.validated_profile.first_name} {invoice.validated_profile.last_name}</p>
                    )}
                  </div>
                </div>
              )}
              {invoice.payment_date && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Payée</p>
                    <p className="text-xs text-gray-500">{formatDate(invoice.payment_date, 'dd MMM yyyy HH:mm')}</p>
                    {invoice.paid_profile && (
                      <p className="text-xs text-gray-400">par {invoice.paid_profile.first_name} {invoice.paid_profile.last_name}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Rejeter la facture</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du rejet
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Expliquez pourquoi cette facture est rejetée..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de prévalidation de ligne */}
      <PrevalidateLineModal
        isOpen={showPrevalidateModal}
        onClose={() => {
          setShowPrevalidateModal(false);
          setSelectedLine(null);
        }}
        onConfirm={async (observations) => {
          if (selectedLine) {
            await prevalidateLineMutation.mutateAsync({
              lineId: selectedLine.id,
              observations
            });
            setShowPrevalidateModal(false);
            setSelectedLine(null);
          }
        }}
        mode="prevalidate"
        lineData={selectedLine}
        isLoading={prevalidateLineMutation.isPending}
      />

      {/* Modal de rejet de ligne */}
      <PrevalidateLineModal
        isOpen={showRejectLineModal}
        onClose={() => {
          setShowRejectLineModal(false);
          setSelectedLine(null);
        }}
        onConfirm={async (observations) => {
          if (selectedLine) {
            await rejectLineMutation.mutateAsync({
              lineId: selectedLine.id,
              observations
            });
            setShowRejectLineModal(false);
            setSelectedLine(null);
          }
        }}
        mode="reject"
        lineData={selectedLine}
        isLoading={rejectLineMutation.isPending}
      />
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