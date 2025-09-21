import React from 'react';
import { Users, Building2, FileText, TrendingUp, AlertCircle, CheckCircle, DollarSign, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useInvoices } from '../hooks/useInvoices';
import { useGlobalStats } from '../hooks/useStats';
import { formatAmount, formatDate, getStatusColor, getStatusLabel } from '../lib/utils';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: globalStats, isLoading: statsLoading } = useGlobalStats();

  if (!profile || !['SUPER_ADMIN', 'COMPTABLE'].includes(profile.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (invoicesLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Factures en attente',
      value: globalStats?.pendingInvoices?.toString() || '0',
      icon: Clock,
      color: 'bg-yellow-500',
      subtitle: formatAmount(invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total_amount, 0)),
      change: globalStats?.pendingInvoices ? `${globalStats.pendingInvoices} à traiter` : 'Aucune'
    },
    {
      name: 'Factures à valider',
      value: globalStats?.prevalidatedInvoices?.toString() || '0',
      icon: FileText,
      color: 'bg-blue-500',
      subtitle: formatAmount(invoices.filter(i => i.status === 'prevalidated').reduce((sum, i) => sum + i.total_amount, 0)),
      change: globalStats?.prevalidatedInvoices ? `${globalStats.prevalidatedInvoices} prévalidées` : 'Aucune'
    },
    {
      name: 'Factures validées',
      value: globalStats?.validatedInvoices?.toString() || '0',
      icon: CheckCircle,
      color: 'bg-green-500',
      subtitle: formatAmount(invoices.filter(i => i.status === 'validated').reduce((sum, i) => sum + i.total_amount, 0)),
      change: globalStats?.validatedInvoices ? `${globalStats.validatedInvoices} à payer` : 'Aucune'
    },
    {
      name: 'Montant payé',
      value: formatAmount(globalStats?.paidAmount || 0),
      icon: DollarSign,
      color: 'bg-emerald-500',
      subtitle: `${globalStats?.paidInvoices || 0} factures`,
      change: globalStats?.paidAmount ? 'Ce mois' : 'Aucun paiement'
    }
  ];

  // Prendre les 5 dernières factures
  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-medium text-foreground">
              Dashboard {profile.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Comptable'}
            </h1>
            <p className="text-muted-foreground font-ui mt-1">
              Bienvenue {profile.first_name} {profile.last_name}
            </p>
            <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground font-ui">
              <span>{globalStats?.uniqueTeachersWithInvoices || 0} professeur{(globalStats?.uniqueTeachersWithInvoices || 0) > 1 ? 's' : ''} avec factures</span>
              <span>•</span>
              <span>{globalStats?.uniqueCampusesWithInvoices || 0} campus avec factures</span>
              <span>•</span>
              <span>{globalStats?.totalInvoices || 0} factures total</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="brutal-badge-info">
              {profile.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Comptable'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="brutal-card">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-brutal p-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-ui font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-serif font-medium text-foreground">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-sm text-muted-foreground font-ui">{stat.subtitle}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <span className="text-muted-foreground font-ui">{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="brutal-card">
          <div className="border-b-2 border-border pb-4">
            <h3 className="text-lg font-serif font-medium text-foreground">Factures récentes</h3>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-ui">Aucune facture</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-ui font-medium text-foreground">
                        {invoice.profiles?.first_name} {invoice.profiles?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground font-ui">
                        {invoice.campus?.name} • {formatMonthYear(invoice.month_year)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-ui font-medium text-foreground">
                        {formatAmount(invoice.total_amount)}
                      </p>
                      <span className={`brutal-badge text-xs ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="pt-3 text-right">
            <Link to="/validation" className="text-sm font-ui font-medium text-primary hover:text-primary-foreground">
              Voir toutes les factures →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="brutal-card">
          <div className="border-b-2 border-border pb-4">
            <h3 className="text-lg font-serif font-medium text-foreground">Actions rapides</h3>
          </div>
          <div className="space-y-4">
            {(globalStats?.prevalidatedInvoices || 0) > 0 && (
              <Link
                to="/validation"
                className="w-full brutal-button-primary flex items-center justify-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Valider {globalStats?.prevalidatedInvoices} facture{(globalStats?.prevalidatedInvoices || 0) > 1 ? 's' : ''}
              </Link>
            )}
            {(globalStats?.validatedInvoices || 0) > 0 && (
              <Link
                to="/payments"
                className="w-full brutal-button-primary flex items-center justify-center"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Traiter {globalStats?.validatedInvoices} paiement{(globalStats?.validatedInvoices || 0) > 1 ? 's' : ''}
              </Link>
            )}
            {profile.role === 'SUPER_ADMIN' && (
              <Link
                to="/personnel"
                className="w-full brutal-button-secondary flex items-center justify-center"
              >
                <Users className="w-4 h-4 mr-2" />
                Gérer les professeurs
              </Link>
            )}
            {profile.role === 'SUPER_ADMIN' && (
              <Link
                to="/campus"
                className="w-full brutal-button-secondary flex items-center justify-center"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Gérer les campus
              </Link>
            )}
          </div>

          {/* Summary Stats */}
          <div className="pt-4 border-t-2 border-border">
            <div className="text-sm text-muted-foreground font-ui space-y-2">
              <div className="flex justify-between">
                <span>Total factures :</span>
                <span className="font-medium text-foreground">{globalStats?.totalInvoices || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Montant total :</span>
                <span className="font-medium text-foreground">{formatAmount(globalStats?.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>En attente paiement :</span>
                <span className="font-medium text-orange-600">{formatAmount(globalStats?.pendingAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Déjà payé :</span>
                <span className="font-medium text-green-600">{formatAmount(globalStats?.paidAmount || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatMonthYear(monthYear: string) {
  const [year, month] = monthYear.split('-');
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}