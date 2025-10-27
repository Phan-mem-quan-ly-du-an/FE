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

// Spring Boot Page response interface
interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export const getWorkspacesByCompanyIdParams = async (params?: GetWorkspacesByCompanyIdParams): Promise<Workspace[]> => {
    try {
        if (!params?.companyId) {
            throw new Error("companyId is required");
        }
        
        const apiCaller = new ApiCaller();
        // Updated to use new API endpoint: GET /api/companies/{companyId}/workspaces
        // Backend returns Page<Workspace>, so we need to extract the content array
        const url = `/companies/${params.companyId}/workspaces`;
        
        const response = await apiCaller
            .setUrl(url)
            .get();
        
        // Backend returns paginated response: { content: Workspace[], totalElements, totalPages, ... }
        // Extract the content array
        const data = response.data as PageResponse<Workspace>;
        if (data && Array.isArray(data.content)) {
            return data.content;
        }
        
        // Fallback: if response is already an array (shouldn't happen but just in case)
        if (Array.isArray(data)) {
            return data as Workspace[];
        }
        
        console.warn("Unexpected workspace API response format:", data);
        return [];
    } catch (error) {
        console.error("Error fetching workspaces:", error);
        throw error;
    }
};