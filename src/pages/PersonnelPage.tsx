import React, { useState } from 'react';
import { 
  Users, Plus, Edit, Trash2, Building2, Mail, UserCheck, Upload, Download, Search, Filter, Key, FileText, Send, X, Copy,
  Clock, CheckCircle, XCircle, RefreshCw, Eye, EyeOff, AlertTriangle, BarChart3, Settings, CreditCard
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { usePersonnelFixed as usePersonnelRPC, useCreatePersonnelFixed as useCreatePersonnelRPC } from '../hooks/usePersonnelFixed';
import { useGenerateAccessFixed } from '../hooks/useGenerateAccessFixed';
import { usePasswordReset, useBulkPasswordReset } from '../hooks/usePasswordReset';
import { useCampus } from '../hooks/useCampus';
import { useExportData } from '../hooks/useExport';
import { AccessModal } from '../components/AccessModal';
// BankingInfoModal supprimé - maintenant géré par facture
import { formatDate } from '../lib/utils';
import { debugLogger, logPermissionCheck, logDataAccess } from '../lib/debug';
import toast from 'react-hot-toast';

export default function PersonnelPage() {
  const { profile } = useAuth();
  const { data: personnel = [], isLoading } = usePersonnelRPC();
  const { data: campuses = [] } = useCampus();
  const createMutation = useCreatePersonnelRPC();
  const generateAccessMutation = useGenerateAccessFixed();
  const passwordResetMutation = usePasswordReset();
  const bulkPasswordResetMutation = useBulkPasswordReset();
  const exportMutation = useExportData();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showAccessResultsModal, setShowAccessResultsModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [generatedAccess, setGeneratedAccess] = useState<Array<{id: string, password: string, success: boolean}>>([]);
  const [passwordResetResults, setPasswordResetResults] = useState<any[]>([]);
  const [editingPersonnel, setEditingPersonnel] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState('all');
  const [showBankingModal, setShowBankingModal] = useState(false);
  const [selectedPersonnelForBanking, setSelectedPersonnelForBanking] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPersonnel, setSelectedPersonnel] = useState<Set<string>>(new Set());

  // Filtrage des utilisateurs avec statut actif/inactif
  const filteredPersonnel = personnel.filter(person => {
    const matchesSearch = person.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || person.role === roleFilter;
    const matchesCampus = campusFilter === 'all' || person.campus_id === campusFilter;
    
    // Pour le statut, on simule basé sur la présence d'email (actif) ou non
    const isActive = person.email && person.email.length > 0;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && isActive) ||
                         (statusFilter === 'inactive' && !isActive);
    
    return matchesSearch && matchesRole && matchesCampus && matchesStatus;
  });

  React.useEffect(() => {
    if (personnel.length > 0) {
      logDataAccess(profile?.role, 'personnel', personnel.length, {
        filtered: filteredPersonnel.length,
        searchTerm,
        roleFilter,
        campusFilter,
        statusFilter
      });
      
      debugLogger.ui('PersonnelPage - Données chargées', {
        role: profile?.role,
        totalPersonnel: personnel.length,
        filteredPersonnel: filteredPersonnel.length,
        canManagePersonnel: true
      });
    }
  }, [personnel, filteredPersonnel, searchTerm, roleFilter, campusFilter, statusFilter, profile?.role]);

  if (!profile || profile.role !== 'SUPER_ADMIN') {
    logPermissionCheck(profile?.role || 'UNKNOWN', 'PersonnelPage', false, 'Seul Super Admin autorisé');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="brutal-card text-center">
          <Users className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-medium text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground font-ui">Seuls les super administrateurs peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    debugLogger.ui('PersonnelPage en cours de chargement');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Statistiques
  const totalUsers = personnel.length;
  const activeUsers = personnel.filter(u => u.email && u.email.length > 0).length;
  const inactiveUsers = totalUsers - activeUsers;
  const rolesCount = personnel.reduce((acc: any, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const handleGenerateAccess = async () => {
    const selectedIds = Array.from(selectedPersonnel);
    if (selectedIds.length === 0) {
      toast.error("Veuillez sélectionner au moins un utilisateur.");
      return;
    }
    try {
      const results = await generateAccessMutation.mutateAsync(selectedIds);
      setGeneratedAccess(results);
      setShowAccessResultsModal(true);
      setSelectedPersonnel(new Set());
    } catch (error) {
      console.error("Erreur lors de la génération des accès:", error);
      toast.error("Échec de la génération des accès.");
    }
  };

  const handlePasswordReset = async () => {
    const selectedIds = Array.from(selectedPersonnel);
    if (selectedIds.length === 0) {
      toast.error("Veuillez sélectionner au moins un utilisateur.");
      return;
    }
    try {
      const results = await bulkPasswordResetMutation.mutateAsync(selectedIds);
      setPasswordResetResults(results);
      setShowPasswordResetModal(true);
      setSelectedPersonnel(new Set());
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des mots de passe:", error);
      toast.error("Échec de la réinitialisation des mots de passe.");
    }
  };

  const togglePersonnelSelection = (personnelId: string) => {
    setSelectedPersonnel(prev => {
      const newSet = new Set(prev);
      if (newSet.has(personnelId)) {
        newSet.delete(personnelId);
      } else {
        newSet.add(personnelId);
      }
      return newSet;
    });
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

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'DIRECTEUR_CAMPUS': 'Directeur Campus',
      'ENSEIGNANT': 'Enseignant',
      'COMPTABLE': 'Comptable',
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-brutal flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-medium text-foreground">Gestion du Personnel</h1>
              <p className="text-muted-foreground font-ui mt-1">{personnel.length} membres du personnel</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="brutal-button-secondary inline-flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Template CSV
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="brutal-button-secondary inline-flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="brutal-button-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Personnel
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground mb-1">Total Utilisateurs</p>
              <p className="text-2xl font-serif font-medium text-foreground">{totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground mb-1">Actifs</p>
              <p className="text-2xl font-serif font-medium text-green-600">{activeUsers}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground mb-1">Inactifs</p>
              <p className="text-2xl font-serif font-medium text-red-600">{inactiveUsers}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground mb-1">Directeurs</p>
              <p className="text-2xl font-serif font-medium text-purple-600">{rolesCount['DIRECTEUR_CAMPUS'] || 0}</p>
            </div>
            <Building2 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="brutal-card">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-grow">
            <label htmlFor="search" className="sr-only">Rechercher</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                id="search"
                name="search"
                className="brutal-input pl-10"
                placeholder="Rechercher par nom, email..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <select
            id="role-filter"
            name="role-filter"
            className="brutal-input w-full md:w-auto"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Tous les rôles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="DIRECTEUR_CAMPUS">Directeur Campus</option>
            <option value="ENSEIGNANT">Enseignant</option>
            <option value="COMPTABLE">Comptable</option>
          </select>

          <select
            id="campus-filter"
            name="campus-filter"
            className="brutal-input w-full md:w-auto"
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
          >
            <option value="all">Tous les campus</option>
            {campuses.map(campus => (
              <option key={campus.id} value={campus.id}>{campus.name}</option>
            ))}
          </select>

          <select
            id="status-filter"
            name="status-filter"
            className="brutal-input w-full md:w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        {selectedPersonnel.size > 0 && (
          <div className="flex items-center space-x-3 p-4 bg-accent rounded-brutal border-2 border-border">
            <span className="text-sm font-ui text-foreground">{selectedPersonnel.size} utilisateur(s) sélectionné(s)</span>
            <button
              onClick={handleGenerateAccess}
              className="brutal-button-secondary inline-flex items-center"
            >
              <Key className="w-4 h-4 mr-2" />
              Générer Accès
            </button>
            <button
              onClick={handlePasswordReset}
              className="brutal-button-secondary inline-flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réinitialiser MDP
            </button>
            <button
              onClick={() => exportMutation.mutate({
                data: personnel.filter(p => selectedPersonnel.has(p.id)),
                filters: { roleFilter, campusFilter, searchTerm, statusFilter }
              })}
              className="brutal-button-secondary inline-flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
          </div>
        )}
      </div>

      {/* Personnel Table */}
      <div className="brutal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="focus:ring-primary h-4 w-4 text-primary border-border rounded"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPersonnel(new Set(filteredPersonnel.map(p => p.id)));
                      } else {
                        setSelectedPersonnel(new Set());
                      }
                    }}
                    checked={selectedPersonnel.size === filteredPersonnel.length && filteredPersonnel.length > 0}
                    disabled={filteredPersonnel.length === 0}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Nom
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Rôle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Campus
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Créé le
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {filteredPersonnel.map((person) => (
                <tr key={person.id} className="hover:bg-accent transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="focus:ring-primary h-4 w-4 text-primary border-border rounded"
                      checked={selectedPersonnel.has(person.id)}
                      onChange={() => togglePersonnelSelection(person.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-ui font-medium text-foreground">{person.first_name} {person.last_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-ui">
                    {person.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`brutal-badge text-xs ${getRoleColor(person.role)}`}>
                      {getRoleLabel(person.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-ui">
                    {person.campus_name || 'Non assigné'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`brutal-badge text-xs ${
                      person.email && person.email.length > 0 ? 'brutal-badge-success' : 'brutal-badge-error'
                    }`}>
                      {person.email && person.email.length > 0 ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-ui">
                    {person.created_at ? formatDate(person.created_at, 'dd/MM/yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setEditingPersonnel(person)}
                        className="brutal-button-secondary p-2"
                        title="Modifier l'utilisateur"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {/* Bouton RIB/Factures - Seulement pour les enseignants */}
                      {person.role === 'ENSEIGNANT' && (
                        <button
                          onClick={() => {
                            // Rediriger vers la page des factures avec filtre sur cet enseignant
                            window.location.href = `/invoices?enseignant=${person.id}`;
                          }}
                          className="brutal-button-secondary p-2"
                          title="Voir les factures et RIBs"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            await passwordResetMutation.mutateAsync({ userId: person.id });
                          } catch (error) {
                            console.error('Erreur réinitialisation individuelle:', error);
                          }
                        }}
                        className="brutal-button-secondary p-2"
                        title="Réinitialiser le mot de passe"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { /* TODO: Implement delete logic */ }}
                        className="brutal-button-secondary p-2 text-red-600 hover:text-red-700"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePersonnelModal
          campuses={campuses}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => {
            createMutation.mutate(data);
            setShowCreateModal(false);
          }}
        />
      )}

      {editingPersonnel && (
        <EditPersonnelModal
          personnel={editingPersonnel}
          campuses={campuses}
          onClose={() => setEditingPersonnel(null)}
          onSubmit={(data) => {
            // TODO: Implement update logic
            setEditingPersonnel(null);
          }}
        />
      )}

      {showImportModal && (
        <ImportPersonnelModal
          onClose={() => setShowImportModal(false)}
          onSubmit={(csvContent) => {
            // TODO: Implement import logic
            setShowImportModal(false);
          }}
        />
      )}

      {showTemplateModal && (
        <TemplateModal onClose={() => setShowTemplateModal(false)} />
      )}

      {/* Les informations bancaires sont maintenant gérées par facture */}

      {/* Modal d'affichage des accès générés */}
      <AccessModal
        isOpen={showAccessResultsModal}
        onClose={() => setShowAccessResultsModal(false)}
        generatedAccess={generatedAccess}
        personnel={personnel}
      />

      {/* Modal d'affichage des mots de passe réinitialisés */}
      <PasswordResetModal
        isOpen={showPasswordResetModal}
        onClose={() => setShowPasswordResetModal(false)}
        passwordResetResults={passwordResetResults}
        personnel={personnel}
      />
    </div>
  );
}

// Modal Components avec design néo-brutalist
function CreatePersonnelModal({ campuses, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'ENSEIGNANT',
    campus_id: '',
    password: 'TempPass123!'
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="brutal-card w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-serif font-medium text-foreground">Nouveau Personnel</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-ui font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="brutal-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-ui font-medium text-foreground mb-2">Prénom</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="brutal-input"
                />
              </div>
              <div>
                <label className="block text-sm font-ui font-medium text-foreground mb-2">Nom</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="brutal-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-ui font-medium text-foreground mb-2">Rôle</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="brutal-input"
              >
                <option value="ENSEIGNANT">Enseignant</option>
                <option value="DIRECTEUR_CAMPUS">Directeur Campus</option>
                <option value="COMPTABLE">Comptable</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-ui font-medium text-foreground mb-2">Campus</label>
              <select
                value={formData.campus_id}
                onChange={(e) => setFormData({...formData, campus_id: e.target.value})}
                className="brutal-input"
              >
                <option value="">Sélectionner un campus</option>
                {campuses.map((campus: any) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-ui font-medium text-foreground mb-2">Mot de passe temporaire</label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="brutal-input"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="brutal-button-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="brutal-button-primary"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPersonnelModal({ personnel, campuses, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    email: personnel?.email || '',
    first_name: personnel?.first_name || '',
    last_name: personnel?.last_name || '',
    role: personnel?.role || 'ENSEIGNANT',
    campus_id: personnel?.campus_id || ''
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="brutal-card w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-serif font-medium text-foreground">Modifier Personnel</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-ui font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="brutal-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-ui font-medium text-foreground mb-2">Prénom</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="brutal-input"
                />
              </div>
              <div>
                <label className="block text-sm font-ui font-medium text-foreground mb-2">Nom</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="brutal-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-ui font-medium text-foreground mb-2">Rôle</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="brutal-input"
              >
                <option value="ENSEIGNANT">Enseignant</option>
                <option value="DIRECTEUR_CAMPUS">Directeur Campus</option>
                <option value="COMPTABLE">Comptable</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-ui font-medium text-foreground mb-2">Campus</label>
              <select
                value={formData.campus_id}
                onChange={(e) => setFormData({...formData, campus_id: e.target.value})}
                className="brutal-input"
              >
                <option value="">Sélectionner un campus</option>
                {campuses.map((campus: any) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="brutal-button-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="brutal-button-primary"
            >
              Modifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportPersonnelModal({ onClose, onSubmit }: any) {
  const [csvContent, setCsvContent] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="brutal-card w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-serif font-medium text-foreground">Import CSV</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-ui font-medium text-foreground mb-2">
              Contenu CSV
            </label>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              rows={10}
              className="brutal-input"
              placeholder="Collez ici le contenu de votre fichier CSV..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="brutal-button-secondary"
          >
            Annuler
          </button>
          <button
            onClick={() => onSubmit(csvContent)}
            className="brutal-button-primary"
          >
            Importer
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateModal({ onClose }: any) {
  const templateCSV = `email,first_name,last_name,role,campus_name
prof.nouveau1@aurlom.com,Jean,Dupont,ENSEIGNANT,Roquette
directeur.nouveau@aurlom.com,Marie,Martin,DIRECTEUR_CAMPUS,Douai
comptable.nouveau@aurlom.com,Pierre,Bernard,COMPTABLE,`;

  const handleDownload = () => {
    const blob = new Blob([templateCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_personnel.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openGuide = () => {
    window.open('/templates/GUIDE-IMPORT.txt', '_blank');
  };

  const openLegend = () => {
    window.open('/templates/LEGENDE-ROLES-CAMPUS.txt', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="brutal-card w-full max-w-4xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-serif font-medium text-foreground">Template et guides d'import</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template CSV */}
          <div className="space-y-4">
            <h4 className="text-lg font-serif font-medium text-foreground">Template CSV</h4>
            <p className="text-sm text-muted-foreground font-ui">
              Téléchargez ce template pour importer du personnel en masse.
            </p>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-brutal p-3 mt-3">
              <p className="text-blue-800 text-sm font-ui">
                <strong>Note :</strong> Les informations bancaires (RIB) et les liens Drive vers les factures originales 
                sont maintenant gérées par facture mensuelle. Vous pourrez les saisir lors de la création/modification 
                des factures dans la section "Factures".
              </p>
            </div>
            <pre className="bg-muted p-4 rounded-brutal border-2 border-border text-sm font-mono overflow-x-auto">
              {templateCSV}
            </pre>
            <button
              onClick={handleDownload}
              className="brutal-button-primary w-full inline-flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger le template
            </button>
          </div>

          {/* Guides et légendes */}
          <div className="space-y-4">
            <h4 className="text-lg font-serif font-medium text-foreground">Guides et documentation</h4>
            
            <div className="space-y-3">
              <button
                onClick={openGuide}
                className="brutal-button-secondary w-full justify-start"
              >
                <BookOpen className="w-4 h-4 mr-3" />
                Guide d'import détaillé
              </button>
              
              <button
                onClick={openLegend}
                className="brutal-button-secondary w-full justify-start"
              >
                <Info className="w-4 h-4 mr-3" />
                Légende des rôles et campus
              </button>
            </div>

            {/* Rôles disponibles */}
            <div className="p-4 bg-muted rounded-brutal border-2 border-border">
              <h5 className="font-ui font-medium text-foreground mb-3">Rôles disponibles:</h5>
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
            </div>

            {/* Campus disponibles */}
            <div className="p-4 bg-muted rounded-brutal border-2 border-border">
              <h5 className="font-ui font-medium text-foreground mb-3">Campus disponibles:</h5>
              <div className="grid grid-cols-2 gap-2 text-sm font-ui">
                <span className="text-foreground">Roquette</span>
                <span className="text-foreground">Douai</span>
                <span className="text-foreground">Picpus</span>
                <span className="text-foreground">Jaurès</span>
                <span className="text-foreground">Parmentier</span>
                <span className="text-foreground">Saint-Sébastien</span>
                <span className="text-foreground">Boulogne</span>
                <span className="text-foreground">Sentier</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
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

function PasswordResetModal({ isOpen, onClose, passwordResetResults, personnel }: any) {
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
    const passwords = passwordResetResults
      .filter((r: any) => r.success)
      .map((r: any) => {
        const p = personnel.find((p: any) => p.id === r.userId);
        return `${p?.email}: ${r.newPassword}`;
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
              <span className="text-primary-foreground font-bold">🔄</span>
            </div>
            <div>
              <h3 className="text-lg font-serif font-medium text-foreground">
                Mots de passe réinitialisés
              </h3>
              <p className="text-sm text-muted-foreground font-ui">
                {passwordResetResults.filter((r: any) => r.success).length} mots de passe réinitialisés avec succès
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
            Voici les nouveaux mots de passe générés :
          </p>

          {passwordResetResults.map((result: any, index: number) => {
            const personnelData = personnel.find((p: any) => p.id === result.userId);
            return (
              <div key={index} className="brutal-border p-4 bg-muted">
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
                    {result.success ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="bg-green-100 text-green-800 px-3 py-2 rounded-brutal border-2 border-green-300 shadow-brutal font-mono text-sm font-medium">
                          {result.newPassword}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="brutal-badge-error text-sm">
                          Erreur: {result.error}
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
