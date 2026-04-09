import apiClient from '@/lib/axios';
import type {
  GenerateFeedbackRequest,
  FeedbackResponse,
  PaginatedResponse,
  PaginationQuery,
} from '@/types/api';

export const feedbackService = {
  generate(data: GenerateFeedbackRequest) {
    return apiClient.post<FeedbackResponse>('/feedback/generate', data);
  },

  getByNode(nodeId: string, params?: PaginationQuery) {
    return apiClient.get<PaginatedResponse<FeedbackResponse>>(`/nodes/${nodeId}/feedback`, {
      params,
    });
  },

  getByPlan(planId: string, params?: PaginationQuery) {
    return apiClient.get<PaginatedResponse<FeedbackResponse>>(`/plans/${planId}/feedback`, {
      params,
    });
  },
};
