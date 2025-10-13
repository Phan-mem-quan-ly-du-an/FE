import ApiCaller from './caller/apiCaller';

export type Company = { id: string; name: string; logoUrl?: string };

export type Page<T> = {
    content: T[];
    number: number;
    size: number;
    totalPages: number;
    totalElements: number;
    first: boolean;
    last: boolean;
};

export async function fetchCompaniesPage(page: number, size: number): Promise<Page<Company>> {
    const caller = new ApiCaller().setUrl('api/companies').setParams({ page, size });
    const res = await caller.get<Page<Company>>();
    return res.data;
}


