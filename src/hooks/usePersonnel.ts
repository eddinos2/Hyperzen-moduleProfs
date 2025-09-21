import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { debugLogger } from '../lib/debug';
import toast from 'react-hot-toast';

export function usePersonnel() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['personnel'],
    queryFn: async () => {
      debugLogger.info('PERSONNEL', 'Récupération personnel via RPC');
      
      const { data, error } = await supabase
        .rpc('get_personnel_enriched');
        
      if (error) {
        debugLogger.error('PERSONNEL', 'Erreur RPC get_personnel_enriched', error);
        throw error;
      }
      
      debugLogger.info('PERSONNEL', 'Personnel récupéré', { count: data?.length || 0 });
      return data || [];
    },
    enabled: !!profile && profile.role === 'SUPER_ADMIN',
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour récupérer les assignations de campus
export function useCampusAssignments() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['campus-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_campus_assignments');
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile && profile.role === 'SUPER_ADMIN',
    staleTime: 30 * 1000,
  });
}

// Hook pour assigner un directeur à un campus
export function useAssignDirector() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ directorId, campusId }: { directorId: string; campusId: string }) => {
      debugLogger.info('PERSONNEL', 'Assignation directeur via hook', { directorId, campusId });
      
      const { data, error } = await supabase
        .rpc('assign_director_to_campus', {
          p_director_id: directorId,
          p_campus_id: campusId
        });
        
      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      
      return data;
    },
    onSuccess: () => {
      toast.success('Directeur assigné avec succès');
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
      queryClient.invalidateQueries({ queryKey: ['campus'] });
      queryClient.invalidateQueries({ queryKey: ['campus-assignments'] });
    },
    onError: (error) => {
      toast.error(`Erreur assignation: ${(error as Error).message}`);
    },
  });
}

// Hook pour retirer un directeur d'un campus
export function useRemoveDirector() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (directorId: string) => {
      debugLogger.info('PERSONNEL', 'Retrait directeur via hook', { directorId });
      
      const { data, error } = await supabase
        .rpc('remove_director_from_campus', {
          p_director_id: directorId
        });
        
      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      
      return data;
    },
    onSuccess: () => {
      toast.success('Directeur retiré avec succès');
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
      queryClient.invalidateQueries({ queryKey: ['campus'] });
      queryClient.invalidateQueries({ queryKey: ['campus-assignments'] });
    },
    onError: (error) => {
      toast.error(`Erreur retrait: ${(error as Error).message}`);
    },
  });
}

export function useCreatePersonnel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (personnelData: any) => {
      // 1. Créer l'utilisateur dans auth.users
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: personnelData.email,
        password: personnelData.password,
        email_confirm: true,
        user_metadata: {
          first_name: personnelData.first_name,
          last_name: personnelData.last_name
        }
      });

      if (authError) throw authError;
      if (!authUser.user) throw new Error('Utilisateur non créé');

      // 2. Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: personnelData.email,
          first_name: personnelData.first_name,
          last_name: personnelData.last_name,
          role: personnelData.role,
          campus_id: personnelData.campus_id || null
        });

      if (profileError) throw profileError;

      // 3. Si c'est un directeur de campus, mettre à jour le campus
      if (personnelData.role === 'DIRECTEUR_CAMPUS' && personnelData.campus_id) {
        debugLogger.info('PERSONNEL', 'Assignation nouveau directeur', {
          directorId: authUser.user.id,
          campusId: personnelData.campus_id
        });

        const { data: assignResult, error: assignError } = await supabase
          .rpc('assign_director_to_campus', {
            p_director_id: authUser.user.id,
            p_campus_id: personnelData.campus_id
          });

        if (assignError) {
          debugLogger.error('PERSONNEL', 'Erreur assignation nouveau directeur', assignError);
          throw assignError;
        }

        if (!assignResult.success) {
          throw new Error(assignResult.message);
        }
      }
      // Si c'est un professeur avec campus
      else if (personnelData.role === 'ENSEIGNANT' && personnelData.campus_id) {
        const { data: assignResult, error: assignError } = await supabase
          .rpc('assign_professor_to_campus', {
            p_professor_id: authUser.user.id,
            p_campus_id: personnelData.campus_id
          });

        if (assignError) throw assignError;
        if (!assignResult.success) throw new Error(assignResult.message);
      }

      return authUser.user;
    },
    onSuccess: () => {
      toast.success('Personnel créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
      queryClient.invalidateQueries({ queryKey: ['campus'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création: ${(error as Error).message}`);
    },
  });
}

export function useUpdatePersonnel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      debugLogger.info('PERSONNEL', 'Début mise à jour personnel', { id, updateData });

      // Si changement de rôle vers directeur de campus avec assignation
      if (updateData.role === 'DIRECTEUR_CAMPUS' && updateData.campus_id) {
        debugLogger.info('PERSONNEL', 'Assignation directeur de campus', { 
          directorId: id, 
          campusId: updateData.campus_id 
        });

        // Utiliser la fonction RPC pour l'assignation
        const { data: assignResult, error: assignError } = await supabase
          .rpc('assign_director_to_campus', {
            p_director_id: id,
            p_campus_id: updateData.campus_id
          });

        if (assignError) {
          debugLogger.error('PERSONNEL', 'Erreur assignation directeur', assignError);
          throw assignError;
        }

        if (!assignResult.success) {
          throw new Error(assignResult.message);
        }

        debugLogger.info('PERSONNEL', 'Assignation directeur réussie', assignResult);
      }
      // Si changement de rôle vers professeur avec assignation campus
      else if (updateData.role === 'ENSEIGNANT' && updateData.campus_id) {
        debugLogger.info('PERSONNEL', 'Assignation professeur de campus', { 
          professorId: id, 
          campusId: updateData.campus_id 
        });

        const { data: assignResult, error: assignError } = await supabase
          .rpc('assign_professor_to_campus', {
            p_professor_id: id,
            p_campus_id: updateData.campus_id
          });

        if (assignError) {
          debugLogger.error('PERSONNEL', 'Erreur assignation professeur', assignError);
          throw assignError;
        }

        if (!assignResult.success) {
          throw new Error(assignResult.message);
        }

        debugLogger.info('PERSONNEL', 'Assignation professeur réussie', assignResult);
      }
      // Si on retire le rôle de directeur
      else if (updateData.role !== 'DIRECTEUR_CAMPUS') {
        debugLogger.info('PERSONNEL', 'Retrait rôle directeur', { id });
        
        const { data: removeResult, error: removeError } = await supabase
          .rpc('remove_director_from_campus', {
            p_director_id: id
          });

        if (removeError) {
          debugLogger.error('PERSONNEL', 'Erreur retrait directeur', removeError);
          throw removeError;
        }

        debugLogger.info('PERSONNEL', 'Retrait directeur réussi', removeResult);
      }

      // Mettre à jour le profil avec les nouvelles données
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: updateData.email,
          first_name: updateData.first_name,
          last_name: updateData.last_name,
          role: updateData.role,
          // campus_id sera mis à jour par les fonctions RPC
        })
        .eq('id', id);

      if (profileError) {
        debugLogger.error('PERSONNEL', 'Erreur mise à jour profil', profileError);
        throw profileError;
      }

      debugLogger.info('PERSONNEL', 'Mise à jour personnel terminée avec succès');
      return { id, ...updateData };
    },
    onSuccess: () => {
      toast.success('Personnel modifié avec succès');
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
      queryClient.invalidateQueries({ queryKey: ['campus'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la modification: ${(error as Error).message}`);
    },
  });
}

export function useDeletePersonnel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (personnelId: string) => {
      debugLogger.info('PERSONNEL', 'Début suppression personnel', { personnelId });

      // Vérifier le rôle avant suppression
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', personnelId)
        .single();

      // Si c'est un directeur, le retirer des campus
      if (profile?.role === 'DIRECTEUR_CAMPUS') {
        const { data: removeResult, error: removeError } = await supabase
          .rpc('remove_director_from_campus', {
            p_director_id: personnelId
          });

        if (removeError) {
          debugLogger.error('PERSONNEL', 'Erreur retrait directeur avant suppression', removeError);
          console.warn('Erreur retrait directeur:', removeError);
        }
      }

      // Supprimer le profil (cascade supprimera l'utilisateur auth)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', personnelId);

      if (error) throw error;

      // Supprimer l'utilisateur auth
      const { error: authError } = await supabase.auth.admin.deleteUser(personnelId);
      if (authError) console.warn('Erreur suppression auth:', authError);

      return personnelId;
    },
    onSuccess: () => {
      toast.success('Personnel supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
      queryClient.invalidateQueries({ queryKey: ['campus'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${(error as Error).message}`);
    },
  });
}

export function useImportPersonnel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (csvContent: string) => {
      const lines = csvContent.trim().split('\n');
      const results = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const [nom, prenom, email, role, campusName] = line.split(',').map(s => s.trim());
        
        try {
          // Vérifier si le campus existe
          let campusId = null;
          if (campusName) {
            const { data: campusData } = await supabase
              .from('campus')
              .select('id')
              .eq('name', campusName)
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
              role: role || 'ENSEIGNANT',
              campus_id: campusId
            });

          if (profileError) throw profileError;

          // Si directeur de campus, assigner au campus
          if (role === 'DIRECTEUR_CAMPUS' && campusId) {
            const { error: updateCampusError } = await supabase
              .from('campus')
              .update({ directeur_id: authUser.user!.id })
              .eq('id', campusId);

            if (updateCampusError) throw updateCampusError;
          }

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
        toast.success(`${successful} personne(s) importée(s) avec succès`);
      }
      if (failed > 0) {
        toast.error(`${failed} erreur(s) lors de l'import`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
      queryClient.invalidateQueries({ queryKey: ['campus'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'import: ${(error as Error).message}`);
    },
  });
}

export function useGenerateAccess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (personnelIds: string[]) => {
      const results = [];
      
      for (const personnelId of personnelIds) {
        try {
          // Générer un nouveau mot de passe temporaire
          const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
          
          // Mettre à jour le mot de passe
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            personnelId,
            { password: tempPassword }
          );

          if (updateError) throw updateError;

          // Récupérer les infos du personnel
          const { data: personnel } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', personnelId)
            .single();

          if (personnel) {
            // TODO: Envoyer l'email avec les nouveaux accès
            // Pour l'instant, on log les informations
            console.log(`Accès généré pour ${personnel.email}: ${tempPassword}`);
            
            results.push({
              success: true,
              email: personnel.email,
              password: tempPassword
            });
          }
        } catch (error) {
          results.push({
            success: false,
            personnelId,
            error: (error as Error).message
          });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (successful > 0) {
        toast.success(`Accès générés pour ${successful} personne(s)`);
        
        // Afficher les mots de passe générés (temporaire pour le développement)
        const successfulResults = results.filter(r => r.success);
        console.table(successfulResults.map(r => ({
          Email: r.email,
          'Mot de passe': r.password
        })));
      }
      if (failed > 0) {
        toast.error(`${failed} erreur(s) lors de la génération`);
      }
    },
    onError: (error) => {
      toast.error(`Erreur lors de la génération: ${(error as Error).message}`);
    },
  });
}