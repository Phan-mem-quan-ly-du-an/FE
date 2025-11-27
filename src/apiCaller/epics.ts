import axiosClient from './caller/axiosClient';

export interface Epic {
  id: number;
  projectId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface EpicDto extends Epic {
  taskCount?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Get all epics for a project
 * GET /api/projects/{projectId}/epics
 */
export const getEpicsByProject = async (projectId: string, page = 0, size = 100): Promise<PageResponse<EpicDto>> => {
  const response = await axiosClient.get(`/projects/${projectId}/epics?page=${page}&size=${size}&sort=id,desc`);
  return response.data.data || response.data;
};

/**
 * Get single epic
 * GET /api/projects/{projectId}/epics/{epicId}
 */
export const getEpic = async (projectId: string, epicId: number): Promise<EpicDto> => {
  const response = await axiosClient.get(`/projects/${projectId}/epics/${epicId}`);
  return response.data.data || response.data;
};

/**
 * Create new epic
 * POST /api/projects/{projectId}/epics
 */
export const createEpic = async (projectId: string, epic: Partial<Epic>): Promise<EpicDto> => {
  const response = await axiosClient.post(`/projects/${projectId}/epics`, epic);
  return response.data.data || response.data;
};

/**
 * Update epic
 * PUT /api/projects/{projectId}/epics/{epicId}
 */
export const updateEpic = async (projectId: string, epicId: number, epic: Partial<Epic>): Promise<EpicDto> => {
  const response = await axiosClient.put(`/projects/${projectId}/epics/${epicId}`, epic);
  return response.data.data || response.data;
};

/**
 * Delete epic
 * DELETE /api/projects/{projectId}/epics/{epicId}
 */
export const deleteEpic = async (projectId: string, epicId: number): Promise<void> => {
  await axiosClient.delete(`/projects/${projectId}/epics/${epicId}`);
};
