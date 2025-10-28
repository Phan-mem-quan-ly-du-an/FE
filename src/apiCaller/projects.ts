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
    companyId?: string;
    workspaceId?: string;
}

export const getProjectsMine = async (params?: GetProjectsMineParams): Promise<Project[]> => {
    try {
        const apiCaller = new ApiCaller();
        const companyId = params?.companyId;
        const workspaceId = params?.workspaceId;

        let url: string;
        let query: Record<string, any> | undefined;

        if (companyId) {
            // New RESTful endpoint, company-scoped
            url = `/companies/${companyId}/projects/mine`;
            if (workspaceId) {
                query = { workspaceId };
            }
        } else {
            // Backward-compatible fallback
            url = `/projects/mine`;
            if (workspaceId) {
                query = { ...(query || {}), workspaceId };
            }
        }

        const caller = apiCaller.setUrl(url);
        if (query && Object.keys(query).length > 0) {
            caller.setQueryParams(query);
        }
        const response = await caller.get();

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
export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    color?: string;
}

export const updateProject = async (projectId: string, data: UpdateProjectRequest): Promise<Project> => {
    const apiCaller = new ApiCaller();
    const response = await apiCaller
        .setUrl(`/projects/${projectId}`)
        .patch({ data });
    return response.data as Project;
};

export const getProjectById = async (projectId: string): Promise<Project> => {
    try {
        const apiCaller = new ApiCaller();
        const response = await apiCaller
            .setUrl(`/projects/${projectId}`)
            .get();
        return response.data as Project;
    } catch (error) {
        console.error(`Error fetching project with ID ${projectId}:`, error);
        throw error;
    }
};

