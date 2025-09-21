import React from 'react';
import { Search, Filter, Calendar, Building2, User } from 'lucide-react';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  campusFilter?: string;
  onCampusChange?: (value: string) => void;
  roleFilter?: string;
  onRoleChange?: (value: string) => void;
  dateFilter?: string;
  onDateChange?: (value: string) => void;
  campuses?: any[];
  showExport?: boolean;
  onExport?: () => void;
  placeholder?: string;
}

export function SearchAndFilter({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  campusFilter,
  onCampusChange,
  roleFilter,
  onRoleChange,
  dateFilter,
  onDateChange,
  campuses = [],
  showExport = false,
  onExport,
  placeholder = "Rechercher..."
}: SearchAndFilterProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        {statusFilter !== undefined && onStatusChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="prevalidated">Prévalidées</option>
              <option value="validated">Validées</option>
              <option value="paid">Payées</option>
              <option value="rejected">Rejetées</option>
            </select>
          </div>
        )}

        {/* Campus Filter */}
        {campusFilter !== undefined && onCampusChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
            <select
              value={campusFilter}
              onChange={(e) => onCampusChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les campus</option>
              {campuses.map(campus => (
                <option key={campus.id} value={campus.id}>{campus.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Role Filter */}
        {roleFilter !== undefined && onRoleChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
            <select
              value={roleFilter}
              onChange={(e) => onRoleChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les rôles</option>
              <option value="ENSEIGNANT">Enseignant</option>
              <option value="DIRECTEUR_CAMPUS">Directeur Campus</option>
              <option value="COMPTABLE">Comptable</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
        )}

        {/* Date Filter */}
        {dateFilter !== undefined && onDateChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
            <select
              value={dateFilter}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
          </div>
        )}

        {/* Export Button */}
        {showExport && onExport && (
          <div className="flex items-end">
            <button
              onClick={onExport}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Exporter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}