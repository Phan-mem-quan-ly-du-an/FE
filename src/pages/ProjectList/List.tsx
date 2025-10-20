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
    UncontrolledDropdown
} from 'reactstrap';
import {ToastContainer} from 'react-toastify';
import slack from '../../assets/images/brands/slack.png';
import dribbble from '../../assets/images/brands/dribbble.png';
import mailChimp from '../../assets/images/brands/mail_chimp.png';
import dropbox from '../../assets/images/brands/dropbox.png';
import avatar2 from '../../assets/images/users/avatar-2.jpg';
import avatar3 from '../../assets/images/users/avatar-3.jpg';
import avatar4 from '../../assets/images/users/avatar-4.jpg';
import avatar5 from '../../assets/images/users/avatar-5.jpg';
//redux
import {useDispatch} from 'react-redux';

//Import Icons
import FeatherIcon from 'feather-icons-react';

//import action
import DeleteModal from '../../Components/Common/DeleteModal';

const List = () => {
    const dispatch = useDispatch<any>();

    // Inside your component
    const projectLists = [
        {
            id: 1,
            isDesign1: true,
            time: 'Updated 3hrs ago',
            img: slack,
            imgbgColor: 'warning',
            label: 'Slack brand logo design',
            caption: 'Create a Brand logo design for a velzon admin.',
            number: '18/42',
            progressBar: '34%',
            subItem: [
                {id: 1, imgFooter: avatar2},
                {id: 2, imgNumber: '+'},
            ],
            date: '10 Jul, 2021',
            ratingClass: ''
        },
        {
            id: 2,
            isDesign1: true,
            time: 'Last update : 08 May',
            img: dribbble,
            imgbgColor: 'danger',
            label: 'Redesign - Landing page',
            caption: 'Resign a landing page design. as per abc minimal design.',
            number: '22/56',
            progressBar: '54%',
            subItem: [
                {id: 1, imgFooter: avatar3},
                {id: 2, imgNumber: 'S', bgColor: 'primary'},
                {id: 3, imgFooter: avatar4},
                {id: 4, imgNumber: '+'},
            ],
            date: '18 May, 2021',
            ratingClass: 'active'
        },
        {
            id: 3,
            isDesign1: true,
            time: 'Updated 2hrs ago',
            img: mailChimp,
            imgbgColor: 'success',
            label: 'Chat Application',
            caption:
                'Create a Chat application for business messaging needs. Collaborate efficiently with secure direct messages and group chats.',
            number: '14/20',
            progressBar: '65%',
            subItem: [
                {id: 1, imgFooter: avatar5},
                {id: 2, imgNumber: 'M', bgColor: 'primary'},
                {id: 3, imgNumber: '+'},
            ],
            date: '21 Feb, 2021',
            ratingClass: 'active'
        },
        {
            id: 4,
            isDesign1: true,
            time: 'Last update : 21 Jun',
            img: dropbox,
            imgbgColor: 'info',
            label: 'Project App',
            caption:
                'Create a project application for a project management and task management.',
            number: '20/34',
            progressBar: '78%',
            subItem: [
                {id: 1, imgNumber: 'K', bgColor: 'primary'},
                {id: 2, imgNumber: 'M', bgColor: 'success'},
                {id: 3, imgNumber: '+'},
            ],
            date: '03 Aug, 2021',
            ratingClass: ''
        },
    ];

    const [project, setProject] = useState<any>(null);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);

    useEffect(() => {
        // dispatch(onGetProjectList());
    }, [dispatch]);

    // delete
    const onClickData = (project: any) => {
        setProject(project);
        setDeleteModal(true);
    };

    const handleDeleteProjectList = () => {
        if (project) {
            // dispatch(onDeleteProjectList(project.id));
            setDeleteModal(false);
        }
    };

    const activebtn = (ele: any) => {
        if (ele.closest('button').classList.contains('active')) {
            ele.closest('button').classList.remove('active');
        } else {
            ele.closest('button').classList.add('active');
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
                            className="ri-add-line align-bottom me-1"></i> Add New</Link>
                    </div>
                </div>
                <div className="col-sm-3 ms-auto">
                    <div className="d-flex justify-content-sm-end gap-2">
                        <div className="search-box ms-2 col-sm-7">
                            <Input type="text" className="form-control" placeholder="Search..."/>
                            <i className="ri-search-line search-icon"></i>
                        </div>

                        <select className="form-control w-md" data-choices data-choices-search-false>
                            <option value="All">All</option>
                            <option value="Last 7 Days">Last 7 Days</option>
                            <option value="Last 30 Days">Last 30 Days</option>
                            <option value="Last Year">Last Year</option>
                            <option value="This Month">This Month</option>
                            <option value="Today">Today</option>
                            <option value="Yesterday" defaultValue="Yesterday">Yesterday</option>
                        </select>
                    </div>
                </div>
            </Row>

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
                                                                className="ri-eye-fill align-bottom me-2 text-muted"></i> View</DropdownItem>
                                                            <DropdownItem href="apps-projects-create"><i
                                                                className="ri-pencil-fill align-bottom me-2 text-muted"></i> Edit</DropdownItem>
                                                            <div className="dropdown-divider"></div>
                                                            <DropdownItem href="#" onClick={() => onClickData(item)}
                                                                          data-bs-toggle="modal"
                                                                          data-bs-target="#removeProjectModal"><i
                                                                className="ri-delete-bin-fill align-bottom me-2 text-muted"></i> Remove</DropdownItem>
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
                                                <h5 className="mb-1 fs-15"><Link to="/apps-projects-overview"
                                                                                 className="text-dark">{item.label}</Link>
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
        </React.Fragment>
    );
};

export default List;
