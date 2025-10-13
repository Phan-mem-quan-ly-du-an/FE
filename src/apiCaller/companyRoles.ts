import ApiCaller from "./caller/apiCaller";

export type Role = {
    id: number;
    code: string;
    name?: string | null;
    description?: string | null;
};

export const getCompanyRoles = async (companyId: string, includeGlobal: boolean = true): Promise<Role[]> => {
    const caller = new ApiCaller().setUrl(`/companies/${companyId}/roles?includeGlobal=${includeGlobal}`);
    const response = await caller.get();
    return response.data as Role[];
};

export const deleteRole = async (roleId: number): Promise<void> => {
    const caller = new ApiCaller().setUrl(`/roles/${roleId}`);
    await caller.delete();
};

export type CreateRoleRequest = {
    code: string;
    name?: string | null;
    description?: string | null;
};

export const createCompanyRole = async (companyId: string, payload: CreateRoleRequest): Promise<void> => {
    const caller = new ApiCaller().setUrl(`/companies/${companyId}/roles`);
    await caller.post({ data: payload });
};

export const updateCompanyRole = async (
    companyId: string,
    roleId: number,
    payload: CreateRoleRequest
): Promise<void> => {
    const caller = new ApiCaller().setUrl(`/companies/${companyId}/roles/${roleId}`);
    await caller.put({ data: payload });
};


