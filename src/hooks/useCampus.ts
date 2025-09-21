import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { debugLogger } from '../lib/debug';
import toast from 'react-hot-toast';

export function useCampus() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['campus'],
    queryFn: async () => {
      debugLogger.info('CAMPUS', 'Récupération campus via RPC');
      
      const { data, error } = await supabase
        .rpc('get_campus_with_directors');
        
      if (error) {
        debugLogger.error('CAMPUS', 'Erreur RPC get_campus_with_directors', error);
        throw error;
      }
      
      debugLogger.info('CAMPUS', 'Campus récupérés', { count: data?.length || 0 });
      return data || [];
    },
    enabled: !!profile,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateCampus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campusData: any) => {
      const { data, error } = await supabase
        .from('campus')
        .insert({
          name: campusData.name,
          address: campusData.address,
          directeur_id: campusData.directeur_id || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Campus créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['campus'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création: ${(error as Error).message}`);
    },
  });
}

export function useUpdateCampus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      debugLogger.info('CAMPUS', 'Début mise à jour campus', { id, updateData });

      // Si on change le directeur
      if (updateData.directeur_id !== undefined) {
        if (updateData.directeur_id) {
          // Assigner nouveau directeur
          const { data: assignResult, error: assignError } = await supabase
            .rpc('assign_director_to_campus', {
              p_director_id: updateData.directeur_id,
              p_campus_id: id
            });

          if (assignError) {
            debugLogger.error('CAMPUS', 'Erreur assignation directeur', assignError);
            throw assignError;
          }

          if (!assignResult.success) {
            throw new Error(assignResult.message);
          }
        } else {
          // Retirer le directeur actuel
          const { data: campus } = await supabase
            .from('campus')
            .select('directeur_id')
            .eq('id', id)
            .single();

          if (campus?.directeur_id) {
            const { data: removeResult, error: removeError } = await supabase
              .rpc('remove_director_from_campus', {
                p_director_id: campus.directeur_id
              });

            if (removeError) {
              debugLogger.error('CAMPUS', 'Erreur retrait directeur', removeError);
              throw removeError;
            }
          }
        }
      }

      // Mettre à jour les autres champs du campus
      const { data, error } = await supabase
        .from('campus')
        .update({
          name: updateData.name,
          address: updateData.address
        })
        .eq('id', id)
        .select(`
          *,
          profiles!campus_directeur_id_fkey(first_name, last_name, email)
        `)
        .single();

      if (error) {
        debugLogger.error('CAMPUS', 'Erreur mise à jour campus', error);
        throw error;
      }

      debugLogger.info('CAMPUS', 'Mise à jour campus terminée avec succès');
      return data;
    },
    onSuccess: () => {
      toast.success('Campus modifié avec succès');
      queryClient.invalidateQueries({ queryKey: ['campus'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la modification: ${(error as Error).message}`);
    },
  });
}

export function useDeleteCampus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campusId: string) => {
      const { error } = await supabase
        .from('campus')
        .delete()
        .eq('id', campusId);

      if (error) throw error;
      return campusId;
    },
    onSuccess: () => {
      toast.success('Campus supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['campus'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${(error as Error).message}`);
    },
  });
}