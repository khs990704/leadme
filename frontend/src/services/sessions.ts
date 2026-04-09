import apiClient from '@/lib/axios';
import type {
  CreateSessionRequest,
  SessionResponse,
  UpdateSessionRequest,
  UpdateSessionResponse,
  CreateSessionLogRequest,
  SessionLogResponse,
  PaginatedResponse,
  PaginationQuery,
} from '@/types/api';

export const sessionsService = {
  create(data: CreateSessionRequest) {
    return apiClient.post<SessionResponse>('/sessions', data);
  },

  update(sessionId: string, data: UpdateSessionRequest) {
    return apiClient.patch<UpdateSessionResponse>(`/sessions/${sessionId}`, data);
  },

  getByNode(nodeId: string, params?: PaginationQuery) {
    return apiClient.get<PaginatedResponse<SessionResponse>>(`/nodes/${nodeId}/sessions`, {
      params,
    });
  },

  addLog(sessionId: string, data: CreateSessionLogRequest) {
    return apiClient.post<SessionLogResponse>(`/sessions/${sessionId}/logs`, data);
  },
};
