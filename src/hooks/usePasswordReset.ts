import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAdmin } from '../lib/supabase';
import { debugLogger } from '../lib/debug';
import toast from 'react-hot-toast';

interface ResetPasswordArgs {
  userId: string;
  newPassword?: string;
}

export function usePasswordReset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newPassword }: ResetPasswordArgs) => {
      debugLogger.info('PASSWORD_RESET', 'Réinitialisation mot de passe', { userId });
      
      // Générer un mot de passe temporaire si non fourni
      const tempPassword = newPassword || `Temp${Math.random().toString(36).substring(2, 8)}!`;
      
      // Mettre à jour l'utilisateur avec le nouveau mot de passe
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          password: tempPassword,
          email_confirm: true
        }
      );

      if (error) {
        debugLogger.error('PASSWORD_RESET', 'Erreur réinitialisation', { userId, error: error.message });
        throw error;
      }

      debugLogger.info('PASSWORD_RESET', 'Mot de passe réinitialisé avec succès', { userId });
      
      return {
        userId,
        newPassword: tempPassword,
        success: true
      };
    },
    onSuccess: (result) => {
      debugLogger.info('PASSWORD_RESET', 'Réinitialisation terminée', { userId: result.userId });
      toast.success('Mot de passe réinitialisé avec succès');
      
      // Invalider le cache des utilisateurs
      queryClient.invalidateQueries({ queryKey: ['personnel-fixed'] });
    },
    onError: (error) => {
      debugLogger.error('PASSWORD_RESET', 'Erreur réinitialisation globale', error);
      toast.error(`Erreur réinitialisation: ${(error as Error).message}`);
    },
  });
}

// Hook pour réinitialiser plusieurs mots de passe en lot
export function useBulkPasswordReset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      debugLogger.info('BULK_PASSWORD_RESET', 'Réinitialisation en lot', { count: userIds.length });
      
      const results = [];

      for (const userId of userIds) {
        try {
          // Générer un mot de passe temporaire unique
          const tempPassword = `Temp${Math.random().toString(36).substring(2, 8)}!`;

          // Mettre à jour l'utilisateur
          const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            {
              password: tempPassword,
              email_confirm: true
            }
          );

          if (error) {
            debugLogger.error('BULK_PASSWORD_RESET', 'Erreur réinitialisation individuelle', { userId, error: error.message });
            results.push({
              userId,
              success: false,
              error: error.message
            });
          } else {
            debugLogger.info('BULK_PASSWORD_RESET', 'Réinitialisation individuelle réussie', { userId });
            results.push({
              userId,
              newPassword: tempPassword,
              success: true
            });
          }
        } catch (error) {
          debugLogger.error('BULK_PASSWORD_RESET', 'Erreur exception réinitialisation', { userId, error });
          results.push({
            userId,
            success: false,
            error: (error as Error).message
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      debugLogger.info('BULK_PASSWORD_RESET', 'Réinitialisation en lot terminée', { success: successCount, failed: failCount });

      if (successCount > 0) {
        toast.success(`${successCount} mots de passe réinitialisés avec succès`);
      }

      if (failCount > 0) {
        toast.error(`${failCount} échecs lors de la réinitialisation`);
      }

      // Afficher les nouveaux mots de passe
      const successResults = results.filter(r => r.success);
      if (successResults.length > 0) {
        console.log('🔑 Nouveaux mots de passe générés:');
        successResults.forEach(result => {
          console.log(`   ID: ${result.userId} - Nouveau mot de passe: ${result.newPassword}`);
        });
      }

      // Invalider le cache
      queryClient.invalidateQueries({ queryKey: ['personnel-fixed'] });
    },
    onError: (error) => {
      debugLogger.error('BULK_PASSWORD_RESET', 'Erreur réinitialisation en lot globale', error);
      toast.error(`Erreur réinitialisation en lot: ${(error as Error).message}`);
    },
  });
}
