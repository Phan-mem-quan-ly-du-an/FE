import ApiCaller from "./caller/apiCaller";

export type CompanyMember = {
    id: number;
    companyId: string;
    userId: string;
    roleId?: number | null;
    invitedEmail?: string | null;
    invitedBy?: string | null;
    joinedAt?: string | null;
    owner: boolean;
};

export type Role = { 
    id: number; 
    code: string; 
    name?: string | null; 
    description?: string | null 
};

export type InviteRequest = {
    email: string;
    roleId: number;
};

export type TransferOwnershipRequest = {
    toUserId: string;
    downgradeRoleId: number;
};

export type InviteResult = {
    email: string;
    success: boolean;
    message: string;
};

// Get company members
export const getCompanyMembers = async (companyId: string): Promise<CompanyMember[]> => {
    const caller = new ApiCaller()
        .setUrl(`/companies/${companyId}/members`);
    
    const response = await caller.get();
    return response.data as CompanyMember[];
};

// Delete company member
export const deleteCompanyMember = async (companyId: string, userId: string): Promise<void> => {
    const caller = new ApiCaller()
        .setUrl(`/companies/${companyId}/members/${encodeURIComponent(userId)}`);
    
    await caller.delete();
};

// Get company roles
export const getCompanyRoles = async (companyId: string, includeGlobal: boolean = true): Promise<Role[]> => {
    const caller = new ApiCaller()
        .setUrl(`/companies/${companyId}/roles?includeGlobal=${includeGlobal}`);
    
    const response = await caller.get();
    return response.data as Role[];
};

// Invite member to company
export const inviteMember = async (companyId: string, inviteData: InviteRequest): Promise<void> => {
    const caller = new ApiCaller()
        .setUrl(`/companies/${companyId}/invite`);
    
    await caller.post({ data: inviteData });
};

// Transfer ownership
export const transferOwnership = async (companyId: string, transferData: TransferOwnershipRequest): Promise<void> => {
    const caller = new ApiCaller()
        .setUrl(`/companies/${companyId}/members/transfer-ownership`);
    
    await caller.post({ data: transferData });
};

// Assign role to member
export const assignMemberRole = async (companyId: string, memberId: string, roleId: number): Promise<void> => {
    const caller = new ApiCaller()
        .setUrl(`/companies/${companyId}/members/${encodeURIComponent(memberId)}/role`);
    
    await caller.put({ data: { roleId } });
};

// Batch invite members with individual error handling
export const batchInviteMembers = async (
    companyId: string, 
    emails: string[], 
    roleId: number
): Promise<InviteResult[]> => {
    const results: InviteResult[] = [];
    
    for (const email of emails) {
        try {
            await inviteMember(companyId, { email, roleId });
            results.push({ email, success: true, message: 'Mời thành công' });
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.message || `Lỗi ${error.response?.status || 'unknown'}`;
            results.push({ email, success: false, message: errorMessage });
        }
    }
    
    return results;
};