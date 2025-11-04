import ApiCaller from "./caller/apiCaller";

export type UserBrief = { id: string; email: string };

export const getUsersByIds = async (ids: string[]): Promise<UserBrief[]> => {
    if (!ids || ids.length === 0) return [];
    const caller = new ApiCaller().setUrl(`/users`);
    caller.setQueryParams({ ids: ids.join(',') });
    const res = await caller.get();
    return res.data as UserBrief[];
};


