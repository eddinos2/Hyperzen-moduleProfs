import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { debugLogger } from '../lib/debug';
import toast from 'react-hot-toast';

export function usePersonnelRPC() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['personnel-rpc'],
    queryFn: async () => {
      debugLogger.info('PERSONNEL', 'Récupération personnel via RPC');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          campus:campus_id(name, address)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        debugLogger.error('PERSONNEL', 'Erreur récupération personnel', error);
        throw error;
      }

      debugLogger.info('PERSONNEL', 'Personnel récupéré', { count: data?.length });
      return data || [];
    },
    enabled: !!profile,
  });
}

export function useCreatePersonnelRPC() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (personnelData: any) => {
      // Créer l'utilisateur via l'API auth avec la clé service role
      debugLogger.info('PERSONNEL', 'Création utilisateur via API auth', {
        email: personnelData.email,
        role: personnelData.role,
        campus_id: personnelData.campus_id
      });

      // Utiliser le client admin pour créer l'utilisateur
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
      queryClient.invalidateQueries({ queryKey: ['personnel-rpc'] });
      queryClient.invalidateQueries({ queryKey: ['campus-assignments'] });
    },
    onError: (error) => {
      debugLogger.error('PERSONNEL', 'Erreur création utilisateur', error);
      toast.error(`Erreur création: ${(error as Error).message}`);
    },
  });
}

export function useAssignDirectorRPC() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ directorId, campusId }: { directorId: string; campusId: string }) => {
      debugLogger.info('PERSONNEL', 'Assignation directeur via RPC', {
        directorId,
        campusId
      });

      const { data: result, error: rpcError } = await supabase
        .rpc('assign_director_to_campus', {
          p_director_id: directorId,
          p_campus_id: campusId
        });

      if (rpcError) {
        debugLogger.error('PERSONNEL', 'Erreur RPC assignation', rpcError);
        throw rpcError;
      }

      if (!result.success) {
        debugLogger.error('PERSONNEL', 'Échec assignation', result);
        throw new Error(result.message);
      }

      debugLogger.info('PERSONNEL', 'Assignation réussie', result);
      return result;
    },
    onSuccess: (data) => {
      debugLogger.info('PERSONNEL', 'Assignation réussie', data);
      toast.success('Directeur assigné avec succès');
      queryClient.invalidateQueries({ queryKey: ['personnel-rpc'] });
      queryClient.invalidateQueries({ queryKey: ['campus-assignments'] });
    },
    onError: (error) => {
      debugLogger.error('PERSONNEL', 'Erreur assignation', error);
      toast.error(`Erreur assignation: ${(error as Error).message}`);
    },
  });
}
