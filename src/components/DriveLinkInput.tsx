import React, { useState } from 'react';
import { Link, ExternalLink, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface DriveLinkInputProps {
  value?: string;
  onChange: (link: string) => void;
  required?: boolean;
  disabled?: boolean;
}

// Fonction de validation des liens Google Drive
const validateDriveLink = (link: string): boolean => {
  if (!link) return false;
  
  // Patterns pour différents formats de liens Google Drive
  const drivePatterns = [
    /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)\/view(\?usp=sharing)?$/,
    /^https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9-_]+)$/,
    /^https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)\/edit(\?usp=sharing)?$/,
    /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit(\?usp=sharing)?$/
  ];
  
  return drivePatterns.some(pattern => pattern.test(link));
};

// Fonction pour nettoyer et normaliser le lien
const normalizeDriveLink = (link: string): string => {
  if (!link) return '';
  
  // Nettoyer les espaces
  link = link.trim();
  
  // Si c'est un ID Drive, construire le lien complet
  if (/^[a-zA-Z0-9-_]{20,}$/.test(link)) {
    return `https://drive.google.com/file/d/${link}/view`;
  }
  
  // Si c'est un lien partagé court, essayer de l'étendre
  if (link.includes('drive.google.com/open')) {
    const match = link.match(/id=([a-zA-Z0-9-_]+)/);
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/view`;
    }
  }
  
  return link;
};

// Fonction pour extraire l'ID du fichier Drive
const extractDriveFileId = (link: string): string | null => {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/document\/d\/([a-zA-Z0-9-_]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  ];
  
  for (const pattern of patterns) {
    const match = link.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

export default function DriveLinkInput({ value = '', onChange, required = false, disabled = false }: DriveLinkInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [linkPreview, setLinkPreview] = useState<{ title: string; type: string } | null>(null);

  const handleInputChange = (inputValue: string) => {
    const normalizedLink = normalizeDriveLink(inputValue);
    onChange(normalizedLink);
    
    // Reset validation state
    setValidationError('');
    setLinkPreview(null);
    
    // Auto-validation si le lien semble complet
    if (normalizedLink.length > 20 && validateDriveLink(normalizedLink)) {
      handleValidateLink(normalizedLink);
    }
  };

  const handleValidateLink = async (link: string) => {
    if (!validateDriveLink(link)) {
      setValidationError('Format de lien Google Drive invalide');
      return;
    }

    setIsValidating(true);
    setValidationError('');
    
    try {
      // Simulation de validation (en réalité, on pourrait faire un appel API)
      // pour vérifier que le fichier existe et est accessible
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fileId = extractDriveFileId(link);
      if (fileId) {
        setLinkPreview({
          title: `Fichier Drive (${fileId.substring(0, 8)}...)`,
          type: 'document'
        });
        toast.success('Lien Drive validé avec succès !');
      }
    } catch (error) {
      setValidationError('Impossible de valider le lien. Vérifiez qu\'il est accessible.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualValidation = () => {
    if (value) {
      handleValidateLink(value);
    }
  };

  const isLinkValid = validateDriveLink(value);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link className="w-5 h-5 text-primary" />
        <label className="text-sm font-ui font-medium text-foreground">
          Lien Google Drive vers la facture originale *
        </label>
        {required && <span className="text-red-500 font-ui text-sm">*</span>}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="url"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="https://drive.google.com/file/d/1ABC.../view"
            disabled={disabled}
            className={`brutal-input pr-12 ${
              validationError ? 'border-red-300 bg-red-50' : 
              isLinkValid ? 'border-green-300 bg-green-50' : ''
            }`}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {isValidating && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            )}
            {isLinkValid && !isValidating && (
              <Check className="w-4 h-4 text-green-600" />
            )}
            {value && (
              <button
                type="button"
                onClick={() => window.open(value, '_blank')}
                disabled={!isLinkValid}
                className="text-primary hover:text-primary-foreground disabled:text-gray-400"
                title="Ouvrir le lien"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {validationError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-brutal p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-red-700 text-sm font-ui">{validationError}</span>
            </div>
          </div>
        )}

        {linkPreview && (
          <div className="bg-green-50 border-2 border-green-200 rounded-brutal p-3">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-700 text-sm font-ui">
                {linkPreview.title}
              </span>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground font-ui space-y-1">
          <p><strong>Formats acceptés :</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>https://drive.google.com/file/d/[ID]/view</li>
            <li>https://drive.google.com/open?id=[ID]</li>
            <li>https://docs.google.com/document/d/[ID]/edit</li>
            <li>ID du fichier uniquement (sera automatiquement formaté)</li>
          </ul>
        </div>

        {value && !isLinkValid && (
          <button
            type="button"
            onClick={handleManualValidation}
            disabled={isValidating || disabled}
            className="brutal-button-secondary text-sm"
          >
            {isValidating ? 'Validation...' : 'Valider le lien'}
          </button>
        )}
      </div>
    </div>
  );
}
