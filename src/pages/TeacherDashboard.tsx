import React from 'react';
import { FileText, Clock, Euro, TrendingUp, AlertCircle, Plus, Calendar, Upload, Eye, User, Activity, Target, Zap, Award } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useInvoices } from '../hooks/useInvoices';
import { useTeacherStats } from '../hooks/useStats';
import { formatAmount, formatDate, getStatusColor, getStatusLabel } from '../lib/utils';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: teacherStats, isLoading: statsLoading } = useTeacherStats(profile?.id);

  if (!profile || profile.role !== 'ENSEIGNANT') {
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

  const pendingInvoices = invoices.filter(inv => inv.status === 'submitted');
  const currentMonthHours = (teacherStats?.currentMonthAmount || 0) / 60;
  const totalHours = (teacherStats?.totalAmount || 0) / 60;

  const stats = [
    {
      name: 'Heures ce mois',
      value: `${currentMonthHours.toFixed(1)}h`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: currentMonthHours > 0 ? `${teacherStats?.currentMonthInvoices || 0} facture(s)` : '0h',
      changeType: currentMonthHours > 0 ? 'positive' : 'neutral'
    },
    {
      name: 'Factures en cours',
      value: pendingInvoices.length.toString(),
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: pendingInvoices.length > 0 ? `${pendingInvoices.length} nouvelle${pendingInvoices.length > 1 ? 's' : ''}` : 'Aucune',
      changeType: pendingInvoices.length > 0 ? 'positive' : 'neutral'
    },
    {
      name: 'Montant total',
      value: formatAmount(teacherStats?.totalAmount || 0),
      icon: Euro,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: `${totalHours.toFixed(1)}h enseignées`,
      changeType: 'positive'
    },
    {
      name: 'Montant payé',
      value: formatAmount(teacherStats?.paidAmount || 0),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: 'Reçu',
      changeType: 'neutral'
    }
  ];

  // Prendre les 5 dernières factures
  const recentInvoices = invoices
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
        return <Target className="w-4 h-4 text-blue-600" />;
      case 'validated':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'paid':
        return <Euro className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
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
      case 'rejected':
        return 'brutal-badge-error';
      default:
        return 'brutal-badge';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'submitted': 'Soumis',
      'prevalidated': 'Prévalidé',
      'validated': 'Validé',
      'paid': 'Payé',
      'rejected': 'Rejeté'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-brutal flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-medium text-foreground">Dashboard Professeur</h1>
              <p className="text-muted-foreground font-ui mt-1">
                Bienvenue {profile.first_name} {profile.last_name}
              </p>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-ui text-foreground">
                    {teacherStats?.totalInvoices || 0} factures soumises
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-ui text-foreground">
                    {formatAmount(teacherStats?.pendingAmount || 0)} en attente
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <span className="brutal-badge-success">
              Enseignant
            </span>
            <Link
              to="/invoices"
              className="brutal-button-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle facture
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
        {/* Factures récentes */}
        <div className="lg:col-span-2">
          <div className="brutal-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-brutal flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-medium text-foreground">
                    Mes factures récentes
                  </h2>
                  <p className="text-sm text-muted-foreground font-ui">
                    {invoices.length} factures au total
                  </p>
                </div>
              </div>
              <Link
                to="/invoices"
                className="brutal-button-secondary text-sm"
              >
                Voir toutes
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
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
                      Campus: {invoice.campus?.name || 'Non assigné'}
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
                          to={`/professor/invoices/${invoice.id}`}
                          className="brutal-button-secondary p-1"
                          title="Voir les détails"
                        >
                          <Eye className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {invoices.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-serif font-medium text-foreground mb-2">
                  Aucune facture
                </h3>
                <p className="text-muted-foreground font-ui mb-4">
                  Commencez par créer votre première facture.
                </p>
                <Link
                  to="/invoices"
                  className="brutal-button-primary inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une facture
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides et statistiques */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="brutal-card">
            <h2 className="text-xl font-serif font-medium text-foreground mb-6">
              Actions rapides
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link
                to="/invoices"
                className="brutal-button-primary justify-center sm:justify-start flex items-center"
              >
                <Plus className="w-4 h-4 mr-2 sm:mr-3" />
                <span className="hidden sm:inline">Nouvelle facture</span>
                <span className="sm:hidden">Nouvelle</span>
              </Link>
              
              <Link
                to="/invoices"
                className="brutal-button-secondary justify-center sm:justify-start flex items-center"
              >
                <FileText className="w-4 h-4 mr-2 sm:mr-3" />
                <span className="hidden sm:inline">Mes factures</span>
                <span className="sm:hidden">Factures</span>
              </Link>
              
              <Link
                to="/import"
                className="brutal-button-secondary justify-center sm:justify-start flex items-center"
              >
                <Upload className="w-4 h-4 mr-2 sm:mr-3" />
                <span className="hidden sm:inline">Importer CSV</span>
                <span className="sm:hidden">Import</span>
              </Link>
              
              <Link
                to="/reports"
                className="brutal-button-secondary justify-center sm:justify-start flex items-center"
              >
                <Target className="w-4 h-4 mr-2 sm:mr-3" />
                <span className="hidden sm:inline">Mes rapports</span>
                <span className="sm:hidden">Rapports</span>
              </Link>
            </div>
          </div>

          {/* Statistiques personnelles */}
          <div className="brutal-card">
            <h2 className="text-xl font-serif font-medium text-foreground mb-6">
              Mes statistiques
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Total factures</span>
                <span className="font-ui font-medium text-foreground">
                  {teacherStats?.totalInvoices || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Montant total</span>
                <span className="font-ui font-medium text-foreground">
                  {formatAmount(teacherStats?.totalAmount || 0)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Heures enseignées</span>
                <span className="font-ui font-medium text-foreground">
                  {totalHours.toFixed(1)}h
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Montant payé</span>
                <span className="font-ui font-medium text-foreground">
                  {formatAmount(teacherStats?.paidAmount || 0)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Taux horaire moyen</span>
                <span className="font-ui font-medium text-foreground">
                  {totalHours > 0 ? (teacherStats?.totalAmount || 0) / totalHours : 0}€/h
                </span>
              </div>
            </div>
          </div>

          {/* Performance du mois */}
          <div className="brutal-card">
            <h2 className="text-xl font-serif font-medium text-foreground mb-6">
              Performance ce mois
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Factures ce mois</span>
                <span className="font-ui font-medium text-foreground">
                  {teacherStats?.currentMonthInvoices || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Heures ce mois</span>
                <span className="font-ui font-medium text-foreground">
                  {currentMonthHours.toFixed(1)}h
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Montant ce mois</span>
                <span className="font-ui font-medium text-foreground">
                  {formatAmount(teacherStats?.currentMonthAmount || 0)}
                </span>
              </div>
              
              <div className="p-3 bg-muted rounded-brutal border-2 border-border">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-ui font-medium text-foreground">
                    Objectif mensuel
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-ui mt-1">
                  {currentMonthHours >= 40 ? '✅ Objectif atteint !' : `${(40 - currentMonthHours).toFixed(1)}h restantes`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}