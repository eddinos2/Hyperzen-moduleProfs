// Système de debug complet pour tracer les permissions et actions
export class DebugLogger {
  private static instance: DebugLogger;
  private logs: Array<{
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    category: string;
    message: string;
    data?: any;
  }> = [];

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', category: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };
    
    this.logs.push(logEntry);
    
    // Console styling
    const styles = {
      INFO: 'color: #2563eb; font-weight: bold;',
      WARN: 'color: #d97706; font-weight: bold;',
      ERROR: 'color: #dc2626; font-weight: bold;',
      DEBUG: 'color: #059669; font-weight: bold;'
    };
    
    console.log(
      `%c[${level}] ${category}: ${message}`,
      styles[level],
      data ? data : ''
    );
  }

  // Méthodes publiques
  info(category: string, message: string, data?: any) {
    this.log('INFO', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log('WARN', category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.log('ERROR', category, message, data);
  }

  debug(category: string, message: string, data?: any) {
    this.log('DEBUG', category, message, data);
  }

  // Méthodes spécialisées pour l'application
  auth(message: string, data?: any) {
    this.info('AUTH', message, data);
  }

  permissions(message: string, data?: any) {
    this.info('PERMISSIONS', message, data);
  }

  navigation(message: string, data?: any) {
    this.info('NAVIGATION', message, data);
  }

  data(message: string, data?: any) {
    this.debug('DATA', message, data);
  }

  ui(message: string, data?: any) {
    this.debug('UI', message, data);
  }

  // Récupérer tous les logs
  getLogs() {
    return this.logs;
  }

  // Vider les logs
  clearLogs() {
    this.logs = [];
  }

  // Exporter les logs
  exportLogs() {
    const logsText = this.logs.map(log => 
      `[${log.timestamp}] [${log.level}] ${log.category}: ${log.message}${log.data ? ' | Data: ' + JSON.stringify(log.data) : ''}`
    ).join('\n');
    
    console.log('='.repeat(80));
    console.log('EXPORT DES LOGS DE DEBUG');
    console.log('='.repeat(80));
    console.log(logsText);
    console.log('='.repeat(80));
    
    return logsText;
  }
}

// Instance globale
export const debugLogger = DebugLogger.getInstance();

// Helpers pour les permissions
export const logPermissionCheck = (role: string, resource: string, allowed: boolean, reason?: string) => {
  debugLogger.permissions(
    `Permission ${allowed ? 'ACCORDÉE' : 'REFUSÉE'} - Rôle: ${role}, Ressource: ${resource}`,
    { role, resource, allowed, reason }
  );
};

export const logDataAccess = (role: string, dataType: string, count: number, filters?: any) => {
  debugLogger.data(
    `Accès données - Rôle: ${role}, Type: ${dataType}, Nombre: ${count}`,
    { role, dataType, count, filters }
  );
};

export const logNavigation = (role: string, from: string, to: string, allowed: boolean) => {
  debugLogger.navigation(
    `Navigation ${allowed ? 'AUTORISÉE' : 'BLOQUÉE'} - Rôle: ${role}, De: ${from}, Vers: ${to}`,
    { role, from, to, allowed }
  );
};