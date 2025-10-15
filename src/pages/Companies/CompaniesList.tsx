import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, Col, Row, Button, Input } from 'reactstrap';
import SimpleBar from 'simplebar-react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import ApiCaller from '../../helpers/apiCaller/caller/apiCaller';
import CreateCompanyModal from './CreateCompanyModal';
import EditCompanyModal from './EditCompanyModal';

export type Company = { id: string; name: string; logoUrl?: string | null };
export type Page<T> = {
    content: T[]; number: number; size: number; totalPages: number; totalElements: number; first: boolean; last: boolean;
};

function toAbsUrl(u?: string | null, base?: string) {
    try { if (!u) return ''; return new URL(u, base).toString(); } catch { return ''; }
}

export default function CompaniesList() {
    // search + debounce
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    useEffect(() => { const t = setTimeout(()=>setDebounced(search.trim()), 400); return ()=>clearTimeout(t); }, [search]);

    const queryClient = useQueryClient();
    const pageSize = 7; // giữ 10 item/đợt để bảng không chạm đáy

    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
        useInfiniteQuery<Page<Company>>({
            queryKey: ['companies', debounced],
            queryFn: async ({ pageParam = 0 }) => {
                const { data } = await new ApiCaller()
                    .setUrl('api/companies')
                    .setParams({ page: pageParam, size: pageSize, q: debounced || undefined, keyword: debounced || undefined, search: debounced || undefined })
                    .get<Page<Company>>();
                return data;
            },
            getNextPageParam: (last) => (last.last ? undefined : (last.number + 1)),
            initialPageParam: 0,
        });

    const companies = useMemo(() => ((data?.pages as Array<Page<Company>> | undefined) || []).flatMap(p => p.content || []), [data]);

    // modal states
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Company | null>(null);
    const [showEdit, setShowEdit] = useState(false);

    const onCreated = () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); refetch(); };
    const onSaved   = () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); refetch(); };

    return (
        <React.Fragment>
            <style>{`
        .glass-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 8px 32px rgba(0,0,0,0.30);
          backdrop-filter: blur(12px);
        }
        .list-card .card-header { padding-top: .7rem; padding-bottom: .45rem; }
        .list-card .table-wrap { margin-top: -6px; }
        .avatar-sm { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: #f1f3f5;
          display:flex; align-items:center; justify-content:center; border: 1px solid rgba(0,0,0,.06); font-size:12px; color:#6c757d; }
        .avatar-sm img { width:100%; height:100%; object-fit:cover; }
        .table-pro tr:hover td { background: rgba(255,255,255,0.04); }
        .table-pro td { border: 0; }
      `}</style>

            {/* card centered */}
            <Row className="justify-content-center mb-4">
                <Col xxl={5} lg={6} md={8}>
                    <Card className="rounded-3 glass-card list-card">
                        {/* Header: Title + Search + Create (right aligned) */}
                        <div className="card-header d-flex align-items-center gap-2" style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.15)'}}>
                            <h4 className="card-title mb-0 flex-grow-1 text-white">Companies</h4>

                            {/* Search desktop */}
                            <div className="d-none d-md-flex align-items-center" style={{ minWidth: 260 }}>
                                <Input type="search" placeholder="Search companies..." value={search} onChange={(e)=>setSearch(e.target.value)} />
                            </div>

                            {/* Create button -> modal center */}
                            <div className="ms-auto">
                                <Button color="primary" onClick={() => setShowCreate(true)}>+ Create Company</Button>
                            </div>
                        </div>

                        <CardBody className="pt-2 pb-3">
                            {/* Search mobile */}
                            <div className="d-md-none mb-3">
                                <Input type="search" placeholder="Search companies..." value={search} onChange={(e)=>setSearch(e.target.value)} />
                            </div>

                            <div className="table-responsive table-card table-wrap">
                                <SimpleBar style={{ maxHeight: 340 }}>
                                    <table className="table table-pro table-hover table-nowrap align-middle mb-0">
                                        <tbody>
                                        {isLoading ? (
                                            <tr><td className="text-center py-4 text-white-50">Loading...</td></tr>
                                        ) : isError ? (
                                            <tr><td className="text-center py-4 text-danger">Network error. Please reload.</td></tr>
                                        ) : companies.length === 0 ? (
                                            <tr><td className="text-center py-4 text-white-50">No companies found.</td></tr>
                                        ) : (
                                            companies.map((c) => {
                                                const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;
                                                const logo = toAbsUrl(c.logoUrl || '', base);
                                                return (
                                                    <tr key={c.id}>
                                                        <td style={{ width: 56 }}>
                                                            <div className="avatar-sm">{logo ? <img src={logo} alt={c.name} /> : <span>Logo</span>}</div>
                                                        </td>
                                                        <td className="text-white">{c.name}</td>
                                                        <td className="text-end" style={{ width: 200 }}>
                                                            <div className="btn-group">
                                                                <Button size="sm" color="light" outline href={`/companies/${c.id}/members`}>View</Button>
                                                                <Button size="sm" color="light" onClick={() => { setEditing(c); setShowEdit(true); }}>Edit</Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                        </tbody>
                                    </table>
                                </SimpleBar>
                            </div>

                            {/* Load more */}
                            {hasNextPage && (
                                <div className="d-flex justify-content-center mt-3">
                                    <Button color="secondary" outline onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                                        {isFetchingNextPage ? 'Loading...' : 'Load more'}
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Modals (centered, slightly larger) */}
            <CreateCompanyModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={onCreated} />
            <EditCompanyModal open={showEdit} onClose={() => setShowEdit(false)} company={editing} onSaved={onSaved} />
        </React.Fragment>
    );
}
