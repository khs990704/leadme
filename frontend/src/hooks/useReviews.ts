import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsService } from '@/services/reviews';
import type { CreateReviewRequest } from '@/types/api';

export function useNodeReviews(nodeId: string) {
  return useQuery({
    queryKey: ['nodes', nodeId, 'reviews'],
    queryFn: async () => {
      const { data } = await reviewsService.getByNode(nodeId);
      return data;
    },
    staleTime: 60 * 1000,
    enabled: !!nodeId,
  });
}

export function useCreateReview(nodeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateReviewRequest) => {
      const response = await reviewsService.create(nodeId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeId] });
    },
  });
}
