import React, { useState } from 'react';
import { CreditCard, Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface RIBInputProps {
  value?: {
    iban: string;
    bic: string;
    bank_name: string;
    account_holder: string;
  };
  onChange: (ribData: {
    iban: string;
    bic: string;
    bank_name: string;
    account_holder: string;
  }) => void;
  onConfirm: () => void;
  required?: boolean;
  disabled?: boolean;
}

// Fonction de validation IBAN simplifiée
const validateIBAN = (iban: string): boolean => {
  if (!iban) return false;
  // Format basique : 2 lettres + 2 chiffres + jusqu'à 30 caractères alphanumériques
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
  return ibanRegex.test(iban.replace(/\s/g, '').toUpperCase());
};

// Fonction de validation BIC
const validateBIC = (bic: string): boolean => {
  if (!bic) return false;
  // Format BIC : 6 lettres + 2 caractères + 3 caractères optionnels
  const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return bicRegex.test(bic.toUpperCase());
};

// Fonction pour formater l'IBAN (espaces tous les 4 caractères)
const formatIBAN = (iban: string): string => {
  return iban
    .replace(/\s/g, '')
    .toUpperCase()
    .replace(/(.{4})/g, '$1 ')
    .trim();
};

// Fonction pour masquer partiellement l'IBAN
const maskIBAN = (iban: string): string => {
  if (!iban || iban.length < 8) return iban;
  const clean = iban.replace(/\s/g, '');
  return clean.substring(0, 4) + ' ' + 
         '*'.repeat(clean.length - 8) + ' ' + 
         clean.substring(clean.length - 4);
};

export default function RIBInput({ value, onChange, onConfirm, required = false, disabled = false }: RIBInputProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [confirmStep, setConfirmStep] = useState(1);
  const [confirmedRIB, setConfirmedRIB] = useState<typeof value | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ribData = value || { iban: '', bic: '', bank_name: '', account_holder: '' };

  const handleInputChange = (field: string, inputValue: string) => {
    let processedValue = inputValue;
    
    if (field === 'iban') {
      processedValue = inputValue.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (processedValue.length > 34) processedValue = processedValue.substring(0, 34);
    } else if (field === 'bic') {
      processedValue = inputValue.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (processedValue.length > 11) processedValue = processedValue.substring(0, 11);
    }

    const newRIBData = { ...ribData, [field]: processedValue };
    onChange(newRIBData);

    // Validation en temps réel
    const newErrors = { ...errors };
    if (field === 'iban' && processedValue && !validateIBAN(processedValue)) {
      newErrors.iban = 'Format IBAN invalide';
    } else {
      delete newErrors.iban;
    }
    
    if (field === 'bic' && processedValue && !validateBIC(processedValue)) {
      newErrors.bic = 'Format BIC invalide';
    } else {
      delete newErrors.bic;
    }
    
    setErrors(newErrors);
  };

  const handleConfirm = () => {
    if (confirmStep === 1) {
      // Première confirmation : sauvegarder et passer à l'étape 2
      if (!validateRIBData()) return;
      setConfirmedRIB(ribData);
      setConfirmStep(2);
      toast.success('RIB enregistré. Veuillez confirmer une deuxième fois.');
    } else {
      // Deuxième confirmation : valider définitivement
      if (JSON.stringify(ribData) !== JSON.stringify(confirmedRIB)) {
        toast.error('Les données RIB ne correspondent pas à la première saisie');
        return;
      }
      onConfirm();
      toast.success('RIB confirmé avec succès !');
      setConfirmStep(1);
      setConfirmedRIB(null);
    }
  };

  const validateRIBData = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (required) {
      if (!ribData.iban) newErrors.iban = 'IBAN requis';
      if (!ribData.bic) newErrors.bic = 'BIC requis';
      if (!ribData.bank_name) newErrors.bank_name = 'Nom de la banque requis';
      if (!ribData.account_holder) newErrors.account_holder = 'Nom du titulaire requis';
    }

    if (ribData.iban && !validateIBAN(ribData.iban)) {
      newErrors.iban = 'Format IBAN invalide';
    }
    
    if (ribData.bic && !validateBIC(ribData.bic)) {
      newErrors.bic = 'Format BIC invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isRIBValid = validateIBAN(ribData.iban) && validateBIC(ribData.bic) && 
                     ribData.bank_name && ribData.account_holder;

  return (
    <div className="brutal-card space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-serif font-medium text-foreground">
          Informations Bancaires
        </h3>
        {required && <span className="text-red-500 font-ui text-sm">*</span>}
      </div>

      {confirmStep === 2 && confirmedRIB && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-brutal p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="font-ui font-medium text-yellow-800">
              Confirmation requise
            </span>
          </div>
          <p className="text-yellow-700 text-sm font-ui">
            Veuillez ressaisir exactement les mêmes informations bancaires pour confirmer.
          </p>
          <div className="mt-2 text-xs text-yellow-600 font-ui">
            <strong>Première saisie :</strong> {maskIBAN(confirmedRIB.iban)} | {confirmedRIB.bank_name}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* IBAN */}
        <div className="space-y-2">
          <label className="block text-sm font-ui font-medium text-foreground">
            IBAN *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formatIBAN(ribData.iban)}
              onChange={(e) => handleInputChange('iban', e.target.value)}
              placeholder="FR76 3000 6000 0112 3456 7890 123"
              disabled={disabled}
              className={`brutal-input ${errors.iban ? 'border-red-300 bg-red-50' : ''}`}
            />
            {ribData.iban && validateIBAN(ribData.iban) && (
              <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-600" />
            )}
          </div>
          {errors.iban && (
            <p className="text-red-600 text-sm font-ui">{errors.iban}</p>
          )}
        </div>

        {/* BIC */}
        <div className="space-y-2">
          <label className="block text-sm font-ui font-medium text-foreground">
            BIC *
          </label>
          <div className="relative">
            <input
              type="text"
              value={ribData.bic}
              onChange={(e) => handleInputChange('bic', e.target.value)}
              placeholder="BNPAFRPPXXX"
              disabled={disabled}
              className={`brutal-input ${errors.bic ? 'border-red-300 bg-red-50' : ''}`}
            />
            {ribData.bic && validateBIC(ribData.bic) && (
              <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-600" />
            )}
          </div>
          {errors.bic && (
            <p className="text-red-600 text-sm font-ui">{errors.bic}</p>
          )}
        </div>

        {/* Nom de la banque */}
        <div className="space-y-2">
          <label className="block text-sm font-ui font-medium text-foreground">
            Nom de la banque *
          </label>
          <input
            type="text"
            value={ribData.bank_name}
            onChange={(e) => handleInputChange('bank_name', e.target.value)}
            placeholder="Banque Populaire"
            disabled={disabled}
            className={`brutal-input ${errors.bank_name ? 'border-red-300 bg-red-50' : ''}`}
          />
          {errors.bank_name && (
            <p className="text-red-600 text-sm font-ui">{errors.bank_name}</p>
          )}
        </div>

        {/* Titulaire du compte */}
        <div className="space-y-2">
          <label className="block text-sm font-ui font-medium text-foreground">
            Titulaire du compte *
          </label>
          <input
            type="text"
            value={ribData.account_holder}
            onChange={(e) => handleInputChange('account_holder', e.target.value)}
            placeholder="Jean Dupont"
            disabled={disabled}
            className={`brutal-input ${errors.account_holder ? 'border-red-300 bg-red-50' : ''}`}
          />
          {errors.account_holder && (
            <p className="text-red-600 text-sm font-ui">{errors.account_holder}</p>
          )}
        </div>
      </div>

      {/* Bouton de confirmation */}
      <div className="flex justify-end">
        <button
          onClick={handleConfirm}
          disabled={disabled || !isRIBValid || Object.keys(errors).length > 0}
          className="brutal-button-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirmStep === 1 ? (
            <>
              <Check className="w-4 h-4" />
              Confirmer le RIB
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Confirmer définitivement
            </>
          )}
        </button>
      </div>

      {/* Indicateur de progression */}
      <div className="flex items-center justify-center gap-2 text-sm font-ui text-muted-foreground">
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
          confirmStep >= 1 ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
        }`}>
          {confirmStep > 1 ? <Check className="w-4 h-4" /> : '1'}
        </div>
        <div className="w-8 h-0.5 bg-gray-300"></div>
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
          confirmStep >= 2 ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
        }`}>
          {confirmStep > 2 ? <Check className="w-4 h-4" /> : '2'}
        </div>
        <span className="ml-2">Double confirmation</span>
      </div>
    </div>
  );
}
