import axiosClient from './caller/axiosClient';

/**
 * API Caller cho Board System
 * Endpoint chuẩn Jira: Project → Board → BoardColumn → Task
 */

// ============= INTERFACES =============
export interface TaskResponse {
  id: number;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  estimatedHours?: number;
  assigneeId?: string | null; // Allow null for unassigned
  sprintId?: string;
  epicId?: number | null;
  epicTitle?: string;
  tags?: string;
  orderIndex: number;
  projectId: string;
  statusColumn?: {
    id: number;
    name: string;
    color?: string;
  };
}

export interface BoardColumnResponse {
  id: number;
  boardId: number;
  name: string;
  position: number;
  color: string;
  tasks: TaskResponse[];
}

export interface BoardResponse {
  id: number;
  projectId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  columns: BoardColumnResponse[];
  activeSprintId?: number | null;
  activeSprintName?: string | null;
}

export interface BoardCreateRequest {
  projectId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface BoardColumnCreateRequest {
  boardId: number;
  name: string;
  position?: number;
  color?: string;
}

export interface BoardColumnUpdateRequest {
  name?: string;
  position?: number;
  color?: string;
}

// ============= API FUNCTIONS =============

/**
 * API 1: Lấy toàn bộ Board với columns và tasks (Quan trọng nhất)
 * GET /api/projects/{projectId}/board
 */
export const getBoardByProjectId = async (projectId: string): Promise<BoardResponse> => {
  const response = await axiosClient.get(`/projects/${projectId}/board`);
  return response.data;
};

/**
 * API 2: Tạo board mới
 * POST /api/boards
 */
export const createBoard = async (request: BoardCreateRequest): Promise<BoardResponse> => {
  const response = await axiosClient.post('/boards', request);
  return response.data;
};

/**
 * API 3: Lấy tất cả boards của project
 * GET /api/projects/{projectId}/boards
 */
export const getBoardsByProjectId = async (projectId: string): Promise<BoardResponse[]> => {
  const response = await axiosClient.get(`/projects/${projectId}/boards`);
  return response.data;
};

/**
 * API 4: Tạo column mới
 * POST /api/boards/{boardId}/columns
 */
export const createColumn = async (
  boardId: number,
  request: BoardColumnCreateRequest
): Promise<BoardColumnResponse> => {
  const response = await axiosClient.post(`/boards/${boardId}/columns`, request);
  return response.data;
};

/**
 * API 5: Cập nhật column
 * PUT /api/columns/{columnId}
 */
export const updateColumn = async (
  columnId: number,
  request: BoardColumnUpdateRequest
): Promise<BoardColumnResponse> => {
  const response = await axiosClient.put(`/columns/${columnId}`, request);
  return response.data;
};

/**
 * API 6: Xóa column
 * DELETE /api/columns/{columnId}
 */
export const deleteColumn = async (columnId: number): Promise<void> => {
  await axiosClient.delete(`/columns/${columnId}`);
};

/**
 * API 7: Reorder columns (kéo thả)
 * PATCH /api/boards/{boardId}/columns/reorder
 */
export const reorderColumns = async (boardId: number, columnIds: number[]): Promise<void> => {
  await axiosClient.patch(`/boards/${boardId}/columns/reorder`, columnIds);
};

/**
 * API 8: Lấy danh sách columns của board
 * GET /api/boards/{boardId}/columns
 */
export const getColumnsByBoardId = async (boardId: number): Promise<BoardColumnResponse[]> => {
  const response = await axiosClient.get(`/boards/${boardId}/columns`);
  return response.data;
};

/**
 * Helper: Di chuyển task sang column khác
 * PUT /api/projects/{projectId}/tasks/{taskId}
 */
export const moveTask = async (
  projectId: string,
  taskId: number,
  columnId: number,
  orderIndex: number
): Promise<void> => {
  await axiosClient.patch(`/projects/${projectId}/tasks/${taskId}/move`, {
    newColumnId: columnId,
    newOrderIndex: orderIndex,
  });
};

/**
 * API: Tạo task mới
 * POST /api/projects/{projectId}/tasks
 */
export interface CreateTaskRequest {
  title: string;
  description?: string;
  statusColumnId?: number;
  priority?: string;
  dueDate?: string;
  estimatedHours?: number;
  assigneeId?: string;
  sprintId?: number;
  tags?: string;
}

export const createTask = async (
  projectId: string,
  request: CreateTaskRequest
): Promise<TaskResponse> => {
  const response = await axiosClient.post(`/projects/${projectId}/tasks`, {
    title: request.title,
    description: request.description,
    statusColumn: request.statusColumnId ? { id: request.statusColumnId } : null,
    priority: request.priority || 'MEDIUM',
    dueDate: request.dueDate,
    estimatedHours: request.estimatedHours,
    assigneeId: request.assigneeId,
    sprintId: request.sprintId,
    tags: request.tags,
    orderIndex: 0,
  });
  return response.data.data; // API trả về { message, data }
};

export const transferTasksFromColumn = async (
  projectId: string,
  sourceColumnId: number,
  targetColumnId: number
): Promise<void> => {
  try {
    await axiosClient.patch(
      `/projects/${projectId}/columns/${sourceColumnId}/transfer/${targetColumnId}`
    );
  } catch (err: any) {
    if (err?.response?.status === 404) {
      await axiosClient.patch(
        `/columns/${sourceColumnId}/transfer/${targetColumnId}?projectId=${encodeURIComponent(projectId)}`
      );
    } else {
      throw err;
    }
  }
};

/**
 * API: Update task
 * PUT /api/projects/{projectId}/tasks/{taskId}
 */
export const updateTask = async (
  projectId: string,
  taskId: number,
  task: Partial<TaskResponse>
): Promise<TaskResponse> => {
  const response = await axiosClient.put(`/projects/${projectId}/tasks/${taskId}`, task);
  return response.data.data || response.data;
};
