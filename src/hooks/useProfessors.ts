import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';

export function useProfessors() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['professors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          campus(name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile && profile.role === 'SUPER_ADMIN',
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProfessor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (professorData: any) => {
      // 1. Créer l'utilisateur dans auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: professorData.email,
        password: professorData.password,
        email_confirm: true,
        user_metadata: {
          first_name: professorData.first_name,
          last_name: professorData.last_name
        }
      });

      if (authError) throw authError;
      if (!authUser.user) throw new Error('Utilisateur non créé');

      // 2. Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: professorData.email,
          first_name: professorData.first_name,
          last_name: professorData.last_name,
          role: professorData.role,
          campus_id: professorData.campus_id || null
        });

      if (profileError) throw profileError;

      // 3. Si c'est un directeur de campus, mettre à jour le campus
      if (professorData.role === 'DIRECTEUR_CAMPUS' && professorData.campus_id) {
        const { error: updateCampusError } = await supabase
          .from('campus')
          .update({ directeur_id: authUser.user.id })
          .eq('id', professorData.campus_id);

        if (updateCampusError) throw updateCampusError;
      }

      return authUser.user;
    },
    onSuccess: () => {
      toast.success('Professeur créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['professors'] });
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
      queryClient.invalidateQueries({ queryKey: ['campus'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création: ${(error as Error).message}`);
    },
  });
}

export function useUpdateProfessor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      // Mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);

      if (profileError) throw profileError;

      // Si changement de rôle vers directeur de campus
      if (updateData.role === 'DIRECTEUR_CAMPUS' && updateData.campus_id) {
        // Retirer l'ancien directeur du campus s'il y en a un
        const { error: removeOldDirectorError } = await supabase
          .from('campus')
          .update({ directeur_id: null })
          .eq('id', updateData.campus_id);

        if (removeOldDirectorError) console.warn('Erreur suppression ancien directeur:', removeOldDirectorError);

        // Assigner le nouveau directeur
        const { error: updateCampusError } = await supabase
          .from('campus')
          .update({ directeur_id: id })
          .eq('id', updateData.campus_id);

        if (updateCampusError) throw updateCampusError;
      }

      // Si on retire le rôle de directeur, nettoyer les campus
      if (updateData.role !== 'DIRECTEUR_CAMPUS') {
        const { error: removeFromOtherCampusError } = await supabase
          .from('campus')
          .update({ directeur_id: null })
          .eq('directeur_id', id);

        if (removeFromOtherCampusError) console.warn('Erreur suppression autres campus:', removeFromOtherCampusError);
      }

      return { id, ...updateData };
    },
    onSuccess: () => {
      toast.success('Professeur modifié avec succès');
      queryClient.invalidateQueries({ queryKey: ['professors'] });
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
      queryClient.invalidateQueries({ queryKey: ['campus'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la modification: ${(error as Error).message}`);
    },
  });
}

export function useDeleteProfessor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (professorId: string) => {
      // Retirer des campus si directeur
      const { error: removeCampusError } = await supabase
        .from('campus')
        .update({ directeur_id: null })
        .eq('directeur_id', professorId);

      if (removeCampusError) console.warn('Erreur suppression campus:', removeCampusError);

      // Supprimer le profil (cascade supprimera l'utilisateur auth)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', professorId);

      if (error) throw error;

      // Supprimer l'utilisateur auth
      const { error: authError } = await supabase.auth.admin.deleteUser(professorId);
      if (authError) console.warn('Erreur suppression auth:', authError);

      return professorId;
    },
    onSuccess: () => {
      toast.success('Professeur supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['professors'] });
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
      queryClient.invalidateQueries({ queryKey: ['campus'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${(error as Error).message}`);
    },
  });
}

export function useImportProfessors() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (csvContent: string) => {
      const lines = csvContent.trim().split('\n');
      const results = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const [nom, prenom, email, campus, filieres] = line.split(',').map(s => s.trim());
        
        try {
          // Vérifier si le campus existe
          let campusId = null;
          if (campus) {
            const { data: campusData } = await supabase
              .from('campus')
              .select('id')
              .eq('name', campus)
              .single();
            campusId = campusData?.id;
          }

          // Créer l'utilisateur
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: 'TempPassword123!', // Mot de passe temporaire
            email_confirm: true,
            user_metadata: { first_name: prenom, last_name: nom }
          });

          if (authError) throw authError;

          // Créer le profil
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.user!.id,
              email,
              first_name: prenom,
              last_name: nom,
              role: 'ENSEIGNANT',
              campus_id: campusId
            });

          if (profileError) throw profileError;

          results.push({ success: true, email });
        } catch (error) {
          results.push({ success: false, email, error: (error as Error).message });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (successful > 0) {
        toast.success(`${successful} professeur(s) importé(s) avec succès`);
      }
      if (failed > 0) {
        toast.error(`${failed} erreur(s) lors de l'import`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['professors'] });
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
      queryClient.invalidateQueries({ queryKey: ['campus'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'import: ${(error as Error).message}`);
    },
  });
}