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
  User,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../lib/utils';
import { useUpdateInvoiceBanking, useConfirmInvoiceRIB } from '../hooks/useInvoicesWithBanking';
import RIBInput from './RIBInput';
import DriveLinkInput from './DriveLinkInput';

interface InvoiceBankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    enseignant_name: string;
    enseignant_email: string;
    month_year: string;
    status: string;
    total_amount: number;
    iban?: string;
    bic?: string;
    bank_name?: string;
    account_holder?: string;
    drive_invoice_link?: string;
    rib_confirmed_at?: string;
    rib_confirmed_by_name?: string;
  };
}

export default function InvoiceBankingModal({ isOpen, onClose, invoice }: InvoiceBankingModalProps) {
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const updateBankingMutation = useUpdateInvoiceBanking();
  const confirmRIBMutation = useConfirmInvoiceRIB();

  if (!isOpen) return null;

  const bankingData = {
    iban: invoice.iban || '',
    bic: invoice.bic || '',
    bank_name: invoice.bank_name || '',
    account_holder: invoice.account_holder || ''
  };

  const handleSaveBanking = (ribData: typeof bankingData, driveLink: string) => {
    updateBankingMutation.mutate({
      invoiceId: invoice.id,
      iban: ribData.iban,
      bic: ribData.bic,
      bank_name: ribData.bank_name,
      account_holder: ribData.account_holder,
      drive_invoice_link: driveLink
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const handleConfirmRIB = () => {
    confirmRIBMutation.mutate(invoice.id);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copié dans le presse-papiers`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasBankingInfo = invoice.iban || invoice.bic || invoice.bank_name || invoice.account_holder;
  const hasDriveLink = invoice.drive_invoice_link;
  const isRIBConfirmed = invoice.rib_confirmed_at;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background brutal-border max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b-2 border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-serif font-medium text-foreground">
                  RIB et Facture Originale - {invoice.month_year}
                </h2>
                <p className="text-sm text-muted-foreground font-ui">
                  {invoice.enseignant_name} ({invoice.enseignant_email})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="brutal-button-secondary text-sm"
                >
                  Modifier
                </button>
              )}
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {isEditing ? (
            /* Mode édition */
            <InvoiceBankingEdit 
              invoice={invoice}
              onSave={handleSaveBanking}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            /* Mode lecture */
            <InvoiceBankingView 
              invoice={invoice}
              showSensitiveData={showSensitiveData}
              setShowSensitiveData={setShowSensitiveData}
              copiedField={copiedField}
              handleCopy={handleCopy}
              onConfirmRIB={handleConfirmRIB}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Composant pour la vue en lecture
function InvoiceBankingView({ 
  invoice, 
  showSensitiveData, 
  setShowSensitiveData, 
  copiedField, 
  handleCopy,
  onConfirmRIB 
}: any) {
  const hasBankingInfo = invoice.iban || invoice.bic || invoice.bank_name || invoice.account_holder;
  const hasDriveLink = invoice.drive_invoice_link;
  const isRIBConfirmed = invoice.rib_confirmed_at;

  return (
    <>
      {/* Informations de la facture */}
      <div className="brutal-card">
        <h3 className="text-lg font-serif font-medium text-foreground mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Facture {invoice.month_year}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
              Montant total
            </label>
            <p className="text-foreground font-ui text-lg">{invoice.total_amount.toFixed(2)}€</p>
          </div>
          <div>
            <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
              Statut
            </label>
            <span className={`brutal-badge text-xs ${
              invoice.status === 'paid' ? 'brutal-badge-success' :
              invoice.status === 'validated' ? 'brutal-badge-info' :
              invoice.status === 'prevalidated' ? 'brutal-badge-warning' :
              'brutal-badge-error'
            }`}>
              {invoice.status}
            </span>
          </div>
          <div>
            <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
              RIB confirmé
            </label>
            {isRIBConfirmed ? (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-sm font-ui">Oui</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-ui">Non</span>
              </div>
            )}
          </div>
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
                Aucune information bancaire renseignée pour cette facture
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* IBAN */}
            {invoice.iban && (
              <div>
                <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                  IBAN
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-foreground font-mono">
                    {showSensitiveData ? invoice.iban : maskIBAN(invoice.iban)}
                  </p>
                  <button
                    onClick={() => handleCopy(invoice.iban, 'IBAN')}
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
            )}

            {/* BIC */}
            {invoice.bic && (
              <div>
                <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                  BIC/SWIFT
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-foreground font-mono">
                    {showSensitiveData ? invoice.bic : maskBIC(invoice.bic)}
                  </p>
                  <button
                    onClick={() => handleCopy(invoice.bic, 'BIC')}
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
            {invoice.bank_name && (
              <div>
                <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                  Nom de la banque
                </label>
                <p className="text-foreground font-ui">{invoice.bank_name}</p>
              </div>
            )}

            {/* Titulaire du compte */}
            {invoice.account_holder && (
              <div>
                <label className="block text-sm font-ui font-medium text-muted-foreground mb-1">
                  Titulaire du compte
                </label>
                <p className="text-foreground font-ui">{invoice.account_holder}</p>
              </div>
            )}

            {/* Informations de confirmation */}
            {isRIBConfirmed && invoice.rib_confirmed_by_name && (
              <div className="bg-green-50 border-2 border-green-200 rounded-brutal p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-ui font-medium">
                    RIB confirmé
                  </span>
                </div>
                <div className="text-sm text-green-700 font-ui space-y-1">
                  <p>
                    <strong>Confirmé par :</strong> {invoice.rib_confirmed_by_name}
                  </p>
                  <p className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <strong>Le :</strong> {formatDate(invoice.rib_confirmed_at)}
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
                  {invoice.drive_invoice_link}
                </p>
                <button
                  onClick={() => handleCopy(invoice.drive_invoice_link, 'Lien Drive')}
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
                  onClick={() => window.open(invoice.drive_invoice_link, '_blank')}
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
      <div className="flex justify-between">
        <div>
          {!isRIBConfirmed && hasBankingInfo && (
            <button
              onClick={onConfirmRIB}
              className="brutal-button-primary flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Confirmer le RIB
            </button>
          )}
        </div>
        <button
          onClick={() => window.close()}
          className="brutal-button-secondary"
        >
          Fermer
        </button>
      </div>
    </>
  );
}

// Composant pour l'édition
function InvoiceBankingEdit({ invoice, onSave, onCancel }: any) {
  const [ribData, setRibData] = useState({
    iban: invoice.iban || '',
    bic: invoice.bic || '',
    bank_name: invoice.bank_name || '',
    account_holder: invoice.account_holder || ''
  });
  const [driveLink, setDriveLink] = useState(invoice.drive_invoice_link || '');
  const [ribConfirmed, setRibConfirmed] = useState(false);

  const handleSave = () => {
    onSave(ribData, driveLink);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-brutal p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-ui font-medium">
            Modification des informations bancaires pour {invoice.month_year}
          </span>
        </div>
        <p className="text-blue-700 text-sm font-ui mt-2">
          Ces informations sont spécifiques à cette facture mensuelle.
        </p>
      </div>

      <RIBInput
        value={ribData}
        onChange={setRibData}
        onConfirm={() => setRibConfirmed(true)}
        required={true}
      />

      <DriveLinkInput
        value={driveLink}
        onChange={setDriveLink}
        required={true}
      />

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="brutal-button-secondary flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={!ribConfirmed}
          className="brutal-button-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Enregistrer
        </button>
      </div>
    </div>
  );
}

// Fonctions utilitaires pour masquer les données
const maskIBAN = (iban: string): string => {
  if (!iban || iban.length < 8) return iban;
  const clean = iban.replace(/\s/g, '');
  return clean.substring(0, 4) + ' ' + 
         '*'.repeat(Math.max(4, clean.length - 8)) + ' ' + 
         clean.substring(clean.length - 4);
};

const maskBIC = (bic: string): string => {
  if (!bic || bic.length < 6) return bic;
  return bic.substring(0, 4) + '***' + bic.substring(bic.length - 2);
};
