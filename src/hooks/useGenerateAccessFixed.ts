import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAdmin } from '../lib/supabase';
import { debugLogger } from '../lib/debug';
import toast from 'react-hot-toast';

export function useGenerateAccessFixed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (personnelIds: string[]) => {
      debugLogger.info('PERSONNEL', 'Génération accès pour utilisateurs', { ids: personnelIds });
      
      const results = [];
      
      for (const personnelId of personnelIds) {
        try {
          // Générer un mot de passe temporaire
          const tempPassword = `Temp${Math.random().toString(36).substring(2, 8)}!`;
          
          // Mettre à jour l'utilisateur avec un nouveau mot de passe
          const { data: updateResult, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            personnelId,
            {
              password: tempPassword,
              email_confirm: true
            }
          );
          
          if (updateError) {
            debugLogger.error('PERSONNEL', 'Erreur génération accès', { id: personnelId, error: updateError });
            throw updateError;
          }
          
          results.push({
            id: personnelId,
            password: tempPassword,
            success: true
          });
          
          debugLogger.info('PERSONNEL', 'Accès généré avec succès', { id: personnelId });
          
        } catch (error) {
          debugLogger.error('PERSONNEL', 'Erreur génération accès individuel', { id: personnelId, error });
          results.push({
            id: personnelId,
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
      
      debugLogger.info('PERSONNEL', 'Génération accès terminée', { success: successCount, failed: failCount });
      
      if (successCount > 0) {
        toast.success(`${successCount} accès générés avec succès`);
      }
      
      if (failCount > 0) {
        toast.error(`${failCount} échecs lors de la génération`);
      }
      
      // Afficher les mots de passe générés
      const successResults = results.filter(r => r.success);
      if (successResults.length > 0) {
        console.log('🔑 Mots de passe générés:');
        successResults.forEach(result => {
          console.log(`   ID: ${result.id} - Mot de passe: ${result.password}`);
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['personnel-fixed'] });
    },
    onError: (error) => {
      debugLogger.error('PERSONNEL', 'Erreur génération accès globale', error);
      toast.error(`Erreur génération accès: ${(error as Error).message}`);
    },
  });
}
