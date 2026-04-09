import apiClient from '@/lib/axios';
import type {
  CreatePlanRequest,
  PlanResponse,
  PlanListItem,
  PlanDetailResponse,
  UpdatePlanParamsRequest,
  UpdateParamsResponse,
  GeneratePlanRequest,
  GeneratePlanResponse,
  ConfirmPlanResponse,
  PaginatedResponse,
  PlanStatus,
  NodeListItem,
  NodeStatus,
} from '@/types/api';

export const plansService = {
  create(data: CreatePlanRequest) {
    return apiClient.post<PlanResponse>('/plans', data);
  },

  getAll(params?: { status?: PlanStatus | PlanStatus[]; page?: number; limit?: number }) {
    return apiClient.get<PaginatedResponse<PlanListItem>>('/plans', { params });
  },

  getById(planId: string) {
    return apiClient.get<PlanDetailResponse>(`/plans/${planId}`);
  },

  updateParams(planId: string, data: UpdatePlanParamsRequest) {
    return apiClient.patch<UpdateParamsResponse>(`/plans/${planId}/params`, data);
  },

  generate(planId: string, data: GeneratePlanRequest) {
    return apiClient.post<GeneratePlanResponse>(`/plans/${planId}/generate`, data);
  },

  confirm(planId: string) {
    return apiClient.put<ConfirmPlanResponse>(`/plans/${planId}/confirm`);
  },

  delete(planId: string) {
    return apiClient.delete(`/plans/${planId}`);
  },

  getNodes(planId: string, params?: { milestoneId?: string; status?: NodeStatus | NodeStatus[] }) {
    return apiClient.get<NodeListItem[]>(`/plans/${planId}/nodes`, { params });
  },
};
