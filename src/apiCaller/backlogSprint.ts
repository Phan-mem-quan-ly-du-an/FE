import ApiCaller from './caller/apiCaller';

// Type definitions
interface Sprint {
  id: number;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled' | 'paused';
  description?: string;
  isBacklog: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  projectId: string;
  sprintId?: number | null;
  assignedTo?: string;
  assigneeId?: string | null; // Backend returns assigneeId, normalize to assignedTo
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  estimatedHours?: number;
  tags?: string;
  orderIndex: number;
  statusColumn?: {
    id: number;
    name: string;
    color?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface TaskListResponse {
  content: Task[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Sprint API
export const sprintAPI = {
  listByProject: async (projectId: string): Promise<Sprint[]> => {
    const response = await new ApiCaller().setUrl(`/projects/${projectId}/sprints`).get();
    return response.data as Sprint[];
  },

  create: async (projectId: string, data: any): Promise<Sprint> => {
    const response = await new ApiCaller().setUrl(`/projects/${projectId}/sprints`).post({ data });
    return response.data as Sprint;
  },

  update: async (projectId: string, sprintId: number, data: any): Promise<Sprint> => {
    const response = await new ApiCaller().setUrl(`/projects/${projectId}/sprints/${sprintId}`).patch({ data });
    return response.data as Sprint;
  },

  delete: async (projectId: string, sprintId: number): Promise<void> => {
    await new ApiCaller().setUrl(`/projects/${projectId}/sprints/${sprintId}`).delete();
  }
};

export const taskAPI = {
    listByProject: async (projectId: string, includeArchived = true) => {
        const response = await new ApiCaller()
            .setUrl(`/projects/${projectId}/tasks?includeArchived=${includeArchived}&size=1000`)
            .get();
        const data: any = response.data;
        return (data.data || data) as TaskListResponse;
    },

    create: async (projectId: string, data: any): Promise<Task> => {
        const response = await new ApiCaller().setUrl(`/projects/${projectId}/tasks`).post({ data });
        const responseData: any = response.data;
        return (responseData.data || responseData) as Task;
    },

    update: async (projectId: string, taskId: number, data: any): Promise<Task> => {
        const response = await new ApiCaller().setUrl(`/projects/${projectId}/tasks/${taskId}`).put({ data });
        const responseData: any = response.data;
        return (responseData.data || responseData) as Task;
    },

    delete: async (projectId: string, taskId: number): Promise<void> => {
        await new ApiCaller().setUrl(`/projects/${projectId}/tasks/${taskId}`).delete();
    },

    get: async (projectId: string, taskId: number): Promise<Task> => {
        const response = await new ApiCaller().setUrl(`/projects/${projectId}/tasks/${taskId}`).get();
        const data: any = response.data;
        return (data.data || data) as Task;
    },
    archive: async (projectId: string, taskId: number): Promise<Task> => {
        const response = await new ApiCaller()
            .setUrl(`/projects/${projectId}/tasks/${taskId}/archive`)
            .patch({ data: {} });
        const responseData: any = response.data;
        return (responseData.data || responseData) as Task;
    },

    restore: async (projectId: string, taskId: number): Promise<Task> => {
        const response = await new ApiCaller()
            .setUrl(`/projects/${projectId}/tasks/${taskId}/restore`)
            .patch({ data: {} });
        const responseData: any = response.data;
        return (responseData.data || responseData) as Task;
    },

    listArchived: async (projectId: string, page = 0, size = 1000): Promise<TaskListResponse> => {
        const response = await new ApiCaller()
            .setUrl(`/projects/${projectId}/tasks/archived?page=${page}&size=${size}`)
            .get();
        const data: any = response.data;
        return (data.data || data) as TaskListResponse;
    },

    // List my tasks - tasks assigned to current user
    // Backend endpoint: GET /api/projects/{projectId}/tasks/api/my-tasks
    // Note: This endpoint returns tasks assigned to current user, but doesn't filter by projectId/sprintId
    // We need to filter by projectId and sprintId on frontend OR backend should be updated
    listMyTasks: async (projectId: string, sprintId?: number | null, page = 0, size = 1000): Promise<TaskListResponse> => {
        const apiCaller = new ApiCaller();
        
        // Endpoint path based on controller: /api/projects/{projectId}/tasks/api/my-tasks
        const url = `/projects/${projectId}/tasks/api/my-tasks`;
        const queryParams: Record<string, any> = { page, size };
        
        // Note: Backend endpoint doesn't accept sprintId param yet, but we can send it for future use
        if (sprintId) {
            queryParams.sprintId = sprintId;
        }
        
        apiCaller.setUrl(url);
        if (Object.keys(queryParams).length > 0) {
            apiCaller.setQueryParams(queryParams);
        }
        
        const response = await apiCaller.get();
        const data: any = response.data;
        return (data.data || data) as TaskListResponse;
    },

    getMetricsLast7Days: async (projectId: string): Promise<Record<string, number>> => {
        const apiCaller = new ApiCaller();
        const url = `/projects/${projectId}/tasks/metrics/7d`;
        apiCaller.setUrl(url);
        const response = await apiCaller.get();
        const data: any = response.data;
        const payload: any = data.data || data;
        return payload as Record<string, number>;
    },

    getStatusDistribution: async (projectId: string): Promise<Record<string, number>> => {
        const apiCaller = new ApiCaller();
        const url = `/projects/${projectId}/tasks/metrics/status`;
        apiCaller.setUrl(url);
        const response = await apiCaller.get();
        const data: any = response.data;
        const payload: any = data.data || data;
        return payload as Record<string, number>;
    }
    ,
    getPriorityDistribution: async (projectId: string): Promise<Record<string, number>> => {
        const apiCaller = new ApiCaller();
        const url = `/projects/${projectId}/tasks/metrics/priority`;
        apiCaller.setUrl(url);
        const response = await apiCaller.get();
        const data: any = response.data;
        const payload: any = data.data || data;
        return payload as Record<string, number>;
    },
    getWorkloadDistribution: async (projectId: string): Promise<Record<string, number>> => {
        const apiCaller = new ApiCaller();
        const url = `/projects/${projectId}/tasks/metrics/workload`;
        apiCaller.setUrl(url);
        const response = await apiCaller.get();
        const data: any = response.data;
        const payload: any = data.data || data;
        return payload as Record<string, number>;
    },
    getRecentLogs: async (projectId: string): Promise<any[]> => {
        const apiCaller = new ApiCaller();
        const url = `/projects/${projectId}/tasks/metrics/recent-log`;
        apiCaller.setUrl(url);
        const response = await apiCaller.get();
        const data: any = response.data;
        const payload: any = data.data || data;
        return Array.isArray(payload) ? payload : [];
    }
};




