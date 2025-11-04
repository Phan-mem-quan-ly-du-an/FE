import ApiCaller from "./caller/apiCaller";

export interface ProjectMember {
    userId: string;
    displayName: string;
    email: string;
    // Bổ sung để align với BE
    owner?: boolean | string | number;
    roleId?: number | null;
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

export interface AddProjectMemberRequest {
    userId: string;
    roleId: number;
}

export const addProjectMember = async (projectId: string, payload: AddProjectMemberRequest): Promise<void> => {
    try {
        const apiCaller = new ApiCaller();
        await apiCaller
            .setUrl(`/projects/${projectId}/members`)
            .post({ data: payload });
    } catch (error) {
        console.error("Error adding project member:", error);
        throw error;
    }
};

export const assignProjectMemberRole = async (
  projectId: string,
  userId: string,
  roleId: number
): Promise<void> => {
  try {
    const apiCaller = new ApiCaller();
    await apiCaller
      .setUrl(`/projects/${projectId}/members/${userId}/role`)
      .put({ data: { roleId } });
  } catch (error) {
    console.error("Error assigning project member role:", error);
    throw error;
  }
};

export const transferProjectOwnership = async (payload: { projectId: string, targetUserId: string, ownerDowngradeRoleId: number | '' }): Promise<void> => {
    try {
        const apiCaller = new ApiCaller();
        await apiCaller
            .setUrl(`/projects/${payload.projectId}/members/transfer-ownership`)
            .post({
                data: {
                    // Align FE payload keys với BE DTO: TransferProjectOwnershipReq
                    toUserId: payload.targetUserId,
                    downgradeRoleId: payload.ownerDowngradeRoleId
                }
            });
    } catch (error) {
        console.error("Error transferring project ownership:", error);
        throw error;
    }
}

export const removeProjectMember = async (projectId: string, memberUserId: string): Promise<void> => {
    try {
        const apiCaller = new ApiCaller();
        await apiCaller
            .setUrl(`/projects/${projectId}/members/${memberUserId}`)
            .delete();
    } catch (error) {
        console.error("Error removing project member:", error);
        throw error;
    }
}
