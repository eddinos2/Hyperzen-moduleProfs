import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { zonedTimeToUtc, formatInTimeZone } from 'date-fns-tz';

const PARIS_TZ = 'Europe/Paris';

// Formatage des dates en français
export function formatDate(date: string | Date, pattern: string = 'dd MMMM yyyy'): string {
  if (!date) return 'Non défini';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Vérifier si la date est valide
  if (isNaN(dateObj.getTime())) {
    return 'Date invalide';
  }
  
  return formatInTimeZone(dateObj, PARIS_TZ, pattern, { locale: fr });
}

// Formatage des montants en euros
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// Normalisation des nombres décimaux français (virgule -> point)
export function normalizeDecimal(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

// Normalisation des dates DD/MM/YYYY -> YYYY-MM-DD
export function normalizeDate(dateStr: string): string {
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr; // Déjà au bon format
  }
  
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  throw new Error(`Format de date invalide: ${dateStr}`);
}

// Parsing CSV avec séparateur point-virgule
export function parseCSV(content: string): string[][] {
  const lines = content.trim().split('\n');
  return lines.map(line => {
    // Gestion des guillemets et virgules dans les champs
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current.trim());
    return fields.map(field => field.replace(/^"(.*)"$/, '$1'));
  });
}

// Validation email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Génération d'identifiant pour le mois
export function generateMonthYear(date: Date = new Date()): string {
  return format(date, 'yyyy-MM');
}

// Statut en français
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    prevalidated: 'Prévalidée',
    validated: 'Validée', 
    paid: 'Payée',
    rejected: 'Rejetée',
  };
  return labels[status] || status;
}

// Couleur du statut
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    prevalidated: 'bg-blue-100 text-blue-800', 
    validated: 'bg-green-100 text-green-800',
    paid: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Normalisation des noms de campus
export function normalizeCampusName(campusName: string): string {
  const normalized = campusName.trim().toUpperCase();
  
  const campusMap: Record<string, string> = {
    'ROQUETTE': 'Roquette',
    'PICPUS': 'Picpus',
    'SENTIER': 'Sentier',
    'DOUAI': 'Douai',
    'SAINT-SEBASTIEN': 'Saint-Sébastien',
    'SAINT-SÉBASTIEN': 'Saint-Sébastien',
    'SAINT SEBASTIEN': 'Saint-Sébastien',
    'SAINT SÉBASTIEN': 'Saint-Sébastien',
    'JAURES': 'Jaurès',
    'JAURÈS': 'Jaurès',
    'PARMENTIER': 'Parmentier',
    'BOULOGNE': 'Boulogne',
  };
  
  return campusMap[normalized] || campusName;
}