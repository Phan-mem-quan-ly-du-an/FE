import React, {useEffect, useState} from 'react';
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
    Spinner
} from 'reactstrap';
import {ToastContainer, toast} from 'react-toastify';
import {useTranslation} from 'react-i18next';
import slack from '../../assets/images/brands/slack.png';
import dribbble from '../../assets/images/brands/dribbble.png';
import mailChimp from '../../assets/images/brands/mail_chimp.png';
import dropbox from '../../assets/images/brands/dropbox.png';

//Import Icons
import FeatherIcon from 'feather-icons-react';

//import action
import DeleteModal from '../../Components/Common/DeleteModal';
import {getProjectsMine, Project} from '../../apiCaller/projects';

interface ListProps {
    workspaceId?: string;
}

const List = ({workspaceId}: ListProps = {}) => {
    const {t} = useTranslation();

    const [project, setProject] = useState<any>(null);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [projectLists, setProjectLists] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                setError(null);
                const projects = await getProjectsMine(workspaceId ? { workspaceId } : undefined);
                const mappedProjects = projects.map((project, index) =>
                    mapProjectToComponentFormat(project, index)
                );
                setProjectLists(mappedProjects);
            } catch (err) {
                console.error('Error fetching projects:', err);
                setError(t('FailedToLoadProjects'));
                toast.error(t('FailedToLoadProjects'));
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [workspaceId]);

    // delete
    const onClickData = (project: any) => {
        setProject(project);
        setDeleteModal(true);
    };

    const handleDeleteProjectList = () => {
        if (project) {
            // TODO: Implement delete project API call
            setDeleteModal(false);
        }
    };

    return (
        <React.Fragment>
            <ToastContainer closeButton={false}/>
            <DeleteModal
                show={deleteModal}
                onDeleteClick={() => handleDeleteProjectList()}
                onCloseClick={() => setDeleteModal(false)}
            />
            <Row className="g-4 mb-3">
                <div className="col-sm-auto">
                    <div>
                        <Link to="/apps-projects-create" className="btn btn-soft-secondary"><i
                            className="ri-add-line align-bottom me-1"></i> {t('AddNew')}</Link>
                    </div>
                </div>
                <div className="col-sm-3 ms-auto">
                    <div className="d-flex justify-content-sm-end gap-2">
                        <div className="search-box ms-2 col-sm-7">
                            <Input type="text" className="form-control" placeholder={t('Search')}/>
                            <i className="ri-search-line search-icon"></i>
                        </div>

                        <select className="form-control w-md" data-choices data-choices-search-false>
                            <option value="All">{t('All')}</option>
                            <option value="Last 7 Days">{t('Last7Days')}</option>
                            <option value="Last 30 Days">{t('Last30Days')}</option>
                            <option value="Last Year">{t('LastYear')}</option>
                            <option value="This Month">{t('ThisMonth')}</option>
                            <option value="Today">{t('Today')}</option>
                            <option value="Yesterday" defaultValue="Yesterday">{t('Yesterday')}</option>
                        </select>
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
                    {error}
                    <div className="mt-2">
                        <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => window.location.reload()}
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
                    <Link to="/apps-projects-create" className="btn btn-primary">
                        <i className="ri-add-line me-1"></i> {t('CreateProject')}
                    </Link>
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
                                                            <DropdownItem href="apps-projects-create"><i
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
