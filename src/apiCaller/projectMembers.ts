import ApiCaller from "./caller/apiCaller";

export interface ProjectMember {
    userId: string;
    displayName: string;
    email: string;
    role?: {
        id: number;
        name: string;
    };
}

export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    try {
        const apiCaller = new ApiCaller();
        const response = await apiCaller
            .setUrl(`/projects/${projectId}/members`)
            .get();
        
        return response.data as ProjectMember[];
    } catch (error) {
        console.error("Error fetching project members:", error);
        throw error;
    }
};
