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

export const getWorkspacesByCompanyIdParams = async (params?: GetWorkspacesByCompanyIdParams): Promise<Workspace[]> => {
    try {
        const apiCaller = new ApiCaller();
        let url = '/workspaces/my';
        
        if (params?.companyId) {
            url += `?companyId=${params.companyId}&includeArchived=false`;
        }
        
        const response = await apiCaller
            .setUrl(url)
            .get();
        
        return response.data as Workspace[];
    } catch (error) {
        console.error("Error fetching workspaces:", error);
        throw error;
    }
};