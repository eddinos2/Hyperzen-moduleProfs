import React, { useState } from 'react';
import { 
  BarChart3, Download, Calendar, Filter, TrendingUp, Users, Building2, Euro, 
  Target, Zap, Award, Activity, PieChart, LineChart, DollarSign, Clock,
  TrendingDown, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useExportData } from '../hooks/useExport';
import { useBusinessKPIs } from '../hooks/useBusinessKPIs';
import { formatAmount, formatDate } from '../lib/utils';

export default function ReportsPage() {
  const { profile } = useAuth();
  const [dateRange, setDateRange] = useState('month');
  const [campusFilter, setCampusFilter] = useState('all');
  const [reportType, setReportType] = useState('performance');
  const exportMutation = useExportData();
  const { data: kpiData, isLoading: kpiLoading } = useBusinessKPIs();

  const { data: campuses = [] } = useQuery({
    queryKey: ['campus-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campus')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile && ['SUPER_ADMIN', 'COMPTABLE', 'DIRECTEUR_CAMPUS'].includes(profile.role || ''),
  });

  const handleExport = async () => {
    await exportMutation.mutateAsync({ 
      type: 'kpi-report',
      filters: { dateRange, campusFilter, reportType }
    });
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!['SUPER_ADMIN', 'COMPTABLE', 'DIRECTEUR_CAMPUS'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="brutal-card text-center">
          <BarChart3 className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-medium text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground font-ui">Seuls les administrateurs et directeurs peuvent accéder aux rapports.</p>
        </div>
      </div>
    );
  }

  if (kpiLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filtrer les données selon le campus si nécessaire
  const filteredCampusData = campusFilter === 'all' 
    ? kpiData?.campusAnalysis || []
    : kpiData?.campusAnalysis?.filter(c => c.id === campusFilter) || [];

  const filteredProfessorData = campusFilter === 'all'
    ? kpiData?.professorAnalysis || []
    : kpiData?.professorAnalysis?.filter(p => {
        const campus = campuses.find(c => c.id === campusFilter);
        return campus && p.campus === campus.name;
      }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-brutal flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-medium text-foreground">Rapports & Analytics</h1>
              <p className="text-muted-foreground font-ui mt-1">KPI métier et analyses de performance</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              className="brutal-button-primary inline-flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="brutal-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="brutal-input w-auto"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="brutal-input w-auto"
            >
              <option value="all">Tous les campus</option>
              {campuses.map(campus => (
                <option key={campus.id} value={campus.id}>{campus.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="brutal-input w-auto"
            >
              <option value="performance">Performance</option>
              <option value="financial">Financier</option>
              <option value="productivity">Productivité</option>
              <option value="comparison">Comparaison</option>
            </select>
          </div>
        </div>
      </div>

      {/* Métriques globales */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="brutal-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-ui font-medium text-muted-foreground">CA Total</p>
                <p className="text-2xl font-serif font-medium text-foreground">
                  {formatAmount(kpiData.globalMetrics.totalSystemRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="brutal-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-ui font-medium text-muted-foreground">Taux horaire moyen</p>
                <p className="text-2xl font-serif font-medium text-foreground">
                  {kpiData.globalMetrics.systemAverageHourlyRate.toFixed(1)}€/h
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="brutal-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-ui font-medium text-muted-foreground">CA par professeur</p>
                <p className="text-2xl font-serif font-medium text-foreground">
                  {formatAmount(kpiData.globalMetrics.systemRevenuePerProfessor)}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="brutal-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-ui font-medium text-muted-foreground">Total prestations</p>
                <p className="text-2xl font-serif font-medium text-foreground">
                  {kpiData.globalMetrics.totalPrestations}
                </p>
              </div>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Professeurs par Revenus */}
        <div className="brutal-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-brutal flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-medium text-foreground">
                  Top Professeurs par Revenus
                </h2>
                <p className="text-sm text-muted-foreground font-ui">
                  Classement par chiffre d'affaires généré
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {kpiData?.topPerformers.professorsByRevenue.map((prof, index) => (
              <div key={prof.id} className="flex items-center justify-between p-4 bg-muted rounded-brutal border-2 border-border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-brutal flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-ui font-medium text-foreground">
                      {prof.name}
                    </p>
                    <p className="text-sm text-muted-foreground font-ui">
                      {prof.campus} • {prof.totalHours}h • {prof.totalPrestations} prestations
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-ui font-medium text-foreground text-lg">
                    {formatAmount(prof.totalEarned)}
                  </p>
                  <p className="text-sm text-muted-foreground font-ui">
                    {prof.efficiency.toFixed(1)}€/h
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Professeurs par Efficacité */}
        <div className="brutal-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-brutal flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-medium text-foreground">
                  Top Professeurs par Efficacité
                </h2>
                <p className="text-sm text-muted-foreground font-ui">
                  Meilleur ratio €/heure
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {kpiData?.topPerformers.professorsByEfficiency.map((prof, index) => (
              <div key={prof.id} className="flex items-center justify-between p-4 bg-muted rounded-brutal border-2 border-border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-brutal flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-ui font-medium text-foreground">
                      {prof.name}
                    </p>
                    <p className="text-sm text-muted-foreground font-ui">
                      {prof.campus} • {prof.totalHours}h
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-ui font-medium text-foreground text-lg">
                    {prof.efficiency.toFixed(1)}€/h
                  </p>
                  <p className="text-sm text-muted-foreground font-ui">
                    {formatAmount(prof.totalEarned)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance des Campus */}
      <div className="brutal-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-brutal flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-medium text-foreground">
                Performance des Campus
              </h2>
              <p className="text-sm text-muted-foreground font-ui">
                Analyse comparative des campus
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Campus
                </th>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  CA Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Profs
                </th>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Heures
                </th>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Taux/h
                </th>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  CA/Prof
                </th>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Croissance
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {filteredCampusData.map((campus) => (
                <tr key={campus.id} className="hover:bg-accent transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-ui font-medium text-foreground">
                      {campus.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-ui font-medium text-foreground">
                      {formatAmount(campus.totalRevenue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="brutal-badge-info text-sm">
                      {campus.professorCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-ui text-foreground">
                      {campus.totalHours}h
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-ui text-foreground">
                      {campus.averageHourlyRate.toFixed(1)}€/h
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-ui text-foreground">
                      {formatAmount(campus.revenuePerProfessor)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-1 ${
                      campus.growthRate > 0 ? 'text-green-600' : 
                      campus.growthRate < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {campus.growthRate > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : campus.growthRate < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                      <span className="font-ui font-medium">
                        {campus.growthRate > 0 ? '+' : ''}{campus.growthRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analyse détaillée des Professeurs */}
      <div className="brutal-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-brutal flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-medium text-foreground">
                Analyse détaillée des Professeurs
              </h2>
              <p className="text-sm text-muted-foreground font-ui">
                Performance individuelle et métriques avancées
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Professeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Campus
                </th>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  CA Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Heures
                </th>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Prestations
                </th>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Taux/h
                </th>
                <th className="px-6 py-3 text-left text-xs font-ui font-medium text-muted-foreground uppercase tracking-wider">
                  Productivité
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {filteredProfessorData.map((prof) => (
                <tr key={prof.id} className="hover:bg-accent transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-ui font-medium text-foreground">
                      {prof.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="brutal-badge text-xs">
                      {prof.campus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-ui font-medium text-foreground">
                      {formatAmount(prof.totalEarned)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-ui text-foreground">
                      {prof.totalHours}h
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-ui text-foreground">
                      {prof.totalPrestations}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-ui text-foreground">
                      {prof.efficiency.toFixed(1)}€/h
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-ui text-foreground">
                      {prof.productivity.toFixed(1)}/sem
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}