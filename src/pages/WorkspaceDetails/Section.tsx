/* eslint-disable */
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
import { getWorkspaceById } from '../../apiCaller/workspaceDetails';
import { useTranslation } from 'react-i18next';

import OverviewTab from './OverviewTab';
import ProjectTab from './ProjectTab';
import MemberTab from './MemberTab';
import RoleTab from './RoleTab';

const Section = () => {
    const { t } = useTranslation();
    const { workspaceId } = useParams<{ workspaceId: string }>();
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

    const { data: workspace, isLoading, error } = useQuery({
        queryKey: ['workspace', workspaceId],
        queryFn: () => getWorkspaceById(workspaceId!),
        enabled: !!workspaceId,
    });

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner color="primary" />
                <span className="ms-2">{t('LoadingWorkspace')}</span>
            </div>
        );
    }

    if (error || !workspace) {
        return (
            <div className="alert alert-danger text-center mt-4">
                <i className="ri-error-warning-line me-2"></i>
                {t('FailedLoadWorkspaceDetails')}
                <div className="mt-2">
                    <Link to="/companies" className="btn btn-outline-danger btn-sm">
                        {t('BackToCompanies')}
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
                                                className="avatar-title rounded-circle bg-primary-subtle"
                                            >
                                                <i className="ri-folder-2-line text-primary fs-3"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md">
                                        <h3 className="fw-bold mb-1">Workspace: {workspace.name}</h3>
                                        <p className="text-muted mb-2">
                                            {workspace.description || t('NoDescriptionAvailable')}
                                        </p>
                                        <div className="hstack gap-3 flex-wrap">
                                            <div>
                                                <i className="ri-calendar-line align-bottom me-1"></i>
                                                {t('Created')}:{' '}
                                                <span className="fw-medium">
                                                    {new Date(workspace.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="vr"></div>
                                            <div>
                                                <i className="ri-refresh-line align-bottom me-1"></i>
                                                {t('Updated')}:{' '}
                                                <span className="fw-medium">
                                                    {new Date(workspace.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {workspace.archivedAt && (
                                                <>
                                                    <div className="vr"></div>
                                                    <div>
                                                        <i className="ri-archive-line align-bottom me-1"></i>
                                                        {t('Archived')}:{' '}
                                                        <span className="fw-medium">
                                                            {new Date(workspace.archivedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-auto">
                                        <Button
                                            color="secondary"
                                            outline
                                            tag={Link}
                                            to={`/companies/${workspace.companyId}/workspaces`}
                                        >
                                            <i className="ri-arrow-left-line me-1"></i> {t('BackToWorkspaces')}
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
                                            {t('WorkspaceOverview')}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === '2' }, 'fw-semibold')}
                                            onClick={() => toggleTab('2')}
                                            href="#"
                                        >
                                            {t('WorkspaceProjects')}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === '3' }, 'fw-semibold')}
                                            onClick={() => toggleTab('3')}
                                            href="#"
                                        >
                                            {t('WorkspaceMembers')}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === '4' }, 'fw-semibold')}
                                            onClick={() => toggleTab('4')}
                                            href="#"
                                        >
                                            {t('WorkspaceRoles')}
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
                            <ProjectTab />
                        </TabPane>
                        <TabPane tabId="3">
                            <MemberTab />
                        </TabPane>
                        <TabPane tabId="4">
                            <RoleTab />
                        </TabPane>
                    </TabContent>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default Section;

