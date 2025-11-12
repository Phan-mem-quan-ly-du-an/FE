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
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  estimatedHours?: number;
  tags?: string;
  orderIndex: number;
  statusColumn?: {
    id: number;
    name: string;
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
    listByProject: async (projectId: string, page = 0, size = 1000): Promise<TaskListResponse> => {
        const response = await new ApiCaller().setUrl(`/projects/${projectId}/tasks?page=${page}&size=${size}`).get();
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
    }
};




