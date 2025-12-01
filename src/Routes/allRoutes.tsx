    import CompaniesRolePage from '../pages/Companies/Roles/CompaniesRolePage';
import CompaniesMembersPage from '../pages/CompanyMembers';
import {Navigate} from 'react-router-dom';
import EditRolePermissionPage from '../pages/Companies/Roles/EditRolePermissionPage';
import Companies from '../pages/Companies/CompaniesMainPage';
import AccountPage from '../pages/Accounts/AccountPage';
import ProjectList from '../pages/ProjectList';
import WorkspaceList from '../pages/Workspace/WorkspaceList';
import ProjectDetail from "../pages/ProjectsDetails";
import WorkspaceDetail from "../pages/WorkspaceDetails";
import EditWorkspaceRolePermissionPage from '../pages/WorkspaceDetails/Roles/EditRolePermissionPage';
import EditProjectRolePermissionPage from '../pages/ProjectsDetails/Roles/EditProjectRolePermissionPage';

export type AuthRoute = {
    path: string;
    component: React.ReactNode;
    noLayout?: boolean;
};

const authProtectedRoutes: AuthRoute[] = [
    {path: '/', component: <Navigate to="/companies"/>},
    {path: '/account', component: <AccountPage/>},

    // === Companies ===
    {path: '/companies', component: <Companies/>, noLayout: true},
    {path: '/companies/:companyId/members', component: <CompaniesMembersPage/>},
    {path: '/companies/:companyId/roles', component: <CompaniesRolePage/>},
    {path: '/companies/:companyId/roles/:roleId/permission', component: <EditRolePermissionPage/>},
    {path: '/companies/:companyId/projects', component: <ProjectList/>},
    {path: '/companies/:companyId/workspaces', component: <WorkspaceList/>},
    {path: '/companies/:companyId/projects/:projectId', component: <ProjectDetail/> },
    {path: '/workspaces/:workspaceId', component: <WorkspaceDetail/> },
    {path: '/workspaces/:workspaceId/roles/:roleId/permissions', component: <EditWorkspaceRolePermissionPage/>},
    {path: '/projects/:projectId/roles/:roleId/permissions', component: <EditProjectRolePermissionPage/>},
];

const publicRoutes = [];

export {authProtectedRoutes, publicRoutes};
