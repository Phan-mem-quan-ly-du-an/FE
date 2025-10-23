import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Card,
    CardBody,
    Col,
    Row,
    Spinner,
    Button,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane
} from 'reactstrap';
import classnames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import { getProjectById } from '../../apiCaller/projects';

// Tabs
import OverviewTab from './OverviewTab';
// Các tab khác bạn có thể tạo file rỗng trước nếu chưa làm:
// import DocumentsTab from './DocumentsTab';
// import ActivitiesTab from './ActivitiesTab';
// import TeamTab from './TeamTab';

const Section = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [activeTab, setActiveTab] = useState('1');
    const toggleTab = (tab: string) => setActiveTab(tab);

    const { data: project, isLoading, error } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProjectById(projectId!),
        enabled: !!projectId,
    });

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner color="primary" />
                <span className="ms-2">Loading project...</span>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="alert alert-danger text-center mt-4">
                <i className="ri-error-warning-line me-2"></i>
                Failed to load project details.
                <div className="mt-2">
                    <Link to="/companies" className="btn btn-outline-danger btn-sm">
                        Back to Projects
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <React.Fragment>
            {/* Header */}
            <Row>
                <Col lg={12}>
                    <Card className="mt-n4 mx-n4 border-0">
                        <div className="bg-primary-subtle">
                            <CardBody className="pb-0 px-4">
                                <Row className="align-items-center mb-3">
                                    <div className="col-md-auto">
                                        <div className="avatar-md">
                                            <div
                                                className="avatar-title rounded-circle"
                                                style={{
                                                    backgroundColor: project.color || '#3b82f6',
                                                }}
                                            >
                                                <i className="ri-folder-2-line text-white fs-3"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md">
                                        <h3 className="fw-bold mb-1">{project.name}</h3>
                                        <p className="text-muted mb-2">
                                            {project.description || 'No description available.'}
                                        </p>
                                        <div className="hstack gap-3 flex-wrap">
                                            <div>
                                                <i className="ri-calendar-line align-bottom me-1"></i>
                                                Created:{' '}
                                                <span className="fw-medium">
                                                    {new Date(project.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="vr"></div>
                                            <div>
                                                <i className="ri-refresh-line align-bottom me-1"></i>
                                                Updated:{' '}
                                                <span className="fw-medium">
                                                    {new Date(project.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {project.archivedAt && (
                                                <>
                                                    <div className="vr"></div>
                                                    <div>
                                                        <i className="ri-archive-line align-bottom me-1"></i>
                                                        Archived:{' '}
                                                        <span className="fw-medium">
                                                            {new Date(project.archivedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                            <div className="vr"></div>
                                            <div>
                                                <span
                                                    className={`badge rounded-pill ${
                                                        project.status === 'active'
                                                            ? 'bg-success'
                                                            : 'bg-secondary'
                                                    } fs-12`}
                                                >
                                                    {project.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-auto">
                                        <Button
                                            color="secondary"
                                            outline
                                            tag={Link}
                                            to={`/companies/${project.workspaceId}/projects`}
                                        >
                                            <i className="ri-arrow-left-line me-1"></i> Back to list
                                        </Button>
                                    </div>
                                </Row>

                                {/* Tabs Navigation */}
                                <Nav className="nav-tabs-custom border-bottom-0" role="tablist">
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === '1' }, 'fw-semibold')}
                                            onClick={() => toggleTab('1')}
                                            href="#"
                                        >
                                            Overview
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === '2' }, 'fw-semibold')}
                                            onClick={() => toggleTab('2')}
                                            href="#"
                                        >
                                            Documents
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === '3' }, 'fw-semibold')}
                                            onClick={() => toggleTab('3')}
                                            href="#"
                                        >
                                            Activities
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === '4' }, 'fw-semibold')}
                                            onClick={() => toggleTab('4')}
                                            href="#"
                                        >
                                            Team
                                        </NavLink>
                                    </NavItem>
                                </Nav>
                            </CardBody>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Tabs Content */}
            <Row>
                <Col lg={12}>
                    <TabContent activeTab={activeTab} className="text-muted">
                        <TabPane tabId="1">
                            <OverviewTab />
                        </TabPane>
                        {/*<TabPane tabId="2">*/}
                        {/*    <DocumentsTab />*/}
                        {/*</TabPane>*/}
                        {/*<TabPane tabId="3">*/}
                        {/*    <ActivitiesTab />*/}
                        {/*</TabPane>*/}
                        {/*<TabPane tabId="4">*/}
                        {/*    <TeamTab />*/}
                        {/*</TabPane>*/}
                    </TabContent>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default Section;
