import CompaniesRolePage from '../pages/Companies/CompaniesRolePage';
import CompaniesPage from '../pages/Companies/CompaniesPage';
import CompaniesMembersPage from '../pages/Companies/CompaniesMembersPage';
import {Navigate} from 'react-router-dom';
import CreateCompanyPage from '../pages/Companies/CreateCompanyPage';
import EditCompanyPage from '../pages/Companies/EditCompanyPage';
import EditRolePermissionPage from '../pages/Companies/EditRolePermissionPage';
import CreateRolePage from '../pages/Companies/CreateRolePage';
import EditRolePage from '../pages/Companies/EditRolePage';
import AssignRolePage from '../pages/Companies/AssignRolePage';
import NFTLanding from '../pages/Companies-2';

export type AuthRoute = {
    path: string;
    component: React.ReactNode;
    noLayout?: boolean;
};

const authProtectedRoutes: AuthRoute[] = [
    {path: '/', component: <Navigate to="/companies"/>},

    // === Companies ===
    // {path: '/companies', component: <CompaniesPage/>},
    {path: '/companies/:companyId', component: <CompaniesMembersPage/>},
    {path: '/companies/:companyId/roles', component: <CompaniesRolePage/>},
    {path: '/companies/new', component: <CreateCompanyPage/>},
    {path: '/companies/:companyId/edit', component: <EditCompanyPage/>},
    {path: '/companies/:companyId/roles/:roleId/permission', component: <EditRolePermissionPage/>},
    {path: '/companies/:companyId/roles/new', component: <CreateRolePage/>},
    {path: '/companies/:companyId/roles/:roleId/edit', component: <EditRolePage/>},
    {path: '/companies/:companyId/members/:memberId/assign-role', component: <AssignRolePage/>},
    {path: '/companies', component: <NFTLanding/>, noLayout: true},
];

const publicRoutes = [];

export {authProtectedRoutes, publicRoutes};
