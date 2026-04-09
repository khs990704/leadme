import apiClient from '@/lib/axios';
import type {
  CreateReviewRequest,
  ReviewResponse,
  PaginatedResponse,
  PaginationQuery,
} from '@/types/api';

export const reviewsService = {
  create(nodeId: string, data: CreateReviewRequest) {
    return apiClient.post<ReviewResponse>(`/nodes/${nodeId}/reviews`, data);
  },

  getByNode(nodeId: string, params?: PaginationQuery) {
    return apiClient.get<PaginatedResponse<ReviewResponse>>(`/nodes/${nodeId}/reviews`, {
      params,
    });
  },

  update(reviewId: string, data: CreateReviewRequest) {
    return apiClient.put<ReviewResponse>(`/reviews/${reviewId}`, data);
  },
};
