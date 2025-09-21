import React, { useState } from 'react';
import { 
  CreditCard, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Shield, 
  AlertTriangle, 
  Check,
  Copy,
  Calendar,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../lib/utils';

interface BankingInfo {
  iban?: string;
  bic?: string;
  bank_name?: string;
  account_holder?: string;
  drive_invoice_link?: string;
  rib_confirmed_at?: string;
  rib_confirmed_by?: {
    first_name: string;
    last_name: string;
  };
}

interface BankingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    campus_name?: string;
  };
  bankingInfo: BankingInfo;
}

// Fonction pour masquer partiellement l'IBAN
const maskIBAN = (iban: string): string => {
  if (!iban || iban.length < 8) return iban;
  const clean = iban.replace(/\s/g, '');
  return clean.substring(0, 4) + ' ' + 
         '*'.repeat(Math.max(4, clean.length - 8)) + ' ' + 
         clean.substring(clean.length - 4);
};

// Fonction pour masquer partiellement le BIC
const maskBIC = (bic: string): string => {
  if (!bic || bic.length < 6) return bic;
  return bic.substring(0, 4) + '***' + bic.substring(bic.length - 2);
};

export default function BankingInfoModal({ isOpen, onClose, personnel, bankingInfo }: BankingInfoModalProps) {
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copié dans le presse-papiers`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasBankingInfo = bankingInfo.iban || bankingInfo.bic || bankingInfo.bank_name || bankingInfo.account_holder;
  const hasDriveLink = bankingInfo.drive_invoice_link;
  const isRIBConfirmed = bankingInfo.rib_confirmed_at;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background brutal-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b-2 border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-serif font-medium text-foreground">
                  Informations Bancaires & Drive
                </h2>
                <p className="text-sm text-muted-foreground font-ui">
                  {personnel.first_name} {personnel.last_name} ({personnel.email})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations personnelles */}
          <div className="brutal-card">
            <h3 className="text-lg font-serif font-medium text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations Personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                  Nom complet
                </label>
                <p className="text-foreground font-ui">
                  {personnel.first_name} {personnel.last_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                  Email
                </label>
                <p className="text-foreground font-ui">{personnel.email}</p>
              </div>
              <div>
                <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                  Rôle
                </label>
                <p className="text-foreground font-ui">{personnel.role}</p>
              </div>
              {personnel.campus_name && (
                <div>
                  <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                    Campus
                  </label>
                  <p className="text-foreground font-ui">{personnel.campus_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Informations bancaires */}
          <div className="brutal-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-medium text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Informations Bancaires
              </h3>
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="brutal-button-secondary text-sm flex items-center gap-2"
              >
                {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showSensitiveData ? 'Masquer' : 'Afficher'} les détails
              </button>
            </div>

            {!hasBankingInfo ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-brutal p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800 font-ui">
                    Aucune information bancaire renseignée
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* IBAN */}
                {bankingInfo.iban && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                        IBAN
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-foreground font-mono">
                          {showSensitiveData ? bankingInfo.iban : maskIBAN(bankingInfo.iban)}
                        </p>
                        <button
                          onClick={() => handleCopy(bankingInfo.iban!, 'IBAN')}
                          className="text-primary hover:text-primary-foreground"
                          title="Copier l'IBAN"
                        >
                          {copiedField === 'IBAN' ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                        Statut
                      </label>
                      {isRIBConfirmed ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-ui">Confirmé</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-ui">Non confirmé</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* BIC */}
                {bankingInfo.bic && (
                  <div>
                    <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                      BIC/SWIFT
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-mono">
                        {showSensitiveData ? bankingInfo.bic : maskBIC(bankingInfo.bic)}
                      </p>
                      <button
                        onClick={() => handleCopy(bankingInfo.bic!, 'BIC')}
                        className="text-primary hover:text-primary-foreground"
                        title="Copier le BIC"
                      >
                        {copiedField === 'BIC' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Nom de la banque */}
                {bankingInfo.bank_name && (
                  <div>
                    <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                      Nom de la banque
                    </label>
                    <p className="text-foreground font-ui">{bankingInfo.bank_name}</p>
                  </div>
                )}

                {/* Titulaire du compte */}
                {bankingInfo.account_holder && (
                  <div>
                    <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                      Titulaire du compte
                    </label>
                    <p className="text-foreground font-ui">{bankingInfo.account_holder}</p>
                  </div>
                )}

                {/* Informations de confirmation */}
                {isRIBConfirmed && bankingInfo.rib_confirmed_by && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-brutal p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-ui font-medium">
                        RIB confirmé
                      </span>
                    </div>
                    <div className="text-sm text-green-700 font-ui space-y-1">
                      <p>
                        <strong>Confirmé par :</strong> {bankingInfo.rib_confirmed_by.first_name} {bankingInfo.rib_confirmed_by.last_name}
                      </p>
                      <p className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <strong>Le :</strong> {formatDate(bankingInfo.rib_confirmed_at!)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lien Drive */}
          <div className="brutal-card">
            <h3 className="text-lg font-serif font-medium text-foreground mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Facture Originale (Google Drive)
            </h3>

            {!hasDriveLink ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-brutal p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800 font-ui">
                    Aucun lien vers la facture originale
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                    Lien Google Drive
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-ui break-all flex-1">
                      {bankingInfo.drive_invoice_link}
                    </p>
                    <button
                      onClick={() => handleCopy(bankingInfo.drive_invoice_link!, 'Lien Drive')}
                      className="text-primary hover:text-primary-foreground"
                      title="Copier le lien"
                    >
                      {copiedField === 'Lien Drive' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => window.open(bankingInfo.drive_invoice_link, '_blank')}
                      className="text-primary hover:text-primary-foreground"
                      title="Ouvrir le lien"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-blue-50 border-2 border-blue-200 rounded-brutal p-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-800 text-sm font-ui">
                      Lien validé et accessible
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="brutal-button-secondary"
            >
              Fermer
            </button>
            {hasBankingInfo && (
              <button
                onClick={() => {
                  // TODO: Implémenter l'export des infos bancaires
                  toast.success('Export des informations bancaires en cours...');
                }}
                className="brutal-button-primary"
              >
                Exporter les informations
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
