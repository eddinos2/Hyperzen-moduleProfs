import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { debugLogger } from '../lib/debug';
import toast from 'react-hot-toast';

export function usePersonnelFixed() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['personnel-fixed'],
    queryFn: async () => {
      debugLogger.info('PERSONNEL', 'Récupération personnel via RPC get_personnel_enriched');
      
      const { data, error } = await supabase
        .rpc('get_personnel_enriched');

      if (error) {
        debugLogger.error('PERSONNEL', 'Erreur RPC get_personnel_enriched', error);
        throw error;
      }

      debugLogger.info('PERSONNEL', 'Personnel enrichi récupéré via RPC', { count: data?.length || 0 });
      return data || [];
    },
    enabled: !!profile,
  });
}

export function useCreatePersonnelFixed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (personnelData: any) => {
      debugLogger.info('PERSONNEL', 'Création utilisateur via API auth', {
        email: personnelData.email,
        role: personnelData.role,
        campus_id: personnelData.campus_id
      });

      // Créer l'utilisateur via l'API auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: personnelData.email,
        password: personnelData.password,
        email_confirm: true,
        user_metadata: {
          first_name: personnelData.first_name,
          last_name: personnelData.last_name
        }
      });

      if (authError) {
        debugLogger.error('PERSONNEL', 'Erreur création auth', authError);
        throw authError;
      }

      if (!authUser.user) {
        debugLogger.error('PERSONNEL', 'Utilisateur non créé');
        throw new Error('Utilisateur non créé');
      }

      // Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: personnelData.email,
          first_name: personnelData.first_name,
          last_name: personnelData.last_name,
          role: personnelData.role,
          campus_id: personnelData.role === 'DIRECTEUR_CAMPUS' ? personnelData.campus_id : null
        });

      if (profileError) {
        debugLogger.error('PERSONNEL', 'Erreur création profil', profileError);
        throw profileError;
      }

      // Si c'est un directeur, assigner au campus
      if (personnelData.role === 'DIRECTEUR_CAMPUS' && personnelData.campus_id) {
        const { error: assignError } = await supabase
          .from('campus')
          .update({ directeur_id: authUser.user.id })
          .eq('id', personnelData.campus_id);

        if (assignError) {
          debugLogger.error('PERSONNEL', 'Erreur assignation directeur', assignError);
          throw assignError;
        }
      }

      const result = {
        success: true,
        user_id: authUser.user.id,
        email: personnelData.email,
        role: personnelData.role,
        campus_id: personnelData.campus_id
      };

      debugLogger.info('PERSONNEL', 'Utilisateur créé avec succès', result);
      return result;
    },
    onSuccess: (data) => {
      debugLogger.info('PERSONNEL', 'Création réussie', data);
      toast.success(`Utilisateur créé avec succès: ${data.email}`);
      queryClient.invalidateQueries({ queryKey: ['personnel-fixed'] });
      queryClient.invalidateQueries({ queryKey: ['campus-assignments'] });
    },
    onError: (error) => {
      debugLogger.error('PERSONNEL', 'Erreur création utilisateur', error);
      toast.error(`Erreur création: ${(error as Error).message}`);
    },
  });
}
