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

export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export interface GetWorkspacesByCompanyIdParams {
    companyId?: string;
    page?: number;
    size?: number;
    q?: string;
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
    const url = `/companies/${companyId}/workspaces/${workspaceId}`;
    const response = await apiCaller.setUrl(url).put({ data: payload });
    return response.data as Workspace;
};

export const deleteWorkspace = async (companyId: string, workspaceId: string): Promise<void> => {
    const apiCaller = new ApiCaller();
    const url = `/companies/${companyId}/workspaces/${workspaceId}`;
    await apiCaller.setUrl(url).delete();
};

export const getWorkspacesByCompanyIdParams = async (params: GetWorkspacesByCompanyIdParams): Promise<Page<Workspace>> => {
    const { companyId, ...queryParams } = params;
    const apiCaller = new ApiCaller();
    const url = `/companies/${companyId}/workspaces`;
    
    const response = await apiCaller
        .setUrl(url)
        .setQueryParams(queryParams)
        .get();
    
    return response.data as Page<Workspace>;
};

export const getAllWorkspacesByCompanyId = async (companyId: string): Promise<Workspace[]> => {
    const params = { companyId, page: 0, size: 1000 }; 
    const response = await getWorkspacesByCompanyIdParams(params);
    return response.content;
};