import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './lib/auth';
import { debugLogger } from './lib/debug';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import Dashboard from './pages/Dashboard';
import DashboardPage from './pages/DashboardPage';
import { ImportCSV } from './pages/ImportCSV';
import { InvoiceList } from './pages/InvoiceList';
import PrevalidationPage from './pages/PrevalidationPage';
import ValidationPage from './pages/ValidationPage';
import PaymentsPage from './pages/PaymentsPage';
import PersonnelPage from './pages/PersonnelPage';
import CampusPage from './pages/CampusPage';
import SettingsPage from './pages/SettingsPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import InvoiceDetailPrevalidation from './pages/InvoiceDetailPrevalidation';
import ProfessorInvoiceDetail from './pages/ProfessorInvoiceDetail';
import AuditPage from './pages/AuditPage';
import ReportsPage from './pages/ReportsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // Pas de retry pour aller plus vite
      staleTime: 10 * 60 * 1000, // 10 minutes de cache
      gcTime: 15 * 60 * 1000, // 15 minutes avant garbage collection
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

function App() {
  console.log('🚀 App component render');
  debugLogger.info('APP', 'Application démarrée');
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '2px solid hsl(var(--border))',
                  borderRadius: '0.375rem',
                  boxShadow: '4px 4px 0 hsl(var(--border))',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  console.log('🔄 AppContent render - user:', !!user, 'loading:', loading);
  debugLogger.ui('AppContent render', { hasUser: !!user, loading });

  if (loading) {
    console.log('⏳ AppContent: Still loading...');
    debugLogger.ui('AppContent en cours de chargement');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="brutal-card text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-ui">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🚫 AppContent: No user, showing login');
    debugLogger.ui('AppContent: Utilisateur non connecté, affichage login');
    return <LoginForm />;
  }

  console.log('✅ AppContent: User authenticated, showing app');
  debugLogger.ui('AppContent: Utilisateur authentifié, affichage application');
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/:invoiceId" element={<InvoiceDetailPage />} />
        <Route path="professor/invoices/:invoiceId" element={<ProfessorInvoiceDetail />} />
        <Route path="import" element={<ImportCSV />} />
        <Route path="prevalidation" element={<PrevalidationPage />} />
        <Route path="prevalidation/:invoiceId" element={<InvoiceDetailPrevalidation />} />
        <Route path="validation" element={<ValidationPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="personnel" element={<PersonnelPage />} />
        <Route path="campus" element={<CampusPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;