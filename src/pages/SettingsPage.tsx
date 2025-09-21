import React, { useState } from 'react';
import { Settings, User, Lock, Bell, Shield, Database, Download, Upload, Save, Eye, EyeOff, Palette, Globe, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useExportData } from '../hooks/useExport';
import { formatDate } from '../lib/utils';
import { useTheme } from '../components/ThemeProvider';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const exportMutation = useExportData();

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'security', name: 'Sécurité', icon: Lock },
    { id: 'appearance', name: 'Apparence', icon: Palette },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    ...(profile?.role === 'SUPER_ADMIN' ? [
      { id: 'system', name: 'Système', icon: Shield },
      { id: 'backup', name: 'Sauvegarde', icon: Database }
    ] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary rounded-brutal flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-medium text-foreground">Paramètres</h1>
            <p className="text-muted-foreground font-ui mt-1">
              Gérez vos préférences et paramètres du compte
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="brutal-card">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-3 text-sm font-ui font-medium rounded-brutal transition-all duration-300 ease-out ${
                      activeTab === tab.id
                        ? 'brutal-button-primary'
                        : 'brutal-button-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="brutal-card">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'appearance' && <AppearanceTab theme={theme} toggleTheme={toggleTheme} />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'system' && profile?.role === 'SUPER_ADMIN' && <SystemTab />}
            {activeTab === 'backup' && profile?.role === 'SUPER_ADMIN' && <BackupTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    email: profile?.email || ''
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', profile?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du profil');
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-medium text-foreground mb-2">Informations du profil</h2>
        <p className="text-muted-foreground font-ui">
          Gérez vos informations personnelles et préférences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-ui font-medium text-foreground mb-2">
              Prénom
            </label>
            <input
              type="text"
              className="brutal-input"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-ui font-medium text-foreground mb-2">
              Nom
            </label>
            <input
              type="text"
              className="brutal-input"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-ui font-medium text-foreground mb-2">
            Email
          </label>
          <input
            type="email"
            className="brutal-input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-ui font-medium text-foreground mb-2">
            Rôle
          </label>
          <div className="brutal-badge-info">
            {profile?.role}
          </div>
        </div>

        <div className="flex space-x-3">
          <button type="submit" className="brutal-button-primary inline-flex items-center">
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </button>
        </div>
      </form>
    </div>
  );
}

function SecurityTab() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Mot de passe mis à jour avec succès');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du mot de passe');
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    updatePasswordMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-medium text-foreground mb-2">Sécurité</h2>
        <p className="text-muted-foreground font-ui">
          Gérez votre mot de passe et paramètres de sécurité.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-ui font-medium text-foreground mb-2">
            Mot de passe actuel
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              className="brutal-input pr-10"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-ui font-medium text-foreground mb-2">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              className="brutal-input pr-10"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-ui font-medium text-foreground mb-2">
            Confirmer le nouveau mot de passe
          </label>
          <input
            type="password"
            className="brutal-input"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />
        </div>

        <div className="flex space-x-3">
          <button type="submit" className="brutal-button-primary inline-flex items-center">
            <Lock className="w-4 h-4 mr-2" />
            Mettre à jour le mot de passe
          </button>
        </div>
      </form>
    </div>
  );
}

function AppearanceTab({ theme, toggleTheme }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-medium text-foreground mb-2">Apparence</h2>
        <p className="text-muted-foreground font-ui">
          Personnalisez l'apparence de votre interface.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-brutal border-2 border-border">
          <div className="flex items-center space-x-3">
            <Palette className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-ui font-medium text-foreground">Thème</h3>
              <p className="text-sm text-muted-foreground font-ui">
                Choisissez entre le mode clair et sombre
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="brutal-button-primary"
          >
            {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-brutal border-2 border-border">
          <div className="flex items-center space-x-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-ui font-medium text-foreground">Langue</h3>
              <p className="text-sm text-muted-foreground font-ui">
                Français (par défaut)
              </p>
            </div>
          </div>
          <select className="brutal-input w-auto">
            <option value="fr">Français</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    invoiceUpdates: true,
    systemAlerts: true,
    weeklyReports: false
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications({ ...notifications, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-medium text-foreground mb-2">Notifications</h2>
        <p className="text-muted-foreground font-ui">
          Configurez vos préférences de notification.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-brutal border-2 border-border">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-ui font-medium text-foreground">Notifications par email</h3>
              <p className="text-sm text-muted-foreground font-ui">
                Recevez des notifications importantes par email
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
            checked={notifications.email}
            onChange={(e) => handleNotificationChange('email', e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-brutal border-2 border-border">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-ui font-medium text-foreground">Mises à jour de factures</h3>
              <p className="text-sm text-muted-foreground font-ui">
                Être notifié des changements de statut des factures
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
            checked={notifications.invoiceUpdates}
            onChange={(e) => handleNotificationChange('invoiceUpdates', e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-brutal border-2 border-border">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-ui font-medium text-foreground">Alertes système</h3>
              <p className="text-sm text-muted-foreground font-ui">
                Recevoir des alertes de sécurité et système
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
            checked={notifications.systemAlerts}
            onChange={(e) => handleNotificationChange('systemAlerts', e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
}

function SystemTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-medium text-foreground mb-2">Paramètres système</h2>
        <p className="text-muted-foreground font-ui">
          Configuration avancée du système (réservé aux super administrateurs).
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-red-50 rounded-brutal border-2 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-ui font-medium text-red-800">Zone dangereuse</h3>
              <p className="text-sm text-red-600 font-ui">
                Les actions suivantes peuvent affecter l'ensemble du système.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-brutal border-2 border-border">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-ui font-medium text-foreground">Réinitialiser la base de données</h3>
              <p className="text-sm text-muted-foreground font-ui">
                Supprime toutes les données (IRRÉVERSIBLE)
              </p>
            </div>
          </div>
          <button className="brutal-button-secondary text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}

function BackupTab() {
  const exportMutation = useExportData();

  const handleExportAll = async () => {
    try {
      await exportMutation.mutateAsync({ type: 'all' });
      toast.success('Export terminé avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-medium text-foreground mb-2">Sauvegarde et export</h2>
        <p className="text-muted-foreground font-ui">
          Gérez les sauvegardes et exports de données.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-brutal border-2 border-border">
          <div className="flex items-center space-x-3">
            <Download className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-ui font-medium text-foreground">Export complet</h3>
              <p className="text-sm text-muted-foreground font-ui">
                Télécharger toutes les données au format CSV
              </p>
            </div>
          </div>
          <button
            onClick={handleExportAll}
            className="brutal-button-primary inline-flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter tout
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-brutal border-2 border-border">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-ui font-medium text-foreground">Sauvegarde automatique</h3>
              <p className="text-sm text-muted-foreground font-ui">
                Configurer les sauvegardes automatiques
              </p>
            </div>
          </div>
          <select className="brutal-input w-auto">
            <option value="disabled">Désactivée</option>
            <option value="daily">Quotidienne</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuelle</option>
          </select>
        </div>
      </div>
    </div>
  );
}