import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Eye, Calendar, Clock, Euro, Building2, Download, BookOpen, Info, Users, FileSpreadsheet } from 'lucide-react';
import { useCSVImport } from '../hooks/useCSVImport';
import { useAuth } from '../lib/auth';
import { formatAmount } from '../lib/utils';

export function ImportCSV() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [previewStats, setPreviewStats] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'factures' | 'personnel'>('factures');
  
  // S'assurer que les professeurs ne peuvent pas accéder à l'onglet personnel
  React.useEffect(() => {
    if (profile?.role === 'ENSEIGNANT' && activeTab === 'personnel') {
      setActiveTab('factures');
    }
  }, [profile?.role, activeTab]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuth();
  const importMutation = useCSVImport();

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Veuillez sélectionner un fichier CSV');
      return;
    }

    setSelectedFile(file);

    // Générer un aperçu structuré
    const text = await file.text();
    const lines = text.trim().split('\n');
    
    if (lines.length > 1) {
      const dataLines = lines.slice(1, 6);
      const previewData = dataLines.map(line => {
        const columns = line.split(',');
        return {
          mois: columns[0] || '',
          date: columns[1] || '',
          heureDebut: columns[2] || '',
          heureFin: columns[3] || '',
          campus: columns[4] || '',
          filiere: columns[5] || '',
          classe: columns[6] || '',
          intitule: columns[7] || '',
          retard: columns[8] || '',
          quantite: columns[9] || '',
          prixUnitaire: columns[10] || '',
          totalTTC: columns[11] || ''
        };
      });

      setPreview(previewData);

      // Statistiques d'aperçu
      const allLines = lines.slice(1);
      const campusSet = new Set();
      const filiereSet = new Set();
      let totalAmount = 0;

      allLines.forEach(line => {
        const columns = line.split(',');
        if (columns.length >= 12) {
          campusSet.add(columns[4]);
          filiereSet.add(columns[5]);
          const amount = parseFloat(columns[11]) || 0;
          totalAmount += amount;
        }
      });

      setPreviewStats({
        totalLines: allLines.length,
        totalAmount,
        campus: Array.from(campusSet),
        filieres: Array.from(filiereSet)
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    const content = await selectedFile.text();
    importMutation.mutate(content);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview([]);
    setPreviewStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = (type: 'factures' | 'personnel') => {
    let csvContent = '';
    let filename = '';

    if (type === 'factures') {
      csvContent = `mois,date,heureDebut,heureFin,campus,filiere,classe,intitule,retard,quantite,prixUnitaire,totalTTC
février 2026,mardi 3 février 2026,09:00,12:00,Roquette,BTS,1ère année,Cours de mathématiques,0,3,60,180
février 2026,mercredi 4 février 2026,14:00,17:00,Douai,BTS,2ème année,Cours de français,0,3,60,180
février 2026,jeudi 5 février 2026,10:00,12:00,Picpus,BTS,1ère année,Cours d'anglais,0,2,60,120`;
      filename = 'template-factures.csv';
    } else {
      csvContent = `email,first_name,last_name,role,campus_name
prof.nouveau1@aurlom.com,Jean,Dupont,ENSEIGNANT,Roquette
directeur.nouveau@aurlom.com,Marie,Martin,DIRECTEUR_CAMPUS,Douai
comptable.nouveau@aurlom.com,Pierre,Bernard,COMPTABLE,`;
      filename = 'template-personnel.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="brutal-card">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-brutal flex items-center justify-center">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-medium text-foreground">Import en masse</h1>
            <p className="text-muted-foreground font-ui mt-1">
              Importez vos données depuis des fichiers CSV conformes
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="brutal-card">
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('factures')}
            className={`px-4 py-2 rounded-brutal font-ui font-medium transition-all duration-300 ${
              activeTab === 'factures'
                ? 'brutal-button-primary'
                : 'brutal-button-secondary'
            }`}
          >
            <FileText className="w-4 h-4 mr-2 inline" />
            Factures & Prestations
          </button>
          {/* Onglet Personnel - Seulement pour SUPER_ADMIN et COMPTABLE */}
          {profile?.role === 'SUPER_ADMIN' || profile?.role === 'COMPTABLE' ? (
            <button
              onClick={() => setActiveTab('personnel')}
              className={`px-4 py-2 rounded-brutal font-ui font-medium transition-all duration-300 ${
                activeTab === 'personnel'
                  ? 'brutal-button-primary'
                  : 'brutal-button-secondary'
              }`}
            >
              <Users className="w-4 h-4 mr-2 inline" />
              Personnel
            </button>
          ) : null}
        </div>

        {/* Instructions selon le type */}
        {activeTab === 'factures' ? (
          <div className="space-y-6">
            <div className="brutal-card bg-blue-50 border-blue-200">
              <h2 className="text-xl font-serif font-medium text-blue-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Format CSV pour les factures
              </h2>
              <div className="space-y-3 text-sm text-blue-800 font-ui">
                <p><strong>Encodage :</strong> UTF-8</p>
                <p><strong>Séparateur :</strong> Virgule (,)</p>
                <p><strong>Colonnes requises :</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>mois, date, heureDebut, heureFin</li>
                  <li>campus, filiere, classe, intitule</li>
                  <li>retard, quantite, prixUnitaire, totalTTC</li>
                </ul>
                <div className="mt-4 p-3 bg-white rounded-brutal border-2 border-blue-200">
                  <p className="font-mono text-xs">
                    février 2026,mardi 3 février 2026,09:00,12:00,Roquette,BTS,1ère année,Cours de mathématiques,0,3,60,180
                  </p>
                </div>
              </div>
            </div>

            {/* Template et guides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="brutal-card">
                <h3 className="text-lg font-serif font-medium text-foreground mb-4 flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  Template CSV
                </h3>
                <p className="text-muted-foreground font-ui mb-4">
                  Téléchargez le template avec des exemples de données
                </p>
                <button
                  onClick={() => downloadTemplate('factures')}
                  className="brutal-button-primary w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger template factures
                </button>
              </div>

              <div className="brutal-card">
                <h3 className="text-lg font-serif font-medium text-foreground mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Guide d'import
                </h3>
                <p className="text-muted-foreground font-ui mb-4">
                  Consultez le guide détaillé avec toutes les contraintes
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => window.open('/templates/GUIDE-IMPORT.txt', '_blank')}
                    className="brutal-button-secondary w-full"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Ouvrir le guide
                  </button>
                  <button
                    onClick={() => window.open('/templates/LEGENDE-ROLES-CAMPUS.txt', '_blank')}
                    className="brutal-button-secondary w-full"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Voir la légende
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="brutal-card bg-green-50 border-green-200">
              <h2 className="text-xl font-serif font-medium text-green-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Format CSV pour le personnel
              </h2>
              <div className="space-y-3 text-sm text-green-800 font-ui">
                <p><strong>Encodage :</strong> UTF-8</p>
                <p><strong>Séparateur :</strong> Virgule (,)</p>
                <p><strong>Colonnes requises :</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>email, first_name, last_name</li>
                  <li>role, campus_name (optionnel)</li>
                </ul>
                <div className="mt-4 p-3 bg-white rounded-brutal border-2 border-green-200">
                  <p className="font-mono text-xs">
                    prof.nouveau@aurlom.com,Jean,Dupont,ENSEIGNANT,Roquette
                  </p>
                </div>
              </div>
            </div>

            {/* Template et guides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="brutal-card">
                <h3 className="text-lg font-serif font-medium text-foreground mb-4 flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  Template CSV
                </h3>
                <p className="text-muted-foreground font-ui mb-4">
                  Téléchargez le template avec des exemples de données
                </p>
                <button
                  onClick={() => downloadTemplate('personnel')}
                  className="brutal-button-primary w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger template personnel
                </button>
              </div>

              <div className="brutal-card">
                <h3 className="text-lg font-serif font-medium text-foreground mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  Rôles disponibles
                </h3>
                <div className="space-y-2 text-sm font-ui">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SUPER_ADMIN:</span>
                    <span className="font-medium text-foreground">Accès complet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">COMPTABLE:</span>
                    <span className="font-medium text-foreground">Gestion financière</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DIRECTEUR_CAMPUS:</span>
                    <span className="font-medium text-foreground">Gestion campus</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ENSEIGNANT:</span>
                    <span className="font-medium text-foreground">Création factures</span>
                  </div>
                </div>
                <button
                  onClick={() => window.open('/templates/LEGENDE-ROLES-CAMPUS.txt', '_blank')}
                  className="brutal-button-secondary w-full mt-4"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Voir tous les détails
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File Drop Zone */}
      <div className="brutal-card">
        <h2 className="text-xl font-serif font-medium text-foreground mb-6">
          Import du fichier CSV
        </h2>
        
        <div
          className={`border-2 border-dashed rounded-brutal p-12 text-center transition-all duration-300 ${
            dragOver
              ? 'border-primary bg-primary/5 shadow-brutal-hover'
              : 'border-border hover:border-primary hover:shadow-brutal'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          {!selectedFile ? (
            <>
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-serif font-medium text-foreground mb-2">
                Glissez votre fichier CSV ici
              </h3>
              <p className="text-muted-foreground font-ui mb-4">ou cliquez pour parcourir</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="brutal-button-primary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Sélectionner un fichier
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </>
          ) : (
            <div className="space-y-4">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <h3 className="text-lg font-serif font-medium text-foreground">
                Fichier sélectionné
              </h3>
              <p className="text-muted-foreground font-ui">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground font-ui">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              <button
                onClick={resetForm}
                className="brutal-button-secondary"
              >
                Changer de fichier
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="brutal-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-medium text-foreground flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Aperçu des données
            </h2>
            {previewStats && (
              <div className="flex space-x-4 text-sm font-ui">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-foreground">{previewStats.totalLines} lignes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Euro className="w-4 h-4 text-green-600" />
                  <span className="text-foreground">{formatAmount(previewStats.totalAmount)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span className="text-foreground">{previewStats.campus.length} campus</span>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-3 font-ui font-medium text-foreground">Date</th>
                  <th className="text-left p-3 font-ui font-medium text-foreground">Heures</th>
                  <th className="text-left p-3 font-ui font-medium text-foreground">Campus</th>
                  <th className="text-left p-3 font-ui font-medium text-foreground">Cours</th>
                  <th className="text-left p-3 font-ui font-medium text-foreground">Montant</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-ui text-sm text-foreground">
                      {row.date}
                    </td>
                    <td className="p-3 font-ui text-sm text-muted-foreground">
                      {row.heureDebut} - {row.heureFin}
                    </td>
                    <td className="p-3 font-ui text-sm text-foreground">
                      {row.campus}
                    </td>
                    <td className="p-3 font-ui text-sm text-foreground">
                      {row.intitule}
                    </td>
                    <td className="p-3 font-ui text-sm text-foreground font-medium">
                      {formatAmount(parseFloat(row.totalTTC) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Actions */}
      {selectedFile && (
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif font-medium text-foreground mb-2">
                Prêt pour l'import
              </h3>
              <p className="text-muted-foreground font-ui">
                Vérifiez l'aperçu ci-dessus avant de procéder à l'import
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={resetForm}
                className="brutal-button-secondary"
                disabled={importMutation.isPending}
              >
                Annuler
              </button>
              <button
                onClick={handleImport}
                className="brutal-button-primary"
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importer les données
                  </>
                )}
              </button>
            </div>
          </div>

          {importMutation.error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-brutal">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-ui font-medium text-red-800">Erreur d'import</span>
              </div>
              <p className="text-red-700 font-ui mt-1">
                {(importMutation.error as Error).message}
              </p>
            </div>
          )}

          {importMutation.isSuccess && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-brutal">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-ui font-medium text-green-800">Import réussi</span>
              </div>
              <p className="text-green-700 font-ui mt-1">
                Les données ont été importées avec succès
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}