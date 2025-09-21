import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Building2, Lock, Mail, Users, GraduationCap, Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPanel, setSelectedPanel] = useState<'teacher' | 'admin'>('teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError('Email ou mot de passe incorrect');
      setLoading(false);
    }
    // Si pas d'erreur, on laisse le loading géré par le contexte d'auth
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="brutal-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-brutal bg-primary shadow-brutal mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-serif font-medium text-foreground mb-2">
              AURLOM BTS+
            </h1>
            <p className="text-muted-foreground font-ui">
              Plateforme de gestion
            </p>
          </div>

          {/* Panel Selector */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPanel('teacher')}
                className={`flex flex-col items-center p-4 rounded-brutal border-2 transition-all duration-300 ease-out ${
                  selectedPanel === 'teacher'
                    ? 'bg-primary text-primary-foreground border-primary shadow-brutal'
                    : 'bg-background text-foreground border-border hover:shadow-brutal hover:translate-x-1 hover:translate-y-1'
                }`}
              >
                <GraduationCap className="w-6 h-6 mb-2" />
                <span className="font-ui font-medium text-sm">Professeur</span>
                <span className="font-ui text-xs opacity-75">Gestion des factures et cours</span>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedPanel('admin')}
                className={`flex flex-col items-center p-4 rounded-brutal border-2 transition-all duration-300 ease-out ${
                  selectedPanel === 'admin'
                    ? 'bg-primary text-primary-foreground border-primary shadow-brutal'
                    : 'bg-background text-foreground border-border hover:shadow-brutal hover:translate-x-1 hover:translate-y-1'
                }`}
              >
                <Users className="w-6 h-6 mb-2" />
                <span className="font-ui font-medium text-sm">Administration</span>
                <span className="font-ui text-xs opacity-75">Validation et gestion</span>
              </button>
            </div>
          </div>

          {/* Panel Description */}
          <div className="mb-6">
            <div className="brutal-border p-4 bg-muted">
              {selectedPanel === 'teacher' ? (
                <div className="text-center">
                  <h3 className="font-ui font-medium text-foreground mb-1">Espace Professeur</h3>
                  <p className="text-sm text-muted-foreground font-ui">
                    Gestion des factures, cours et prestations
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="font-ui font-medium text-foreground mb-1">Espace Administration</h3>
                  <p className="text-sm text-muted-foreground font-ui">
                    Validation, gestion des campus et professeurs
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-ui font-medium text-foreground mb-2">
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="brutal-input pl-10"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-ui font-medium text-foreground mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="brutal-input pl-10 pr-10"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="brutal-border p-3 bg-red-50 border-red-300">
                <p className="text-sm text-red-800 font-ui">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full brutal-button-primary py-3 text-base font-ui font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                  Connexion en cours...
                </div>
              ) : (
                `Accéder à l'espace ${selectedPanel === 'teacher' ? 'Professeur' : 'Administration'}`
              )}
            </button>
          </form>

          {/* Test Accounts */}
          <div className="mt-6 pt-6 border-t-2 border-border">
            <h4 className="text-sm font-ui font-medium text-foreground mb-3">Comptes de test :</h4>
            <div className="space-y-2 text-xs font-ui">
              <div className="flex justify-between text-muted-foreground">
                <span>houssam@aurlom.com</span>
                <span>admin123</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>comptable@aurlom.com</span>
                <span>Test123!</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-border text-center">
            <div className="text-xs text-muted-foreground font-ui">
              <p className="font-medium text-foreground">AURLOM PREPA SARL</p>
              <p>48 rue de la Roquette, 75011 Paris</p>
              <p>info@aurlom.com - 01 44 82 65 67</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}