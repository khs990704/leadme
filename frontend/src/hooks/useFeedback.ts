import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackService } from '@/services/feedback';
import type { GenerateFeedbackRequest } from '@/types/api';

export function useNodeFeedback(nodeId: string) {
  return useQuery({
    queryKey: ['nodes', nodeId, 'feedback'],
    queryFn: async () => {
      const { data } = await feedbackService.getByNode(nodeId);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!nodeId,
  });
}

export function usePlanFeedback(planId: string) {
  return useQuery({
    queryKey: ['plans', planId, 'feedback'],
    queryFn: async () => {
      const { data } = await feedbackService.getByPlan(planId);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!planId,
  });
}

export function useGenerateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerateFeedbackRequest) => {
      const response = await feedbackService.generate(data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      if (variables.nodeId) {
        queryClient.invalidateQueries({
          queryKey: ['nodes', variables.nodeId, 'feedback'],
        });
      }
      if (variables.planId) {
        queryClient.invalidateQueries({
          queryKey: ['plans', variables.planId, 'feedback'],
        });
      }
    },
  });
}
