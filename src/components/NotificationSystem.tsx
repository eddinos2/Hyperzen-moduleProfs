import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

export function NotificationSystem() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    // Simuler des notifications basées sur le rôle et les données
    const generateNotifications = async () => {
      const notifications: Notification[] = [];

      try {
        // Notifications pour directeur de campus
        if (profile.role === 'DIRECTEUR_CAMPUS' && profile.campus_id) {
          const { data: pendingInvoices } = await supabase
            .from('invoices')
            .select('*, profiles!invoices_enseignant_id_fkey(first_name, last_name)')
            .eq('campus_id', profile.campus_id)
            .eq('status', 'pending');

          if (pendingInvoices && pendingInvoices.length > 0) {
            notifications.push({
              id: 'pending-invoices',
              type: 'warning',
              title: 'Factures en attente',
              message: `${pendingInvoices.length} facture(s) en attente de prévalidation`,
              timestamp: new Date().toISOString(),
              read: false,
              action: {
                label: 'Prévalider',
                href: '/prevalidation'
              }
            });
          }
        }

        // Notifications pour comptable/admin
        if (['SUPER_ADMIN', 'COMPTABLE'].includes(profile.role)) {
          const [prevalidatedResult, validatedResult] = await Promise.all([
            supabase
              .from('invoices')
              .select('*')
              .eq('status', 'prevalidated'),
            supabase
              .from('invoices')
              .select('*')
              .eq('status', 'validated')
          ]);

          if (prevalidatedResult.data && prevalidatedResult.data.length > 0) {
            notifications.push({
              id: 'prevalidated-invoices',
              type: 'info',
              title: 'Factures à valider',
              message: `${prevalidatedResult.data.length} facture(s) prévalidée(s) en attente`,
              timestamp: new Date().toISOString(),
              read: false,
              action: {
                label: 'Valider',
                href: '/validation'
              }
            });
          }

          if (validatedResult.data && validatedResult.data.length > 0) {
            notifications.push({
              id: 'validated-invoices',
              type: 'success',
              title: 'Factures à payer',
              message: `${validatedResult.data.length} facture(s) validée(s) prête(s) pour paiement`,
              timestamp: new Date().toISOString(),
              read: false,
              action: {
                label: 'Payer',
                href: '/payments'
              }
            });
          }
        }

        // Notifications pour enseignant
        if (profile.role === 'ENSEIGNANT') {
          const { data: userInvoices } = await supabase
            .from('invoices')
            .select('*')
            .eq('enseignant_id', profile.id)
            .in('status', ['prevalidated', 'validated', 'paid'])
            .order('updated_at', { ascending: false })
            .limit(3);

          userInvoices?.forEach(invoice => {
            let title = '';
            let type: 'info' | 'success' | 'warning' | 'error' = 'info';
            
            switch (invoice.status) {
              case 'prevalidated':
                title = 'Facture prévalidée';
                type = 'info';
                break;
              case 'validated':
                title = 'Facture validée';
                type = 'success';
                break;
              case 'paid':
                title = 'Facture payée';
                type = 'success';
                break;
            }

            notifications.push({
              id: `invoice-${invoice.id}`,
              type,
              title,
              message: `Votre facture ${formatMonthYear(invoice.month_year)} a été ${getStatusLabel(invoice.status).toLowerCase()}`,
              timestamp: invoice.updated_at,
              read: false,
              action: {
                label: 'Voir détails',
                href: `/invoices/${invoice.id}`
              }
            });
          });
        }

        setNotifications(notifications);
        setUnreadCount(notifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Erreur génération notifications:', error);
      }
    };

    generateNotifications();

    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(generateNotifications, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
      default: return Info;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Tout marquer lu
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${getTypeColor(notification.type)}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(notification.timestamp, 'dd MMM yyyy HH:mm')}
                          </p>
                          {notification.action && (
                            <a
                              href={notification.action.href}
                              className="inline-flex items-center mt-2 text-xs text-blue-600 hover:text-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {notification.action.label} →
                            </a>
                          )}
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
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

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    prevalidated: 'Prévalidée',
    validated: 'Validée',
    paid: 'Payée',
    rejected: 'Rejetée',
  };
  return labels[status] || status;
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ENSEIGNANT: 'Enseignant',
    DIRECTEUR_CAMPUS: 'Directeur de Campus',
    COMPTABLE: 'Comptable',
    SUPER_ADMIN: 'Super Administrateur',
  };
  return labels[role] || role;
}