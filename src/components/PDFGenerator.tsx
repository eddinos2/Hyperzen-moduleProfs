import React from 'react';
import { Download, FileText, Building2, User, Calendar, Euro } from 'lucide-react';
import { formatAmount, formatDate } from '../lib/utils';

interface PDFGeneratorProps {
  invoice: any;
  lines: any[];
  onGenerate: () => void;
  isGenerating?: boolean;
}

export function PDFGenerator({ invoice, lines, onGenerate, isGenerating = false }: PDFGeneratorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Génération PDF</h3>
        </div>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {isGenerating ? 'Génération...' : 'Télécharger PDF'}
        </button>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="text-sm text-gray-600 mb-4">Aperçu du document :</div>
        
        {/* Header */}
        <div className="bg-white p-4 rounded border mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">AURLOM PREPA SARL</h2>
              <p className="text-sm text-gray-600">48 rue de la Roquette, 75011 Paris</p>
              <p className="text-sm text-gray-600">info@aurlom.com - 01 44 82 65 67</p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-blue-600">FACTURE</h3>
              <p className="text-sm text-gray-600">N° {invoice.id.slice(0, 8)}</p>
              <p className="text-sm text-gray-600">{formatDate(invoice.created_at, 'dd/MM/yyyy')}</p>
            </div>
          </div>
          
          {/* Professor Info */}
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Professeur</h4>
                <p className="text-sm">{invoice.profiles?.first_name} {invoice.profiles?.last_name}</p>
                <p className="text-sm text-gray-600">{invoice.profiles?.email}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Campus</h4>
                <p className="text-sm">{invoice.campus?.name}</p>
                <p className="text-sm text-gray-600">Période: {formatMonthYear(invoice.month_year)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white p-4 rounded border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">{lines.length}</p>
              <p className="text-sm text-gray-600">Prestations</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {lines.reduce((sum, line) => sum + line.quantite_heures, 0).toFixed(1)}h
              </p>
              <p className="text-sm text-gray-600">Total heures</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">
                {formatAmount(lines.reduce((sum, line) => sum + line.total_ttc, 0))}
              </p>
              <p className="text-sm text-gray-600">Montant TTC</p>
            </div>
          </div>
        </div>
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