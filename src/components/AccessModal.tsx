import React from 'react';
import { X, Copy, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedAccess: Array<{id: string, password: string, success: boolean}>;
  personnel: Array<{id: string, first_name: string, last_name: string, email: string, role: string}>;
}

export function AccessModal({ isOpen, onClose, generatedAccess, personnel }: AccessModalProps) {
  if (!isOpen) return null;

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'DIRECTEUR_CAMPUS': 'Directeur Campus',
      'COMPTABLE': 'Comptable',
      'ENSEIGNANT': 'Enseignant'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'SUPER_ADMIN': 'brutal-badge-error',
      'DIRECTEUR_CAMPUS': 'brutal-badge-warning',
      'ENSEIGNANT': 'brutal-badge-info',
      'COMPTABLE': 'brutal-badge-success',
    };
    return colors[role] || 'brutal-badge';
  };

  const handleCopyAll = () => {
    const passwords = generatedAccess
      .filter(a => a.success)
      .map(a => {
        const p = personnel.find(p => p.id === a.id);
        return `${p?.email}: ${a.password}`;
      })
      .join('\n');

    navigator.clipboard.writeText(passwords);
    toast.success('Mots de passe copiés dans le presse-papier');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="brutal-card max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-brutal flex items-center justify-center">
              <span className="text-primary-foreground font-bold">🔑</span>
            </div>
            <div>
              <h3 className="text-lg font-serif font-medium text-foreground">
                Accès générés
              </h3>
              <p className="text-sm text-muted-foreground font-ui">
                {generatedAccess.filter(a => a.success).length} accès créés avec succès
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="brutal-button-secondary p-2"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-ui mb-4">
            Voici les mots de passe temporaires générés pour les utilisateurs sélectionnés :
          </p>

          {generatedAccess.map((access, index) => {
            const personnelData = personnel.find(p => p.id === access.id);
            return (
              <div key={access.id} className="brutal-border p-4 bg-muted">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-ui font-medium text-foreground">
                        {personnelData?.first_name} {personnelData?.last_name}
                      </h4>
                      <span className={`brutal-badge text-xs ${getRoleColor(personnelData?.role || '')}`}>
                        {getRoleLabel(personnelData?.role || '')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-ui">{personnelData?.email}</p>
                  </div>
                  <div className="text-right ml-4">
                    {access.success ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="bg-green-100 text-green-800 px-3 py-2 rounded-brutal border-2 border-green-300 shadow-brutal font-mono text-sm font-medium">
                          {access.password}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="brutal-badge-error text-sm">
                          Erreur
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleCopyAll}
            className="brutal-button-primary inline-flex items-center"
          >
            <Copy className="h-4 w-4 mr-2" />
            <span>Copier tout</span>
          </button>
          <button
            onClick={onClose}
            className="brutal-button-secondary"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}