import ApiCaller from "./caller/apiCaller";

export interface Project {
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    color: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
}

export interface GetProjectsMineParams {
    workspaceId?: string;
}

export const getProjectsMine = async (params?: GetProjectsMineParams): Promise<Project[]> => {
    try {
        const apiCaller = new ApiCaller();
        let url = '/projects/mine';
        
        if (params?.workspaceId) {
            url += `?workspaceId=${params.workspaceId}`;
        }
        
        const response = await apiCaller
            .setUrl(url)
            .get();
        
        return response.data as Project[];
    } catch (error) {
        console.error("Error fetching projects:", error);
        throw error;
    }
};

export const deleteProject = async (projectId: string): Promise<void> => {
    try {
        const apiCaller = new ApiCaller();
        await apiCaller
            .setUrl(`/projects/${projectId}`)
            .delete();
    } catch (error) {
        console.error("Error deleting project:", error);
        throw error;
    }
};

export interface CreateProjectRequest {
    name: string;
    description?: string;
    color: string;
}

export const createProject = async (workspaceId: string, payload: CreateProjectRequest): Promise<Project> => {
    try {
        const apiCaller = new ApiCaller();
        const response = await apiCaller
            .setUrl(`/workspaces/${workspaceId}/projects`)
            .post({ data: payload });
        
        return response.data as Project;
    } catch (error) {
        console.error("Error creating project:", error);
        throw error;
    }
};

export interface RenameProjectRequest {
    name: string;
}

export const renameProject = async (projectId: string, payload: RenameProjectRequest): Promise<Project> => {
    try {
        const apiCaller = new ApiCaller();
        const response = await apiCaller
            .setUrl(`/projects/${projectId}/rename`)
            .patch({ data: payload });
        
        return response.data as Project;
    } catch (error) {
        console.error("Error renaming project:", error);
        throw error;
    }
};