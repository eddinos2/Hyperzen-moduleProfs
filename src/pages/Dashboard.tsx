import React from 'react';
import { useAuth } from '../lib/auth';
import { debugLogger, logPermissionCheck } from '../lib/debug';
import AdminDashboard from './AdminDashboard';
import DirectorDashboard from './DirectorDashboard';
import TeacherDashboard from './TeacherDashboard';

export default function Dashboard() {
  const { profile } = useAuth();

  console.log('🏠 Dashboard render - profile:', profile?.email, profile?.role);
  
  // Debug logging pour le dashboard
  React.useEffect(() => {
    if (profile) {
      debugLogger.navigation('Accès au dashboard', `Rôle: ${profile.role}`, {
        email: profile.email,
        role: profile.role,
        campus: profile.campus?.name
      });
    }
  }, [profile]);

  if (!profile) {
    console.log('⏳ Dashboard: No profile yet, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-ui">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  console.log('🎯 Dashboard: Routing to', profile.role, 'dashboard');

  // Route to appropriate dashboard based on role
  switch (profile.role) {
    case 'SUPER_ADMIN':
    case 'COMPTABLE':
      console.log('👑 Loading AdminDashboard');
      logPermissionCheck(profile.role, 'AdminDashboard', true, 'Rôle administrateur');
      return <AdminDashboard />;
    
    case 'DIRECTEUR_CAMPUS':
      console.log('🏢 Loading DirectorDashboard');
      logPermissionCheck(profile.role, 'DirectorDashboard', true, 'Directeur de campus');
      return <DirectorDashboard />;
    
    case 'ENSEIGNANT':
      console.log('👨‍🏫 Loading TeacherDashboard');
      logPermissionCheck(profile.role, 'TeacherDashboard', true, 'Enseignant');
      return <TeacherDashboard />;
    
    default:
      console.log('❓ Unknown role:', profile.role);
      logPermissionCheck(profile.role, 'AnyDashboard', false, 'Rôle non reconnu');
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="brutal-card text-center">
            <h1 className="text-2xl font-serif font-medium text-foreground mb-2">Rôle non reconnu</h1>
            <p className="text-muted-foreground font-ui">Votre rôle n'est pas configuré correctement.</p>
          </div>
        </div>
      );
  }
}