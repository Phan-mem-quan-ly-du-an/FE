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
