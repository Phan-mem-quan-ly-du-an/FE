import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import * as Yup from "yup";
import { useFormik } from "formik";

import {
    Col,
    Container,
    Row,
    Card,
    CardHeader,
    CardBody,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    Form,
    Input,
    Label,
    FormFeedback,
    ModalFooter
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";

//redux
import TableContainer from "../../Components/Common/TableContainer";

import Loader from "../../Components/Common/Loader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getWorkspacesByCompanyIdParams, Workspace, createWorkspace, updateWorkspace, deleteWorkspace } from "../../apiCaller/workspaces";

const WorkspaceList = () => {
    const { companyId } = useParams();

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<any>(null);

    // Modals
    const [modal, setModal] = useState<boolean>(false);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

    const fetchWorkspaces = useCallback(async () => {
        try {
            if (companyId) {
                setLoading(true);
                const data = await getWorkspacesByCompanyIdParams({ companyId });
                setWorkspaces(data);
            }
        } catch (err) {
            setError(err);
            toast.error("Failed to fetch workspaces");
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    const toggle = useCallback(() => {
        if (modal) {
            setModal(false);
            setCurrentWorkspace(null);
        } else {
            setModal(true);
        }
    }, [modal]);

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: currentWorkspace?.name || "",
            description: currentWorkspace?.description || "",
        },
        validationSchema: Yup.object({
            name: Yup.string().required("Please enter a workspace name"),
        }),
        onSubmit: async (values) => {
            if (!companyId) return;

            try {
                if (isEdit && currentWorkspace) {
                    await updateWorkspace(companyId, currentWorkspace.id, values);
                    toast.success("Workspace updated successfully");
                } else {
                    await createWorkspace(companyId, values);
                    toast.success("Workspace created successfully");
                }
                toggle();
                fetchWorkspaces();
            } catch (error) {
                toast.error("An error occurred");
            }
        },
    });

    const handleEditClick = (workspace: Workspace) => {
        setIsEdit(true);
        setCurrentWorkspace(workspace);
        toggle();
    };

    const handleDeleteClick = (workspace: Workspace) => {
        setCurrentWorkspace(workspace);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (companyId && currentWorkspace) {
            try {
                await deleteWorkspace(companyId, currentWorkspace.id);
                toast.success("Workspace deleted successfully");
                setDeleteModal(false);
                fetchWorkspaces();
            } catch (error) {
                toast.error("Failed to delete workspace");
            }
        }
    };
    
    const handleAddClick = () => {
        setIsEdit(false);
        setCurrentWorkspace(null);
        validation.resetForm();
        toggle();
    };


    // Column
    const columns = useMemo(
        () => [
            {
                header: "Workspace Name",
                accessorKey: "name",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <Link to={`/workspaces/${cell.row.original.id}/projects`} className="fw-medium link-primary">
                        {cell.getValue()}
                    </Link>
                ),
            },
            {
                header: "Description",
                accessorKey: "description",
                enableColumnFilter: false,
            },
            {
                header: "Created At",
                accessorKey: "createdAt",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <>{new Date(cell.getValue()).toLocaleDateString()}</>
                ),
            },
            {
                header: "Action",
                cell: (cell: any) => {
                    return (
                        <ul className="list-inline hstack gap-2 mb-0">
                            <li className="list-inline-item" title="View Projects">
                                <Link to={`/workspaces/${cell.row.original.id}/projects`} className="text-primary d-inline-block">
                                    <i className="ri-eye-fill fs-16"></i>
                                </Link>
                            </li>
                            <li className="list-inline-item" title="Edit">
                                <Link className="edit-item-btn" to="#" onClick={() => handleEditClick(cell.row.original)}>
                                    <i className="ri-pencil-fill align-bottom text-muted"></i>
                                </Link>
                            </li>
                            <li className="list-inline-item" title="Delete">
                                <Link
                                    className="remove-item-btn"
                                    to="#"
                                    onClick={() => handleDeleteClick(cell.row.original)}
                                >
                                    <i className="ri-delete-bin-fill align-bottom text-muted"></i>
                                </Link>
                            </li>
                        </ul>
                    );
                },
            },
        ],
        []
    );

    document.title = "Workspaces | Velzon - React Admin & Dashboard Template";
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Workspaces" pageTitle="Management" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <div className="d-flex align-items-center flex-wrap gap-2">
                                        <div className="flex-grow-1">
                                            <button className="btn btn-primary add-btn" onClick={handleAddClick}>
                                                <i className="ri-add-fill me-1 align-bottom"></i> Add Workspace
                                            </button>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Col>
                        <Col lg={12}>
                            <Card id="companyList">
                                <CardBody className="pt-0">
                                    <div>
                                        {loading ? <Loader /> : (workspaces && workspaces.length > 0 ? (
                                            <TableContainer
                                                columns={columns}
                                                data={workspaces}
                                                isGlobalFilter={true}
                                                customPageSize={10}
                                                divClass="table-responsive table-card mb-2 mt-0"
                                                tableClass="align-middle table-nowrap"
                                                theadClass="table-light"
                                                SearchPlaceholder='Search for workspace...'
                                            />
                                        ) : (<Loader error={error} />))
                                        }
                                    </div>
                                    <ToastContainer closeButton={false} limit={1} />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
                 <Modal id="showModal" isOpen={modal} toggle={toggle} centered>
                    <ModalHeader className="bg-primary-subtle p-3" toggle={toggle}>
                        {isEdit ? "Edit Workspace" : "Add Workspace"}
                    </ModalHeader>
                    <Form className="tablelist-form" onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
                        <ModalBody>
                            <Row className="g-3">
                                <Col lg={12}>
                                    <div>
                                        <Label htmlFor="name-field" className="form-label">Workspace Name</Label>
                                        <Input
                                            name="name"
                                            id="name-field"
                                            className="form-control"
                                            placeholder="Enter Workspace Name"
                                            type="text"
                                            onChange={validation.handleChange}
                                            onBlur={validation.handleBlur}
                                            value={validation.values.name || ""}
                                            invalid={validation.touched.name && !!validation.errors.name}
                                        />
                                        {validation.touched.name && validation.errors.name ? (
                                            <FormFeedback type="invalid">{validation.errors.name}</FormFeedback>
                                        ) : null}
                                    </div>
                                </Col>
                                <Col lg={12}>
                                    <div>
                                        <Label htmlFor="description-field" className="form-label">Description</Label>
                                        <Input
                                            name="description"
                                            id="description-field"
                                            className="form-control"
                                            placeholder="Enter Description"
                                            type="textarea"
                                            rows={4}
                                            onChange={validation.handleChange}
                                            onBlur={validation.handleBlur}
                                            value={validation.values.description || ""}
                                        />
                                    </div>
                                </Col>
                            </Row>
                        </ModalBody>
                        <ModalFooter>
                            <div className="hstack gap-2 justify-content-end">
                                <Button color="light" onClick={toggle}>Close</Button>
                                <Button type="submit" color="success">
                                    {isEdit ? "Update" : "Add"}
                                </Button>
                            </div>
                        </ModalFooter>
                    </Form>
                </Modal>
                <DeleteModal
                    show={deleteModal}
                    onDeleteClick={handleDeleteConfirm}
                    onCloseClick={() => setDeleteModal(false)}
                />
            </div>
        </React.Fragment>
    );
};

export default WorkspaceList;
