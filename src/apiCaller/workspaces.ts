import ApiCaller from "./caller/apiCaller";
import { Project } from "./projects";

export interface Workspace {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    archivedAt?: string | null;
}

export interface GetWorkspacesByCompanyIdParams {
    companyId?: string;
}

export interface CreateWorkspacePayload {
    name: string;
    description?: string;
}

export interface UpdateWorkspacePayload extends CreateWorkspacePayload {}

export const createWorkspace = async (companyId: string, payload: CreateWorkspacePayload): Promise<Workspace> => {
    const apiCaller = new ApiCaller();
    const url = `/companies/${companyId}/workspaces`;
    const response = await apiCaller.setUrl(url).post({ data: payload });
    return response.data as Workspace;
};

export const updateWorkspace = async (companyId: string, workspaceId: string, payload: UpdateWorkspacePayload): Promise<Workspace> => {
    const apiCaller = new ApiCaller();
    const url = `/companies/${companyId}/${workspaceId}`;
    const response = await apiCaller.setUrl(url).put({ data: payload });
    return response.data as Workspace;
};

export const deleteWorkspace = async (companyId: string, workspaceId: string): Promise<void> => {
    const apiCaller = new ApiCaller();
    const url = `/companies/${companyId}/${workspaceId}`;
    await apiCaller.setUrl(url).delete();
};

export const getWorkspacesByCompanyIdParams = async (params?: GetWorkspacesByCompanyIdParams): Promise<Workspace[]> => {
    try {
        const apiCaller = new ApiCaller();
        let url = `/companies/${params?.companyId}/workspaces`;
        
        const response = await apiCaller
            .setUrl(url)
            .get();
        
        const responseData = response.data as { content: Workspace[] };

        return responseData.content;
    } catch (error) {
        console.error("Error fetching workspaces:", error);
        throw error;
    }
};