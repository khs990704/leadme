import apiClient from '@/lib/axios';
import type {
  NodeDetailResponse,
  UpdateNodeStatusRequest,
  UpdateNodeStatusResponse,
  UpdateNodeOrderRequest,
  UpdateNodeOrderResponse,
} from '@/types/api';

export const nodesService = {
  getById(nodeId: string) {
    return apiClient.get<NodeDetailResponse>(`/nodes/${nodeId}`);
  },

  updateStatus(nodeId: string, data: UpdateNodeStatusRequest) {
    return apiClient.patch<UpdateNodeStatusResponse>(`/nodes/${nodeId}/status`, data);
  },

  updateOrder(nodeId: string, data: UpdateNodeOrderRequest) {
    return apiClient.patch<UpdateNodeOrderResponse>(`/nodes/${nodeId}/order`, data);
  },

  update(nodeId: string, data: { title?: string; estimatedMinutes?: number | null }) {
    return apiClient.put(`/nodes/${nodeId}`, data);
  },
};
