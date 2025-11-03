import ApiCaller from "./caller/apiCaller";

export type WorkspaceRole = {
    id: number;
    code: string;
    name?: string | null;
    description?: string | null;
};

export const getWorkspaceRoles = async (workspaceId: string): Promise<WorkspaceRole[]> => {
    const caller = new ApiCaller().setUrl(`/workspaces/${workspaceId}/roles`);
    const response = await caller.get();
    return response.data as WorkspaceRole[];
};

export const deleteWorkspaceRole = async (workspaceId: string, roleId: number): Promise<void> => {
    const caller = new ApiCaller().setUrl(`/workspaces/${workspaceId}/roles/${roleId}`);
    await caller.delete();
};

export type CreateWorkspaceRoleRequest = {
    code: string;
    name?: string | null;
    description?: string | null;
};

export const createWorkspaceRole = async (workspaceId: string, payload: CreateWorkspaceRoleRequest): Promise<void> => {
    const caller = new ApiCaller().setUrl(`/workspaces/${workspaceId}/roles`);
    await caller.post({ data: payload });
};

export const updateWorkspaceRole = async (
    workspaceId: string,
    roleId: number,
    payload: CreateWorkspaceRoleRequest
): Promise<void> => {
    const caller = new ApiCaller().setUrl(`/workspaces/${workspaceId}/roles/${roleId}`);
    await caller.put({ data: payload });
};


