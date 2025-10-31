import ApiCaller from "./caller/apiCaller";

export interface WorkspaceMember {
    userId: string;
    workspaceId: string;
    roleId: number;
    role?: {
        id: number;
        name: string;
        description?: string;
    };
    owner: boolean;
    joinedAt: string;
}

export interface Workspace {
    id: string;
    companyId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
}

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

/**
 * Get workspace details by workspaceId
 */
export const getWorkspaceById = async (workspaceId: string): Promise<Workspace> => {
    try {
        const apiCaller = new ApiCaller();
        const response = await apiCaller
            .setUrl(`/workspaces/${workspaceId}`)
            .get();
        return response.data as Workspace;
    } catch (error) {
        console.error("Error fetching workspace:", error);
        throw error;
    }
};

/**
 * Get all projects in a workspace
 */
export const getProjectsByWorkspaceId = async (workspaceId: string): Promise<Project[]> => {
    try {
        const apiCaller = new ApiCaller();
        const response = await apiCaller
            .setUrl(`/workspaces/${workspaceId}/projects`)
            .setQueryParams({ includeArchived: false })
            .get();
        return response.data as Project[];
    } catch (error) {
        console.error("Error fetching workspace projects:", error);
        throw error;
    }
};

/**
 * Get all members in a workspace
 */
export const getWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
    try {
        const apiCaller = new ApiCaller();
        const response = await apiCaller
            .setUrl(`/workspaces/${workspaceId}/members`)
            .get();
        return response.data as WorkspaceMember[];
    } catch (error) {
        console.error("Error fetching workspace members:", error);
        throw error;
    }
};

export const addWorkspaceMember = async (
    workspaceId: string,
    payload: { userId: string; roleId: number }
): Promise<void> => {
    try {
        const apiCaller = new ApiCaller();
        await apiCaller
            .setUrl(`/workspaces/${workspaceId}/members`)
            .post({ data: payload });
    } catch (error) {
        console.error("Error adding workspace member:", error);
        throw error;
    }
};

export type TransferWorkspaceOwnershipRequest = {
    toUserId: string;
    downgradeRoleId: number;
};

export const transferWorkspaceOwnership = async (
    workspaceId: string,
    transferData: TransferWorkspaceOwnershipRequest
): Promise<void> => {
    try {
        const apiCaller = new ApiCaller();
        await apiCaller
            .setUrl(`/workspaces/${workspaceId}/members/transfer-ownership`)
            .post({ data: transferData });
    } catch (error) {
        console.error("Error transferring workspace ownership:", error);
        throw error;
    }
};

export const assignWorkspaceMemberRole = async (
    workspaceId: string,
    memberUserId: string,
    roleId: number
): Promise<void> => {
    try {
        const apiCaller = new ApiCaller();
        await apiCaller
            .setUrl(`/workspaces/${workspaceId}/members/${encodeURIComponent(memberUserId)}/role`)
            .put({ data: { roleId } });
    } catch (error) {
        console.error("Error assigning workspace member role:", error);
        throw error;
    }
};

export const deleteWorkspaceMember = async (
    workspaceId: string,
    userId: string
): Promise<void> => {
    try {
        const apiCaller = new ApiCaller();
        await apiCaller
            .setUrl(`/workspaces/${workspaceId}/members/${encodeURIComponent(userId)}`)
            .delete();
    } catch (error) {
        console.error("Error deleting workspace member:", error);
        throw error;
    }
};

