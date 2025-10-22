import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {
    Card,
    CardBody,
    Col,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Input,
    Row,
    UncontrolledDropdown,
    Spinner,
    Button
} from 'reactstrap';
import {ToastContainer, toast} from 'react-toastify';
import {useTranslation} from 'react-i18next';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import slack from '../../assets/images/brands/slack.png';
import dribbble from '../../assets/images/brands/dribbble.png';
import mailChimp from '../../assets/images/brands/mail_chimp.png';
import dropbox from '../../assets/images/brands/dropbox.png';

//Import Icons
import FeatherIcon from 'feather-icons-react';

//import action
import DeleteModal from '../../Components/Common/DeleteModal';
import CreateProjectModal from './CreateProjectModal';
import EditProjectModal from './EditProjectModal';
import {getProjectsMine, deleteProject, Project} from '../../apiCaller/projects';

interface ListProps {
    workspaceId?: string;
}

const List = ({workspaceId}: ListProps = {}) => {
    const {t} = useTranslation();
    const queryClient = useQueryClient();

    const [project, setProject] = useState<any>(null);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [createModal, setCreateModal] = useState<boolean>(false);
    const [editModal, setEditModal] = useState<boolean>(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Function to map API project data to component format
    const mapProjectToComponentFormat = (apiProject: Project, index: number) => {
        const colorMap: { [key: string]: string } = {
            'red': 'danger',
            'blue': 'primary',
            'green': 'success',
            'yellow': 'warning',
            'purple': 'info',
            'orange': 'warning'
        };

        const imageMap = [slack, dribbble, mailChimp, dropbox];

        return {
            id: apiProject.id,
            time: `${t('Updated')} ${new Date(apiProject.updatedAt).toLocaleDateString()}`,
            img: imageMap[index % imageMap.length],
            imgbgColor: colorMap[apiProject.color] || 'primary',
            label: apiProject.name,
            caption: apiProject.description || t('NoDescriptionAvailable'),
            date: new Date(apiProject.createdAt).toLocaleDateString(),
            ratingClass: apiProject.status === 'active' ? 'active' : ''
        };
    };

    // React Query for fetching projects
    const {
        data: projects = [],
        isLoading: loading,
        error,
        refetch
    } = useQuery<Project[]>({
        queryKey: ['projects', 'mine', workspaceId],
        queryFn: () => getProjectsMine(workspaceId ? { workspaceId } : undefined),
    });

    // Handle error with useEffect
    useEffect(() => {
        if (error) {
            console.error('Error fetching projects:', error);
            toast.error(t('FailedToLoadProjects'));
        }
    }, [error, t]);

    // Delete project mutation
    const deleteProjectMutation = useMutation({
        mutationFn: (projectId: string) => deleteProject(projectId),
        onSuccess: () => {
            // Invalidate and refetch projects
            queryClient.invalidateQueries({ queryKey: ['projects', 'mine', workspaceId] });
            setDeleteModal(false);
            toast.success(t('ProjectDeletedSuccessfully') || 'Project deleted successfully');
        },
        onError: (error) => {
            console.error('Error deleting project:', error);
            toast.error(t('FailedToDeleteProject') || 'Failed to delete project');
        }
    });


    // Map projects to component format
    const projectLists = projects.map((project: Project, index: number) =>
        mapProjectToComponentFormat(project, index)
    );

    // delete
    const onClickData = (project: any) => {
        setProject(project);
        setDeleteModal(true);
    };

    const handleDeleteProjectList = () => {
        if (project) {
            deleteProjectMutation.mutate(project.id);
        }
    };

    const handleCreateProject = () => {
        setCreateModal(true);
    };

    // Edit project handlers
    const onClickEdit = (project: Project) => {
        setSelectedProject(project);
        setEditModal(true);
    };


    return (
        <React.Fragment>
            <ToastContainer closeButton={false}/>
            <DeleteModal
                show={deleteModal}
                onDeleteClick={() => handleDeleteProjectList()}
                onCloseClick={() => setDeleteModal(false)}
                isLoading={deleteProjectMutation.isPending}
            />
            <CreateProjectModal
                open={createModal}
                onClose={() => setCreateModal(false)}
                onCreated={() => {
                    // Invalidate and refetch projects
                    queryClient.invalidateQueries({ queryKey: ['projects', 'mine', workspaceId] });
                }}
            />
            <EditProjectModal
                open={editModal}
                onClose={() => setEditModal(false)}
                onUpdated={() => {
                    // Invalidate and refetch projects
                    queryClient.invalidateQueries({ queryKey: ['projects', 'mine', workspaceId] });
                }}
                project={selectedProject}
            />
            <Row className="g-4 mb-3">
                <div className="col-sm-auto">
                    <div>
                        <Button 
                            color="secondary" 
                            outline 
                            onClick={handleCreateProject}
                            className="btn-soft-secondary"
                        >
                            <i className="ri-add-line align-bottom me-1"></i> {t('AddNew')}
                        </Button>
                    </div>
                </div>
                <div className="col-sm-3 ms-auto">
                    <div className="d-flex justify-content-sm-end gap-2">
                        <div className="search-box ms-2 col-sm-7">
                            <Input type="text" className="form-control" placeholder={t('Search')}/>
                            <i className="ri-search-line search-icon"></i>
                        </div>
                    </div>
                </div>
            </Row>

            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                    <Spinner color="primary" />
                    <span className="ms-2">{t('LoadingProjects')}</span>
                </div>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    <i className="ri-error-warning-line me-2"></i>
                    {t('FailedToLoadProjects')}
                    <div className="mt-2">
                        <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => refetch()}
                        >
                            {t('Retry')}
                        </button>
                    </div>
                </div>
            ) : projectLists.length === 0 ? (
                <div className="text-center py-5">
                    <div className="mb-3">
                        <i className="ri-folder-open-line" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                    </div>
                    <h5 className="text-muted">{t('NoProjectsFound')}</h5>
                    <p className="text-muted">{t('GetStartedByCreating')}</p>
                    <Button 
                        color="primary" 
                        onClick={handleCreateProject}
                    >
                        <i className="ri-add-line me-1"></i> {t('CreateProject')}
                    </Button>
                </div>
            ) : (
                <div className="row">
                    {(projectLists || []).map((item: any, index: number) => (
                    <React.Fragment key={index}>
                        <Col xxl={3} sm={6} className="project-card">
                            <Card className="card-height-100">
                                <CardBody>
                                    <div className="d-flex flex-column h-100">
                                        <div className="d-flex">
                                            <div className="flex-grow-1">
                                            </div>
                                            <div className="flex-shrink-0">
                                                <div className="d-flex gap-1 align-items-center">
                                                    <UncontrolledDropdown direction="start">
                                                        <DropdownToggle tag="button"
                                                                        className="btn btn-link text-muted p-1 mt-n2 py-0 text-decoration-none fs-15">
                                                            <FeatherIcon icon="more-horizontal"
                                                                         className="icon-sm"/>
                                                        </DropdownToggle>

                                                        <DropdownMenu className="dropdown-menu-end">
                                                            <DropdownItem href="apps-projects-overview"><i
                                                                className="ri-eye-fill align-bottom me-2 text-muted"></i> {t('View')}</DropdownItem>
                                                            <DropdownItem href="#" onClick={() => onClickEdit(projects[index])}><i
                                                                className="ri-pencil-fill align-bottom me-2 text-muted"></i> {t('Edit')}</DropdownItem>
                                                            <div className="dropdown-divider"></div>
                                                            <DropdownItem href="#" onClick={() => onClickData(item)}
                                                                          data-bs-toggle="modal"
                                                                          data-bs-target="#removeProjectModal"><i
                                                                className="ri-delete-bin-fill align-bottom me-2 text-muted"></i> {t('Remove')}</DropdownItem>
                                                        </DropdownMenu>
                                                    </UncontrolledDropdown>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex mb-2">
                                            <div className="flex-shrink-0 me-3">
                                                <div className="avatar-sm">
                                                    <span
                                                        className={'avatar-title rounded p-2 bg-' + item.imgbgColor + '-subtle'}>
                                                        <img src={item.img} alt="" className="img-fluid p-1"/>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <h5 className="mb-1 fs-15">
                                                    <Link to="/apps-projects-overview" className="text-dark">
                                                        {item.label}
                                                    </Link>
                                                </h5>
                                                <p className="text-muted text-truncate-two-lines mb-3">{item.caption}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                                <div className="card-footer bg-transparent border-top-dashed py-2">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1"></div>
                                        <div className="flex-shrink-0">
                                            <div className="text-muted">
                                                <i className="ri-calendar-event-fill me-1 align-bottom"></i> {item.date}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </React.Fragment>
                    ))}
                </div>
            )}
        </React.Fragment>
    );
};

export default List;
