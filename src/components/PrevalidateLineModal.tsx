import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface PrevalidateLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (observations: string) => void;
  mode: 'prevalidate' | 'reject';
  lineData?: {
    intitule: string;
    date_cours: string;
    quantite_heures: number;
    total_ttc: number;
  };
  isLoading?: boolean;
}

export function PrevalidateLineModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  mode, 
  lineData, 
  isLoading = false 
}: PrevalidateLineModalProps) {
  const [observations, setObservations] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(observations);
  };

  const isReject = mode === 'reject';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {isReject ? (
              <XCircle className="w-6 h-6 text-red-600 mr-3" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {isReject ? 'Rejeter la ligne' : 'Prévalider la ligne'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {lineData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Détails de la ligne</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Cours:</strong> {lineData.intitule}</p>
              <p><strong>Date:</strong> {new Date(lineData.date_cours).toLocaleDateString('fr-FR')}</p>
              <p><strong>Heures:</strong> {lineData.quantite_heures}h</p>
              <p><strong>Montant:</strong> {lineData.total_ttc.toFixed(2)}€</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isReject ? 'Motif du rejet' : 'Observations (optionnel)'}
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={
                isReject 
                  ? "Expliquez pourquoi cette ligne est rejetée..." 
                  : "Ajoutez des observations sur cette ligne..."
              }
              disabled={isLoading}
            />
            {isReject && (
              <div className="mt-2 flex items-start">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  Le rejet de cette ligne sera enregistré et visible par le professeur.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center ${
                isReject 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isReject ? 'Rejet...' : 'Prévalidation...'}
                </>
              ) : (
                <>
                  {isReject ? (
                    <XCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {isReject ? 'Rejeter' : 'Prévalider'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
