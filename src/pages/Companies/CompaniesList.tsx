import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, Col, Row, Button, Input, Modal, ModalHeader, ModalBody,
    DropdownToggle, DropdownMenu, DropdownItem, UncontrolledDropdown
} from 'reactstrap';
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

function friendlyNetworkMessage(msg?: string) {
    const s = (msg || '').toLowerCase();
    return (s.includes('500') || s.includes('failed to fetch') || s.includes('network'))
        ? 'Network error. Please reload.'
        : (msg || 'An error occurred.');
}

function ConfirmDeleteModal({
                                open, onClose, company, onDeleted,
                            }: {
    open: boolean;
    onClose: () => void;
    company: Company | null;
    onDeleted: () => void;
}) {
    const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;
    const token = (window as any).__access_token__ || localStorage.getItem('access_token') || '';
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => { if (!open) { setBusy(false); setMsg(null); } }, [open]);

    async function handleDelete() {
        if (!company?.id) return;
        setBusy(true);
        setMsg(null);
        try {
            const url = new URL(`api/companies/${company.id}`, base).toString();
            const res = await fetch(url, {
                method: 'DELETE',
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });
            if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
            onDeleted();
            onClose();
        } catch (err: any) {
            setMsg(friendlyNetworkMessage(err?.message));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal isOpen={open} toggle={onClose} centered modalClassName="modal-compact">
            <ModalHeader toggle={onClose}>Delete company</ModalHeader>
            <ModalBody>
                <style>{`
          .modal-compact .modal-dialog { max-width: 520px; }
          .modal-compact .modal-content { border-radius: 14px; }
        `}</style>
                {msg && <div className="alert alert-warning py-2">{msg}</div>}
                <p className="mb-3">
                    Are you sure you want to delete <strong>{company?.name}</strong>? This action cannot be undone.
                </p>
                <div className="d-flex justify-content-end gap-2">
                    <Button type="button" className="btn-light" onClick={onClose} disabled={busy}>Cancel</Button>
                    <Button type="button" color="danger" onClick={handleDelete} disabled={busy}>
                        {busy ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </ModalBody>
        </Modal>
    );
}

export default function CompaniesList() {
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setDebounced(search.trim()), 400);
        return () => clearTimeout(t);
    }, [search]);

    const queryClient = useQueryClient();
    const pageSize = 7;

    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
        useInfiniteQuery<Page<Company>>({
            queryKey: ['companies', debounced],
            queryFn: async ({ pageParam = 0 }) => {
                const { data } = await new ApiCaller()
                    .setUrl('api/companies')
                    .setParams({ page: pageParam, size: pageSize, q: debounced || undefined })
                    .get<Page<Company>>();
                return data;
            },
            getNextPageParam: (last) => (last.last ? undefined : (last.number + 1)),
            initialPageParam: 0,
        });

    const companies = useMemo(() => (
        ((data?.pages as Array<Page<Company>> | undefined) || []).flatMap(p => p.content || [])
    ), [data]);

    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Company | null>(null);
    const [showEdit, setShowEdit] = useState(false);
    const [toDelete, setToDelete] = useState<Company | null>(null);

    const onCreated = () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); refetch(); };
    const onSaved = () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); refetch(); };
    const onDeleted = () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); refetch(); };

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
        .table-pro tr:hover td { background: rgba(0,0,0,0.04); cursor: pointer; }
        .dropdown-menu { min-width: 120px; }
      `}</style>

            <Row className="justify-content-center mb-4">
                <Col xxl={5} lg={6} md={8}>
                    <Card className="rounded-3 glass-card list-card">
                        <div
                            className="card-header d-flex align-items-center gap-2"
                            style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.15)' }}
                        >
                            <h4 className="card-title mb-0 flex-grow-1 text-black">Companies</h4>
                            <div className="d-none d-md-flex align-items-center" style={{ minWidth: 260 }}>
                                <Input
                                    type="search"
                                    placeholder="Search companies..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="ms-auto">
                                <Button color="primary" onClick={() => setShowCreate(true)}>+ Create Company</Button>
                            </div>
                        </div>

                        <CardBody className="pt-2 pb-3">
                            <div className="d-md-none mb-3">
                                <Input
                                    type="search"
                                    placeholder="Search companies..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="table-responsive table-card table-wrap">
                                <SimpleBar style={{ maxHeight: 340 }}>
                                    <table className="table table-pro table-hover table-nowrap align-middle mb-0">
                                        <tbody>
                                        {isLoading ? (
                                            <tr><td className="text-center py-4 text-black-50">Loading...</td></tr>
                                        ) : isError ? (
                                            <tr><td className="text-center py-4 text-danger">Network error. Please reload.</td></tr>
                                        ) : companies.length === 0 ? (
                                            <tr><td className="text-center py-4 text-black-50">No companies found.</td></tr>
                                        ) : (
                                            companies.map((c) => {
                                                const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;
                                                const logo = toAbsUrl(c.logoUrl || '', base);

                                                const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
                                                    const target = e.target as HTMLElement;
                                                    if (target.closest('button') || target.closest('.dropdown-menu')) return;
                                                    window.location.href = `/companies/${c.id}/workspaces`;
                                                };

                                                return (
                                                    <tr key={c.id} onClick={handleRowClick} style={{ cursor: 'pointer' }}>
                                                        <td style={{ width: 56 }}>
                                                            <div className="avatar-sm">
                                                                {logo ? <img src={logo} alt={c.name} /> : <span>Logo</span>}
                                                            </div>
                                                        </td>
                                                        <td className="text-black">{c.name}</td>
                                                        <td className="text-end" style={{ width: 80 }}>
                                                            <UncontrolledDropdown>
                                                                <DropdownToggle tag="button" className="btn btn-link text-muted p-0">
                                                                    <i className="ri-more-2-fill fs-16"></i>
                                                                </DropdownToggle>
                                                                <DropdownMenu end>
                                                                    <DropdownItem
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditing(c);
                                                                            setShowEdit(true);
                                                                        }}
                                                                    >
                                                                        <i className="ri-edit-line me-2 text-muted"></i> Edit
                                                                    </DropdownItem>
                                                                    <DropdownItem
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setToDelete(c);
                                                                        }}
                                                                    >
                                                                        <i className="ri-delete-bin-line me-2 text-danger"></i> Delete
                                                                    </DropdownItem>
                                                                </DropdownMenu>
                                                            </UncontrolledDropdown>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                        </tbody>
                                    </table>
                                </SimpleBar>
                            </div>

                            {hasNextPage && (
                                <div className="d-flex justify-content-center mt-3">
                                    <Button
                                        color="secondary"
                                        outline
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                    >
                                        {isFetchingNextPage ? 'Loading...' : 'Load more'}
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <CreateCompanyModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={onCreated} />
            <EditCompanyModal open={showEdit} onClose={() => setShowEdit(false)} company={editing} onSaved={onSaved} />
            <ConfirmDeleteModal open={!!toDelete} onClose={() => setToDelete(null)} company={toDelete} onDeleted={onDeleted} />
        </React.Fragment>
    );
}
