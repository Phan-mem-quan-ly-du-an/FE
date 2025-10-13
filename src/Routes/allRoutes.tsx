import CompaniesRolePage from '../pages/Companies/CompaniesRolePage';
import CompaniesMembersPage from '../pages/CompanyMembers';
import {Navigate} from 'react-router-dom';
import CreateCompanyPage from '../pages/Companies/CreateCompanyPage';
import EditCompanyPage from '../pages/Companies/EditCompanyPage';
import EditRolePermissionPage from '../pages/Companies/EditRolePermissionPage';
import CreateRolePage from '../pages/Companies/CreateRolePage';
import EditRolePage from '../pages/Companies/EditRolePage';
import Companies from '../pages/Companies/CompaniesMainPage';
import AccountPage from '../pages/Accounts/AccountPage';

export type AuthRoute = {
    path: string;
    component: React.ReactNode;
    noLayout?: boolean;
};

const authProtectedRoutes: AuthRoute[] = [
    {path: '/', component: <Navigate to="/companies"/>},

    // === Companies ===
    {path: '/companies', component: <Companies/>, noLayout: true},
    {path: '/companies/:companyId/members', component: <CompaniesMembersPage/>},
    {path: '/account', component: <AccountPage/>},
    {path: '/companies/:companyId/roles', component: <CompaniesRolePage/>},
    {path: '/companies/new', component: <CreateCompanyPage/>},
    {path: '/companies/:companyId/edit', component: <EditCompanyPage/>},
    {path: '/companies/:companyId/roles/:roleId/permission', component: <EditRolePermissionPage/>},
    {path: '/companies/:companyId/roles/new', component: <CreateRolePage/>},
    {path: '/companies/:companyId/roles/:roleId/edit', component: <EditRolePage/>},
];

const publicRoutes = [];

export {authProtectedRoutes, publicRoutes};
