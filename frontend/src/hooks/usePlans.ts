import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansService } from '@/services/plans';
import type {
  PlanStatus,
  CreatePlanRequest,
  UpdatePlanParamsRequest,
  GeneratePlanRequest,
  NodeStatus,
} from '@/types/api';

export function usePlans(status?: PlanStatus | PlanStatus[]) {
  return useQuery({
    queryKey: ['plans', { status }],
    queryFn: async () => {
      const { data } = await plansService.getAll({ status });
      return data;
    },
    staleTime: 30 * 1000,
  });
}

export function usePlanDetail(planId: string) {
  return useQuery({
    queryKey: ['plans', planId],
    queryFn: async () => {
      const { data } = await plansService.getById(planId);
      return data;
    },
    staleTime: 30 * 1000,
    enabled: !!planId,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePlanRequest) => {
      const response = await plansService.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useUpdatePlanParams(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdatePlanParamsRequest) => {
      const response = await plansService.updateParams(planId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', planId] });
    },
  });
}

export function useGeneratePlan(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GeneratePlanRequest) => {
      const response = await plansService.generate(planId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', planId] });
    },
  });
}

export function useConfirmPlan(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await plansService.confirm(planId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans', planId] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      await plansService.delete(planId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function usePlanNodes(
  planId: string,
  params?: { milestoneId?: string; status?: NodeStatus | NodeStatus[] }
) {
  return useQuery({
    queryKey: ['plans', planId, 'nodes', params],
    queryFn: async () => {
      const { data } = await plansService.getNodes(planId, params);
      return data;
    },
    staleTime: 10 * 1000,
    enabled: !!planId,
  });
}
