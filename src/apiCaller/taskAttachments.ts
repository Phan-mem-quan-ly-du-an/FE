import ApiCaller from './caller/apiCaller';

export interface TaskAttachment {
  id: number;
  taskId: number;
  filename: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export const taskAttachmentAPI = {
  // List attachments for a task
  list: async (projectId: string, taskId: number): Promise<TaskAttachment[]> => {
    const response = await new ApiCaller()
      .setUrl(`/projects/${projectId}/tasks/${taskId}/attachments`)
      .get();
    return response.data as TaskAttachment[];
  },

  // Upload attachment
  upload: async (projectId: string, taskId: number, file: File): Promise<TaskAttachment> => {
    const formData = new FormData();
    formData.append('file', file);

    // Get access token (same pattern as EditCompanyModal)
    const token = (window as any).__access_token__ || localStorage.getItem('access_token') || '';
    
    // Use raw fetch for multipart/form-data upload (same pattern as uploader.ts)
    const apiBase = process.env.REACT_APP_API_URL || '';
    const url = `${apiBase}/api/projects/${projectId}/tasks/${taskId}/attachments`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });
    
    if (!res.ok) {
      throw new Error(`Upload thất bại: ${res.status} ${await res.text()}`);
    }
    
    return res.json() as Promise<TaskAttachment>;
  },

  // Delete attachment
  delete: async (projectId: string, taskId: number, attachmentId: number): Promise<void> => {
    await new ApiCaller()
      .setUrl(`/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`)
      .delete();
  }
};
