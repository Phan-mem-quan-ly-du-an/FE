import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from "react-i18next";
import {
    Col,
    Container,
    Row,
    Card,
    CardHeader,
    CardBody,
    Button,
    Input,
    Pagination,
    PaginationItem,
    PaginationLink
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import TableContainer from "../../Components/Common/TableContainer";
import Loader from "../../Components/Common/Loader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getWorkspacesByCompanyIdParams, Workspace, Page } from "../../apiCaller/workspaces";
import AddEditWorkspaceModal from "./AddEditWorkspaceModal";
import ConfirmDeleteWorkspaceModal from "./ConfirmDeleteWorkspaceModal";

const WorkspaceList = () => {
    const { companyId } = useParams();

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [paginationData, setPaginationData] = useState({ totalPages: 0, totalElements: 0, number: 0, size: 0 });

    // Modals state
    const [modal, setModal] = useState<boolean>(false);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

    const { data, isLoading, isError } = useQuery<Page<Workspace>>({
        queryKey: ['workspaces', companyId, page, searchQuery],
        queryFn: () => getWorkspacesByCompanyIdParams({
            companyId,
            page: page,
            size: 10,
            q: searchQuery
        }),
        enabled: !!companyId,
    });
    
    useEffect(() => {
        if (data) {
            setPaginationData({
                totalPages: data.totalPages,
                totalElements: data.totalElements,
                number: data.number,
                size: data.size,
            });
        }
    }, [data]);

    const workspaces = data?.content || [];

    const handleMutationSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['workspaces', companyId, page, searchQuery] });
    };
    
    // Other handlers remain the same...
    const toggle = () => setModal(!modal);

    const handleEditClick = (workspace: Workspace) => {
        setIsEdit(true);
        setCurrentWorkspace(workspace);
        toggle();
    };

    const handleDeleteClick = (workspace: Workspace) => {
        setCurrentWorkspace(workspace);
        setDeleteModal(true);
    };
    
    const handleAddClick = () => {
        setIsEdit(false);
        setCurrentWorkspace(null);
        toggle();
    };


    // Column
    const columns = useMemo(
        () => [
            {
                header: t('t-workspace-name-col'),
                accessorKey: "name",
                enableColumnFilter: false,
                cell: (cell: any) => (
                                                <span className="fw-medium link-primary">{cell.getValue()}</span>
                ),
            },
            {
                header: t('t-workspace-description-col'),
                accessorKey: "description",
                enableColumnFilter: false,
            },
            {
                header: t('t-workspace-created-at-col'),
                accessorKey: "createdAt",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <>{new Date(cell.getValue()).toLocaleDateString()}</>
                ),
            },
            {
                header: t('t-workspace-action-col'),
                            cell: (cell: any) => {
                    return (
                        <ul className="list-inline hstack gap-2 mb-0">
                            <li className="list-inline-item" title={t('t-workspace-view-details-tooltip')}>
                                            <a
                                                href="#"
                                                className="text-primary d-inline-block"
                                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/workspaces/${cell.row.original.id}`); }}
                                            >
                                                <i className="ri-eye-fill fs-16"></i>
                                            </a>
                            </li>
                            <li className="list-inline-item" title={t('t-workspace-edit-tooltip')}>
                                <a className="edit-item-btn" href="#" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleEditClick(cell.row.original); }}>
                                    <i className="ri-pencil-fill align-bottom text-muted"></i>
                                </a>
                            </li>
                            <li className="list-inline-item" title={t('t-workspace-delete-tooltip')}>
                                <a
                                    className="remove-item-btn"
                                    href="#"
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDeleteClick(cell.row.original); }}
                                >
                                    <i className="ri-delete-bin-fill align-bottom text-muted"></i>
                                </a>
                            </li>
                        </ul>
                    );
                },
            },
        ],
        [companyId, t]
    );

    document.title = t('t-workspace-title') + " | Velzon - React Admin & Dashboard Template";
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t('t-workspace-title')} pageTitle={t('t-workspace-management')} />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <div className="d-flex align-items-center flex-wrap gap-2">
                                        <div className="flex-grow-1">
                                            <button className="btn btn-primary add-btn" onClick={handleAddClick}>
                                                <i className="ri-add-fill me-1 align-bottom"></i> {t('t-workspace-add-btn')}
                                            </button>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Input
                                                type="text"
                                                className="form-control"
                                                placeholder={t('t-workspace-search-placeholder')}
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setPage(0); // Reset to first page on new search
                                                    setSearchQuery(e.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Col>
                        <Col lg={12}>
                            <Card id="companyList">
                                <CardBody className="pt-0">
                                    <div>
                                        {isLoading ? <Loader /> :
                                            isError ? (
                                                <div className="text-center py-4 text-danger">
                                                    <h4>{t('t-workspace-failed-to-load')}</h4>
                                                </div>
                                            ) :
                                            workspaces.length > 0 ? (
                                                <TableContainer
                                                    columns={columns}
                                                    data={workspaces}
                                                    isGlobalFilter={false} // Search is handled externally
                                                    customPageSize={10}
                                                    divClass="table-responsive table-card mb-2 mt-0"
                                                    tableClass="align-middle table-nowrap"
                                                    theadClass="table-light"
                                                    // --- Server side pagination props ---
                                                    isServerSidePagination={true}
                                                    pageCount={paginationData.totalPages}
                                                    currentPage={page}
                                                    onPageChange={setPage}
                                                    onRowClick={(row: any) => navigate(`/workspaces/${row.original.id}`)}
                                                />
                                            ) : (
                                                <div className="text-center py-4">
                                                    <h4>{t('t-workspace-no-workspaces-found')}</h4>
                                                </div>
                                            )
                                        }
                                    </div>
                                    <ToastContainer closeButton={false} limit={1} />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
                {modal && companyId && (
                    <AddEditWorkspaceModal
                        isOpen={modal}
                        toggle={toggle}
                        isEdit={isEdit}
                        workspace={currentWorkspace}
                        companyId={companyId}
                        onSuccess={handleMutationSuccess}
                    />
                )}
                {deleteModal && companyId && (
                    <ConfirmDeleteWorkspaceModal
                        isOpen={deleteModal}
                        onClose={() => setDeleteModal(false)}
                        workspace={currentWorkspace}
                        companyId={companyId}
                        onSuccess={handleMutationSuccess}
                    />
                )}
            </div>
        </React.Fragment>
    );
};

export default WorkspaceList;
