import React, { useState } from 'react';
import { Shield, Search, Filter, Eye, Calendar, User, FileText, Download, Activity, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';

export default function AuditPage() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', searchTerm, actionFilter, dateFilter, userFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles!audit_logs_actor_id_fkey(first_name, last_name, email, role)
        `)
        .order('created_at', { ascending: false });

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate;
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        }
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile && ['SUPER_ADMIN', 'COMPTABLE'].includes(profile.role || ''),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Filtrage côté client pour la recherche
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = userFilter === 'all' || 
      (userFilter === 'me' && log.actor_id === profile?.id) ||
      (userFilter !== 'me' && log.profiles?.role === userFilter);
    
    return matchesSearch && matchesUser;
  });

  if (!profile || !['SUPER_ADMIN', 'COMPTABLE'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="brutal-card text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-medium text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground font-ui">Seuls les administrateurs et comptables peuvent accéder à cette page.</p>
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

  // Statistiques des actions
  const actionStats = {
    total: auditLogs.length,
    create: auditLogs.filter(log => log.action === 'CREATE').length,
    update: auditLogs.filter(log => log.action === 'UPDATE').length,
    delete: auditLogs.filter(log => log.action === 'DELETE').length,
    login: auditLogs.filter(log => log.action === 'LOGIN').length,
    logout: auditLogs.filter(log => log.action === 'LOGOUT').length,
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'UPDATE':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'DELETE':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'LOGIN':
        return <User className="w-4 h-4 text-green-600" />;
      case 'LOGOUT':
        return <User className="w-4 h-4 text-gray-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'brutal-badge-success';
      case 'UPDATE':
        return 'brutal-badge-info';
      case 'DELETE':
        return 'brutal-badge-error';
      case 'LOGIN':
        return 'brutal-badge-success';
      case 'LOGOUT':
        return 'brutal-badge';
      default:
        return 'brutal-badge';
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Action', 'Utilisateur', 'Rôle', 'Détails', 'IP', 'User Agent'].join(','),
      ...filteredLogs.map(log => [
        formatDate(log.created_at, 'dd/MM/yyyy HH:mm:ss'),
        log.action,
        `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.trim(),
        log.profiles?.role || '',
        `"${log.details || ''}"`,
        log.ip_address || '',
        `"${log.user_agent || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-brutal flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-medium text-foreground">Journal d'Audit</h1>
              <p className="text-muted-foreground font-ui mt-1">
                {filteredLogs.length} événements sur {auditLogs.length} total
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={exportLogs}
              className="brutal-button-primary inline-flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">Total</p>
              <p className="text-xl font-serif font-medium text-foreground">{actionStats.total}</p>
            </div>
            <Activity className="w-6 h-6 text-gray-500" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">Créations</p>
              <p className="text-xl font-serif font-medium text-foreground">{actionStats.create}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">Modifications</p>
              <p className="text-xl font-serif font-medium text-foreground">{actionStats.update}</p>
            </div>
            <Eye className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">Suppressions</p>
              <p className="text-xl font-serif font-medium text-foreground">{actionStats.delete}</p>
            </div>
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">Connexions</p>
              <p className="text-xl font-serif font-medium text-foreground">{actionStats.login}</p>
            </div>
            <User className="w-6 h-6 text-green-500" />
          </div>
        </div>
        
        <div className="brutal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-ui font-medium text-muted-foreground">Déconnexions</p>
              <p className="text-xl font-serif font-medium text-foreground">{actionStats.logout}</p>
            </div>
            <User className="w-6 h-6 text-gray-500" />
          </div>
        </div>
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
                placeholder="Rechercher dans les logs..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="brutal-input w-auto"
            >
              <option value="all">Toutes les actions</option>
              <option value="CREATE">Créations</option>
              <option value="UPDATE">Modifications</option>
              <option value="DELETE">Suppressions</option>
              <option value="LOGIN">Connexions</option>
              <option value="LOGOUT">Déconnexions</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="brutal-input w-auto"
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="me">Mes actions</option>
              <option value="SUPER_ADMIN">Super Admins</option>
              <option value="COMPTABLE">Comptables</option>
              <option value="DIRECTEUR_CAMPUS">Directeurs</option>
              <option value="ENSEIGNANT">Enseignants</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="brutal-input w-auto"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des logs */}
      <div className="brutal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Date/Heure
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Utilisateur
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Détails
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-accent transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-ui text-foreground">
                      {formatDate(log.created_at, 'dd/MM/yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground font-ui">
                      {formatDate(log.created_at, 'HH:mm:ss')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getActionIcon(log.action)}
                      <span className={`brutal-badge text-xs ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-secondary rounded-brutal flex items-center justify-center">
                        <User className="w-4 h-4 text-secondary-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-ui font-medium text-foreground">
                          {log.profiles?.first_name} {log.profiles?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground font-ui">
                          {log.profiles?.role} • {log.profiles?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-ui text-foreground max-w-xs truncate">
                      {log.details || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-muted-foreground font-ui">
                      {log.ip_address || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-serif font-medium text-foreground mb-2">
              Aucun événement trouvé
            </h3>
            <p className="text-muted-foreground font-ui">
              {searchTerm || actionFilter !== 'all' || dateFilter !== 'all' || userFilter !== 'all'
                ? 'Aucun événement ne correspond à vos critères de recherche.'
                : 'Aucun événement n\'a encore été enregistré.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}