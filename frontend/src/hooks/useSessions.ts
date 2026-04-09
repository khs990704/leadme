import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsService } from '@/services/sessions';
import type {
  CreateSessionRequest,
  UpdateSessionRequest,
  CreateSessionLogRequest,
} from '@/types/api';

export function useNodeSessions(nodeId: string) {
  return useQuery({
    queryKey: ['nodes', nodeId, 'sessions'],
    queryFn: async () => {
      const { data } = await sessionsService.getByNode(nodeId);
      return data;
    },
    staleTime: 60 * 1000,
    enabled: !!nodeId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSessionRequest) => {
      const response = await sessionsService.create(data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nodes', variables.nodeId] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: UpdateSessionRequest;
    }) => {
      const response = await sessionsService.update(sessionId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useAddSessionLog() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: CreateSessionLogRequest;
    }) => {
      const response = await sessionsService.addLog(sessionId, data);
      return response.data;
    },
  });
}
