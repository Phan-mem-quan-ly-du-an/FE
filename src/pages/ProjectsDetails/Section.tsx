import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
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
import { useTranslation } from 'react-i18next';

import OverviewTab from './OverviewTab';
import SprintTab from './SprintTab';
import KanbanBoard from '../Board/KanbanBoard';

const Section = () => {
    const { t } = useTranslation();
    const { projectId } = useParams<{ projectId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Get tab from URL or default to '1'
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || '1');
    
    const toggleTab = (tab: string) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    // Update tab from URL when it changes
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams]);

    const { data: project, isLoading, error } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProjectById(projectId!),
        enabled: !!projectId,
    });

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner color="primary" />
                <span className="ms-2">{t('LoadingProject')}</span>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="alert alert-danger text-center mt-4">
                <i className="ri-error-warning-line me-2"></i>
                {t('FailedToLoadProjectDetails')}
                <div className="mt-2">
                    <Link to="/companies" className="btn btn-outline-danger btn-sm">
                        {t('BackToProjects')}
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
                                            {project.description || t('NoDescriptionAvailable')}
                                        </p>
                                        <div className="hstack gap-3 flex-wrap">
                                            <div>
                                                <i className="ri-calendar-line align-bottom me-1"></i>
                                                {t('Created')}:{' '}
                                                <span className="fw-medium">
                                                    {new Date(project.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="vr"></div>
                                            <div>
                                                <i className="ri-refresh-line align-bottom me-1"></i>
                                                {t('Updated')}:{' '}
                                                <span className="fw-medium">
                                                    {new Date(project.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {project.archivedAt && (
                                                <>
                                                    <div className="vr"></div>
                                                    <div>
                                                        <i className="ri-archive-line align-bottom me-1"></i>
                                                        {t('Archived')}:{' '}
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
                                                    {t(project.status)}
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
                                            <i className="ri-arrow-left-line me-1"></i> {t('BackToList')}
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
                                            {t('Overview')}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === '2' }, 'fw-semibold')}
                                            onClick={() => toggleTab('2')}
                                            href="#"
                                        >
                                            {t('Sprint')}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === '3' }, 'fw-semibold')}
                                            onClick={() => toggleTab('3')}
                                            href="#"
                                        >
                                            Board
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === '4' }, 'fw-semibold')}
                                            onClick={() => toggleTab('4')}
                                            href="#"
                                        >
                                            {t('Team')}
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
                        <TabPane tabId="2">
                            <SprintTab />
                        </TabPane>
                        <TabPane tabId="3">
                            <KanbanBoard />
                        </TabPane>
                        <TabPane tabId="4">
                            <div className="py-4 text-center">
                                <i className="ri-team-line fs-1 text-muted"></i>
                                <p className="text-muted mt-2">Team management coming soon...</p>
                            </div>
                        </TabPane>
                    </TabContent>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default Section;
