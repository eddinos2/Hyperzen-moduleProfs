import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2, Users, MapPin, User, Search, Filter, Calendar, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useCampus, useCreateCampus, useUpdateCampus, useDeleteCampus } from '../hooks/useCampus';
import { usePersonnel } from '../hooks/usePersonnel';
import { formatDate } from '../lib/utils';

export default function CampusPage() {
  const { profile } = useAuth();
  const { data: campuses = [], isLoading } = useCampus();
  const { data: personnel = [] } = usePersonnel();
  const createMutation = useCreateCampus();
  const updateMutation = useUpdateCampus();
  const deleteMutation = useDeleteCampus();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampus, setEditingCampus] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (!profile || profile.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="brutal-card text-center">
          <Building2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-medium text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground font-ui">Seuls les super administrateurs peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const directeurs = personnel.filter(p => p.role === 'DIRECTEUR_CAMPUS');
  const enseignants = personnel.filter(p => p.role === 'ENSEIGNANT');

  // Filtrage des campus
  const filteredCampuses = campuses.filter(campus => {
    const matchesSearch = campus.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campus.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const hasDirector = !!campus.directeur_id;
      const hasTeachers = enseignants.some(teacher => teacher.campus_id === campus.id);
      
      switch (statusFilter) {
        case 'with_director':
          matchesStatus = hasDirector;
          break;
        case 'with_teachers':
          matchesStatus = hasTeachers;
          break;
        case 'complete':
          matchesStatus = hasDirector && hasTeachers;
          break;
        case 'incomplete':
          matchesStatus = !hasDirector || !hasTeachers;
          break;
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      name: 'Total Campus',
      value: campuses.length,
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      name: 'Avec Directeur',
      value: campuses.filter(c => c.directeur_id).length,
      icon: User,
      color: 'bg-green-500'
    },
    {
      name: 'Avec Professeurs',
      value: [...new Set(enseignants.map(e => e.campus_id))].length,
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      name: 'Complets',
      value: campuses.filter(c => 
        c.directeur_id && enseignants.some(e => e.campus_id === c.id)
      ).length,
      icon: Award,
      color: 'bg-orange-500'
    }
  ];

  const handleCreate = async (data: any) => {
    try {
      await createMutation.mutateAsync(data);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Erreur création campus:', error);
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      await updateMutation.mutateAsync({ id, ...data });
      setEditingCampus(null);
    } catch (error) {
      console.error('Erreur mise à jour campus:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce campus ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Erreur suppression campus:', error);
      }
    }
  };

  const getCampusTeachers = (campusId: string) => {
    return enseignants.filter(teacher => teacher.campus_id === campusId);
  };

  const getCampusDirector = (campusId: string) => {
    const campus = campuses.find(c => c.id === campusId);
    return campus?.directeur_id ? directeurs.find(d => d.id === campus.directeur_id) : null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-brutal flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-medium text-foreground">Gestion des Campus</h1>
              <p className="text-muted-foreground font-ui mt-1">
                {filteredCampuses.length} campus sur {campuses.length} total
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="brutal-button-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Campus
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="brutal-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-ui font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-serif font-medium text-foreground">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-brutal flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="brutal-card">
        <div className="flex flex-wrap items-center gap-4">
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
                placeholder="Rechercher par nom ou adresse..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="brutal-input w-auto"
            >
              <option value="all">Tous les campus</option>
              <option value="with_director">Avec directeur</option>
              <option value="with_teachers">Avec professeurs</option>
              <option value="complete">Complets</option>
              <option value="incomplete">Incomplets</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des campus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCampuses.map((campus) => {
          const director = getCampusDirector(campus.id);
          const teachers = getCampusTeachers(campus.id);
          const isComplete = !!director && teachers.length > 0;

          return (
            <div key={campus.id} className="brutal-card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-brutal flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-medium text-foreground">
                      {campus.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-ui flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {campus.address || 'Adresse non renseignée'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`brutal-badge text-xs ${
                    isComplete ? 'brutal-badge-success' : 'brutal-badge-warning'
                  }`}>
                    {isComplete ? 'Complet' : 'Incomplet'}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditingCampus(campus)}
                      className="brutal-button-secondary p-2"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(campus.id)}
                      className="brutal-button-secondary p-2 text-red-600 hover:text-red-700"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Directeur */}
              <div className="mb-4">
                <h4 className="text-sm font-ui font-medium text-muted-foreground mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Directeur
                </h4>
                {director ? (
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-brutal border-2 border-border">
                    <div className="w-8 h-8 bg-green-100 rounded-brutal flex items-center justify-center">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-ui font-medium text-foreground">
                        {director.first_name} {director.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground font-ui">
                        {director.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-brutal border-2 border-dashed border-border">
                    <p className="text-sm text-muted-foreground font-ui">
                      Aucun directeur assigné
                    </p>
                  </div>
                )}
              </div>

              {/* Professeurs */}
              <div>
                <h4 className="text-sm font-ui font-medium text-muted-foreground mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Professeurs ({teachers.length})
                </h4>
                {teachers.length > 0 ? (
                  <div className="space-y-2">
                    {teachers.slice(0, 3).map((teacher) => (
                      <div key={teacher.id} className="flex items-center space-x-3 p-2 bg-muted rounded-brutal border-2 border-border">
                        <div className="w-6 h-6 bg-purple-100 rounded-brutal flex items-center justify-center">
                          <Users className="w-3 h-3 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-ui font-medium text-foreground">
                            {teacher.first_name} {teacher.last_name}
                          </p>
                        </div>
                      </div>
                    ))}
                    {teachers.length > 3 && (
                      <p className="text-xs text-muted-foreground font-ui text-center">
                        +{teachers.length - 3} autres professeurs
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-brutal border-2 border-dashed border-border">
                    <p className="text-sm text-muted-foreground font-ui">
                      Aucun professeur assigné
                    </p>
                  </div>
                )}
              </div>

              {/* Métadonnées */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-ui">
                  <span>Créé le {formatDate(campus.created_at, 'dd/MM/yyyy')}</span>
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {campus.updated_at && formatDate(campus.updated_at, 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCampuses.length === 0 && (
        <div className="brutal-card text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-serif font-medium text-foreground mb-2">
            Aucun campus trouvé
          </h3>
          <p className="text-muted-foreground font-ui mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Aucun campus ne correspond à vos critères de recherche.'
              : 'Commencez par créer votre premier campus.'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="brutal-button-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un campus
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateCampusModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          directeurs={directeurs}
        />
      )}

      {editingCampus && (
        <EditCampusModal
          campus={editingCampus}
          onClose={() => setEditingCampus(null)}
          onSubmit={(data) => handleUpdate(editingCampus.id, data)}
          directeurs={directeurs}
        />
      )}
    </div>
  );
}

// Composants modals simplifiés
function CreateCampusModal({ onClose, onSubmit, directeurs }: any) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    directeur_id: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="brutal-card max-w-md w-full mx-4">
        <h2 className="text-xl font-serif font-medium text-foreground mb-4">
          Créer un campus
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-ui font-medium text-foreground mb-2">
              Nom du campus
            </label>
            <input
              type="text"
              className="brutal-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-ui font-medium text-foreground mb-2">
              Adresse
            </label>
            <input
              type="text"
              className="brutal-input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-ui font-medium text-foreground mb-2">
              Directeur
            </label>
            <select
              className="brutal-input"
              value={formData.directeur_id}
              onChange={(e) => setFormData({ ...formData, directeur_id: e.target.value })}
            >
              <option value="">Aucun directeur</option>
              {directeurs.map((directeur: any) => (
                <option key={directeur.id} value={directeur.id}>
                  {directeur.first_name} {directeur.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-3">
            <button type="submit" className="brutal-button-primary flex-1">
              Créer
            </button>
            <button type="button" onClick={onClose} className="brutal-button-secondary flex-1">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCampusModal({ campus, onClose, onSubmit, directeurs }: any) {
  const [formData, setFormData] = useState({
    name: campus.name || '',
    address: campus.address || '',
    directeur_id: campus.directeur_id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="brutal-card max-w-md w-full mx-4">
        <h2 className="text-xl font-serif font-medium text-foreground mb-4">
          Modifier le campus
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-ui font-medium text-foreground mb-2">
              Nom du campus
            </label>
            <input
              type="text"
              className="brutal-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-ui font-medium text-foreground mb-2">
              Adresse
            </label>
            <input
              type="text"
              className="brutal-input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-ui font-medium text-foreground mb-2">
              Directeur
            </label>
            <select
              className="brutal-input"
              value={formData.directeur_id}
              onChange={(e) => setFormData({ ...formData, directeur_id: e.target.value })}
            >
              <option value="">Aucun directeur</option>
              {directeurs.map((directeur: any) => (
                <option key={directeur.id} value={directeur.id}>
                  {directeur.first_name} {directeur.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-3">
            <button type="submit" className="brutal-button-primary flex-1">
              Modifier
            </button>
            <button type="button" onClick={onClose} className="brutal-button-secondary flex-1">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}