import ApiCaller from "./caller/apiCaller";

export interface ProjectRole {
    id: number;
    code: string;
    name?: string | null;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProjectRoleDto {
    code: string;
    name?: string | null;
    description?: string | null;
}

export interface UpdateProjectRoleDto {
    code?: string;
    name?: string | null;
    description?: string | null;
}

export const getProjectRoles = async (projectId: string): Promise<ProjectRole[]> => {
    const caller = new ApiCaller().setUrl(`/projects/${projectId}/roles`);
    const response = await caller.get();
    return response.data as ProjectRole[];
};

export const getProjectRole = async (projectId: string, roleId: number): Promise<ProjectRole> => {
    const caller = new ApiCaller().setUrl(`/projects/${projectId}/roles/${roleId}`);
    const response = await caller.get();
    return response.data as ProjectRole;
};

export const createProjectRole = async (projectId: string, data: CreateProjectRoleDto): Promise<ProjectRole> => {
    const caller = new ApiCaller().setUrl(`/projects/${projectId}/roles`);
    const response = await caller.post({ data });
    return response.data as ProjectRole;
};

export const updateProjectRole = async (projectId: string, roleId: number, data: UpdateProjectRoleDto): Promise<ProjectRole> => {
    const caller = new ApiCaller().setUrl(`/projects/${projectId}/roles/${roleId}`);
    const response = await caller.put({ data });
    return response.data as ProjectRole;
};

export const deleteProjectRole = async (projectId: string, roleId: number): Promise<void> => {
    const caller = new ApiCaller().setUrl(`/projects/${projectId}/roles/${roleId}`);
    await caller.delete();
};