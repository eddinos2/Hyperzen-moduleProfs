import React from 'react';
import { Users, FileText, TrendingUp, AlertCircle, Building2, Clock, CheckCircle, Euro, Activity, Target, Zap, Award, Eye, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useInvoices } from '../hooks/useInvoices';
import { useCampusStats } from '../hooks/useStats';
import { formatAmount, formatDate, getStatusColor, getStatusLabel } from '../lib/utils';

export default function DirectorDashboard() {
  const { profile } = useAuth();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: campusStats, isLoading: statsLoading } = useCampusStats(profile?.campus_id);

  if (!profile || profile.role !== 'DIRECTEUR_CAMPUS') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="brutal-card text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-medium text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground font-ui">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (invoicesLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filtrer les factures de ce campus uniquement
  const campusInvoices = invoices.filter(inv => inv.campus_id === profile.campus_id);
  const pendingInvoices = campusInvoices.filter(inv => inv.status === 'submitted');
  const prevalidatedInvoices = campusInvoices.filter(inv => inv.status === 'prevalidated');

  const stats = [
    {
      name: 'Professeurs du campus',
      value: campusStats?.totalTeachers?.toString() || '0',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: campusStats?.totalTeachers ? `${campusStats.totalTeachers} actifs` : 'Aucun',
      changeType: 'neutral'
    },
    {
      name: 'Factures à prévalider',
      value: pendingInvoices.length.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: pendingInvoices.length > 0 ? formatAmount(pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)) : 'Aucune',
      changeType: pendingInvoices.length > 0 ? 'positive' : 'neutral'
    },
    {
      name: 'Factures prévalidées',
      value: prevalidatedInvoices.length.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: prevalidatedInvoices.length > 0 ? 'En attente validation' : 'Aucune',
      changeType: prevalidatedInvoices.length > 0 ? 'positive' : 'neutral'
    },
    {
      name: 'Total du campus',
      value: formatAmount(campusStats?.totalAmount || 0),
      icon: Euro,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: campusStats?.totalAmount ? `${((campusStats.totalAmount || 0) / 60).toFixed(1)}h` : '0h',
      changeType: 'positive'
    }
  ];

  // Prendre les 5 factures en attente les plus récentes
  const recentPendingInvoices = pendingInvoices
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getIcon = (iconName: any) => {
    return <iconName className="w-6 h-6" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'prevalidated':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'validated':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'paid':
        return <Euro className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'brutal-badge-warning';
      case 'prevalidated':
        return 'brutal-badge-info';
      case 'validated':
        return 'brutal-badge-success';
      case 'paid':
        return 'brutal-badge-success';
      default:
        return 'brutal-badge';
    }
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
              <h1 className="text-3xl font-serif font-medium text-foreground">Dashboard Directeur</h1>
              <p className="text-muted-foreground font-ui mt-1">
                Bienvenue {profile.first_name} {profile.last_name}
              </p>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-ui text-foreground">
                    Campus: {campusInvoices[0]?.campus?.name || profile.campus?.name || 'Non assigné'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-ui text-muted-foreground">
                    {campusStats?.totalInvoices || 0} factures • {formatAmount(campusStats?.totalAmount || 0)} total
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <span className="brutal-badge-info">
              Directeur Campus
            </span>
            <Link
              to="/prevalidation"
              className="brutal-button-primary inline-flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Prévalider
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="brutal-card">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-ui font-medium text-muted-foreground mb-1">
                  {stat.name}
                </p>
                <p className="text-2xl font-serif font-medium text-foreground mb-2">
                  {stat.value}
                </p>
                <div className="flex items-center space-x-2">
                  <TrendingUp className={`w-4 h-4 ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`} />
                  <span className={`text-sm font-ui font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-brutal flex items-center justify-center`}>
                <div className={stat.color}>
                  {getIcon(stat.icon)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Factures en attente de prévalidation */}
        <div className="lg:col-span-2">
          <div className="brutal-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-brutal flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-medium text-foreground">
                    Factures à prévalider
                  </h2>
                  <p className="text-sm text-muted-foreground font-ui">
                    {pendingInvoices.length} factures en attente
                  </p>
                </div>
              </div>
              <Link
                to="/prevalidation"
                className="brutal-button-secondary text-sm"
              >
                Voir toutes
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentPendingInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-start space-x-4 p-4 bg-muted rounded-brutal border-2 border-border">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(invoice.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-ui font-medium text-foreground">
                        Facture #{invoice.id.substring(0, 8)}...
                      </p>
                      <span className={`brutal-badge text-xs ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-ui mt-1">
                      {invoice.professor?.first_name} {invoice.professor?.last_name}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground font-ui">
                        {formatDate(invoice.created_at, 'dd/MM/yyyy')}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-ui font-medium text-foreground">
                          {formatAmount(invoice.total_amount)}
                        </p>
                        <Link
                          to={`/prevalidation/${invoice.id}`}
                          className="brutal-button-secondary p-1"
                          title="Prévalider"
                        >
                          <Eye className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pendingInvoices.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-serif font-medium text-foreground mb-2">
                  Aucune facture en attente
                </h3>
                <p className="text-muted-foreground font-ui">
                  Toutes les factures de votre campus ont été traitées.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides et informations */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="brutal-card">
            <h2 className="text-xl font-serif font-medium text-foreground mb-6">
              Actions rapides
            </h2>
            
            <div className="space-y-3">
              <Link
                to="/prevalidation"
                className="w-full brutal-button-primary justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-3" />
                Prévalider factures
              </Link>
              
              <Link
                to="/invoices"
                className="w-full brutal-button-secondary justify-start"
              >
                <FileText className="w-4 h-4 mr-3" />
                Voir toutes les factures
              </Link>
              
              <Link
                to="/personnel"
                className="w-full brutal-button-secondary justify-start"
              >
                <Users className="w-4 h-4 mr-3" />
                Gérer les professeurs
              </Link>
              
              <Link
                to="/reports"
                className="w-full brutal-button-secondary justify-start"
              >
                <Target className="w-4 h-4 mr-3" />
                Rapports campus
              </Link>
            </div>
          </div>

          {/* Statistiques du campus */}
          <div className="brutal-card">
            <h2 className="text-xl font-serif font-medium text-foreground mb-6">
              Statistiques campus
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Total factures</span>
                <span className="font-ui font-medium text-foreground">
                  {campusStats?.totalInvoices || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Montant total</span>
                <span className="font-ui font-medium text-foreground">
                  {formatAmount(campusStats?.totalAmount || 0)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Heures totales</span>
                <span className="font-ui font-medium text-foreground">
                  {((campusStats?.totalAmount || 0) / 60).toFixed(1)}h
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Professeurs actifs</span>
                <span className="font-ui font-medium text-foreground">
                  {campusStats?.totalTeachers || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Dernières activités */}
          <div className="brutal-card">
            <h2 className="text-xl font-serif font-medium text-foreground mb-6">
              Dernières activités
            </h2>
            
            <div className="space-y-3">
              {campusInvoices
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 3)
                .map((invoice) => (
                  <div key={invoice.id} className="flex items-center space-x-3 p-3 bg-muted rounded-brutal border-2 border-border">
                    <div className="flex-shrink-0">
                      {getStatusIcon(invoice.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-ui font-medium text-foreground truncate">
                        {invoice.professor?.first_name} {invoice.professor?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground font-ui">
                        {formatDate(invoice.created_at, 'dd/MM HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-ui font-medium text-foreground">
                        {formatAmount(invoice.total_amount)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}