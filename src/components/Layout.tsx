import React from 'react';
import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  Menu,
  X,
  Home,
  FileText,
  Users,
  Settings,
  LogOut,
  Building2,
  DollarSign,
  Upload,
  CheckCircle,
  XCircle,
  Shield,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { debugLogger, logNavigation, logPermissionCheck } from '../lib/debug';
import { NotificationSystem } from './NotificationSystem';
import { useTheme } from './ThemeProvider';

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: Home, roles: ['all'] },
    { name: 'Mes factures', href: '/invoices', icon: FileText, roles: ['ENSEIGNANT'] },
    { name: 'Importer facture', href: '/import', icon: Upload, roles: ['ENSEIGNANT'] },
    { name: 'Prévalidation', href: '/prevalidation', icon: CheckCircle, roles: ['DIRECTEUR_CAMPUS'] },
    { name: 'Validation', href: '/validation', icon: CheckCircle, roles: ['SUPER_ADMIN', 'COMPTABLE'] },
    { name: 'Paiements', href: '/payments', icon: DollarSign, roles: ['SUPER_ADMIN', 'COMPTABLE'] },
    { name: 'Personnel', href: '/personnel', icon: Users, roles: ['SUPER_ADMIN'] },
    { name: 'Campus', href: '/campus', icon: Building2, roles: ['SUPER_ADMIN'] },
    { name: 'Audit', href: '/audit', icon: Shield, roles: ['SUPER_ADMIN'] },
    { name: 'Rapports', href: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'DIRECTEUR_CAMPUS', 'COMPTABLE'] },
    { name: 'Paramètres', href: '/settings', icon: Settings, roles: ['all'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes('all') || 
    (profile && item.roles.includes(profile.role))
  );

  // Debug logging pour la navigation
  React.useEffect(() => {
    if (profile) {
      logNavigation('Layout rendered', { 
        userRole: profile.role, 
        filteredItems: filteredNavigation.length,
        allItems: navigation.length 
      });
    }
  }, [profile, filteredNavigation.length]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Le toggleTheme est maintenant géré par le ThemeProvider

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-100 text-red-800 border-red-300',
      'DIRECTEUR_CAMPUS': 'bg-purple-100 text-purple-800 border-purple-300',
      'ENSEIGNANT': 'bg-blue-100 text-blue-800 border-blue-300',
      'COMPTABLE': 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300';
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
    <div className="min-h-screen bg-background transition-all duration-300 ease-out">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-out ${
        sidebarCollapsed ? 'sidebar-mini' : 'sidebar-expanded'
      } bg-background border-r-2 border-border shadow-brutal`}>
        
        {/* Header Sidebar */}
        <div className="flex items-center justify-between p-4 border-b-2 border-border">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-brutal flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <h1 className="text-lg font-serif font-medium text-foreground">AURLOM</h1>
            </div>
          )}
          
          <button
            onClick={toggleSidebar}
            className="brutal-button-secondary p-2"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-3 rounded-brutal transition-all duration-300 ease-out group ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-2 border-primary shadow-brutal'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-border hover:shadow-brutal'
                  }`
                }
                onClick={() => logNavigation('Navigation click', { href: item.href, userRole: profile?.role })}
              >
                <Icon className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : ''}`} />
                {!sidebarCollapsed && (
                  <span className="font-ui font-medium">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile */}
        {!sidebarCollapsed && profile && (
          <div className="p-4 border-t-2 border-border">
            <div className="brutal-card p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-secondary rounded-brutal flex items-center justify-center">
                  <span className="text-secondary-foreground font-bold">
                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-ui font-medium text-foreground">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <span className={`brutal-badge text-xs ${getRoleColor(profile.role)}`}>
                    {getRoleLabel(profile.role)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleTheme}
                  className="brutal-button-secondary p-2"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={signOut}
                  className="brutal-button-secondary p-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mini Sidebar User */}
        {sidebarCollapsed && profile && (
          <div className="p-4 border-t-2 border-border">
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-secondary rounded-brutal flex items-center justify-center">
                <span className="text-secondary-foreground font-bold">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-out ${
        sidebarCollapsed ? 'ml-14' : 'ml-60'
      }`}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b-2 border-border shadow-brutal">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="brutal-button-secondary p-2 lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h2 className="text-xl font-serif font-medium text-foreground">
                  Plateforme de Gestion AURLOM
                </h2>
                <p className="text-sm text-muted-foreground font-ui">
                  {profile ? `${getRoleLabel(profile.role)} - ${profile.campus?.name || 'Sans campus'}` : 'Chargement...'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className="brutal-button-secondary p-2"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Notification System */}
      <NotificationSystem />
    </div>
  );
}