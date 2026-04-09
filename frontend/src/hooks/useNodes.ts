import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nodesService } from '@/services/nodes';
import type { UpdateNodeStatusRequest, UpdateNodeOrderRequest } from '@/types/api';

export function useNodeDetail(nodeId: string) {
  return useQuery({
    queryKey: ['nodes', nodeId],
    queryFn: async () => {
      const { data } = await nodesService.getById(nodeId);
      return data;
    },
    staleTime: 30 * 1000,
    enabled: !!nodeId,
  });
}

export function useUpdateNodeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      nodeId,
      data,
    }: {
      nodeId: string;
      data: UpdateNodeStatusRequest;
    }) => {
      const response = await nodesService.updateStatus(nodeId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}

export function useUpdateNodeOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      nodeId,
      data,
    }: {
      nodeId: string;
      data: UpdateNodeOrderRequest;
    }) => {
      const response = await nodesService.updateOrder(nodeId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}
