import React from 'react';
import { 
  Users, 
  FileText, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  Target,
  Zap,
  Award,
  Activity
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useBusinessKPIs } from '../hooks/useBusinessKPIs';
import { useAuth } from '../lib/auth';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardData();
  const { data: kpiData, isLoading: kpiLoading } = useBusinessKPIs();

  const isLoading = dashboardLoading || kpiLoading;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'prevalidated':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'validated':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'paid':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
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

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      'Users': Users,
      'FileText': FileText,
      'Building2': Building2,
      'DollarSign': DollarSign
    };
    const Icon = icons[iconName] || Users;
    return <Icon className="w-6 h-6" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-medium text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground font-ui mt-1">
              Vue d'ensemble de votre plateforme AURLOM
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="brutal-button-secondary inline-flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Aujourd'hui
            </button>
            <button className="brutal-button-primary inline-flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Rapport
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid - VRAIES DONNÉES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData?.stats.map((stat, index) => (
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
                  <span className="text-xs text-muted-foreground font-ui">vs mois dernier</span>
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

      {/* KPI Métier Intelligents */}
      {kpiData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Professeurs par Efficacité */}
          <div className="brutal-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-brutal flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-medium text-foreground">
                    Top Professeurs par Efficacité
                  </h2>
                  <p className="text-sm text-muted-foreground font-ui">
                    Ratio €/heure le plus élevé
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {kpiData.topPerformers.professorsByEfficiency.map((prof, index) => (
                <div key={prof.id} className="flex items-center justify-between p-3 bg-muted rounded-brutal border-2 border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-brutal flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-ui font-medium text-foreground">
                        {prof.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-ui">
                        {prof.totalHours}h • {prof.totalPrestations} prestations
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-ui font-medium text-foreground">
                      {prof.totalEarned.toFixed(0)}€
                    </p>
                    <p className="text-xs text-muted-foreground font-ui">
                      {prof.efficiency.toFixed(1)}€/h
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Campus par Revenus */}
          <div className="brutal-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-brutal flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-medium text-foreground">
                    Top Campus par Revenus
                  </h2>
                  <p className="text-sm text-muted-foreground font-ui">
                    Chiffre d'affaires validé
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {kpiData.topPerformers.campusesByRevenue.map((campus, index) => (
                <div key={campus.id} className="flex items-center justify-between p-3 bg-muted rounded-brutal border-2 border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-brutal flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-ui font-medium text-foreground">
                        {campus.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-ui">
                        {campus.professorCount} profs • {campus.totalHours}h
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-ui font-medium text-foreground">
                      {campus.totalRevenue.toFixed(0)}€
                    </p>
                    <p className="text-xs text-muted-foreground font-ui">
                      {campus.efficiency.toFixed(0)}€/prof
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activités récentes - VRAIES DONNÉES */}
        <div className="lg:col-span-2">
          <div className="brutal-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-brutal flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-medium text-foreground">
                    Activités récentes
                  </h2>
                  <p className="text-sm text-muted-foreground font-ui">
                    Dernières factures traitées
                  </p>
                </div>
              </div>
              <button className="brutal-button-secondary text-sm">
                Voir tout
              </button>
            </div>
            
            <div className="space-y-4">
              {dashboardData?.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-muted rounded-brutal border-2 border-border">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-ui font-medium text-foreground">
                        {activity.title}
                      </p>
                      <span className={`brutal-badge text-xs ${getStatusColor(activity.status)}`}>
                        {getStatusLabel(activity.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-ui mt-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground font-ui">
                        {activity.time}
                      </p>
                      {activity.amount && (
                        <p className="text-xs font-ui font-medium text-foreground">
                          {activity.amount.toFixed(0)}€
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="space-y-6">
          <div className="brutal-card">
            <h2 className="text-xl font-serif font-medium text-foreground mb-6">
              Actions rapides
            </h2>
            
            <div className="space-y-3">
              <button className="w-full brutal-button-primary justify-start">
                <FileText className="w-4 h-4 mr-3" />
                Nouvelle facture
              </button>
              
              <button className="w-full brutal-button-secondary justify-start">
                <Users className="w-4 h-4 mr-3" />
                Ajouter utilisateur
              </button>
              
              <button className="w-full brutal-button-secondary justify-start">
                <Building2 className="w-4 h-4 mr-3" />
                Gérer campus
              </button>
              
              <button className="w-full brutal-button-secondary justify-start">
                <BarChart3 className="w-4 h-4 mr-3" />
                Générer rapport
              </button>
            </div>
          </div>

          {/* Métriques globales */}
          {kpiData && (
            <div className="brutal-card">
              <h2 className="text-xl font-serif font-medium text-foreground mb-6">
                Métriques globales
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-ui text-muted-foreground">Taux horaire moyen</span>
                  <span className="font-ui font-medium text-foreground">
                    {kpiData.globalMetrics.systemAverageHourlyRate.toFixed(1)}€/h
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-ui text-muted-foreground">CA par professeur</span>
                  <span className="font-ui font-medium text-foreground">
                    {kpiData.globalMetrics.systemRevenuePerProfessor.toFixed(0)}€
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-ui text-muted-foreground">Total prestations</span>
                  <span className="font-ui font-medium text-foreground">
                    {kpiData.globalMetrics.totalPrestations}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-ui text-muted-foreground">Heures totales</span>
                  <span className="font-ui font-medium text-foreground">
                    {kpiData.globalMetrics.totalSystemHours}h
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}