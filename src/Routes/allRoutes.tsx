import CompaniesRolePermissionPage from '../pages/Companies/CompaniesRolePermissionPage';
import CompaniesPage from '../pages/Companies/CompaniesPage';
import CompaniesMembersPage from '../pages/Companies/CompaniesMembersPage';
import {Navigate} from 'react-router-dom';
import CreateCompanyPage from '../pages/Companies/CreateCompanyPage';
import EditCompanyPage from '../pages/Companies/EditCompanyPage';
import RolePermissionEditPage from '../pages/Companies/RolePermissionEditPage';
import NFTLanding from '../pages/Companies-2';

export type AuthRoute = {
    path: string;
    component: React.ReactNode;
    noLayout?: boolean;
};

const authProtectedRoutes: AuthRoute[] = [
    {path: '/', component: <Navigate to="/companies"/>},

    // === Companies ===
    {path: '/companies', component: <CompaniesPage/>},
    {path: '/companies/:companyId', component: <CompaniesMembersPage/>},
    {path: '/companies/:companyId/roles', component: <CompaniesRolePermissionPage/>},
    {path: '/companies/new', component: <CreateCompanyPage/>},
    {path: '/companies/:companyId/edit', component: <EditCompanyPage/>},
    {path: '/companies/:companyId/roles/:roleId', component: <RolePermissionEditPage/>},
    { path: "/nft-landing", component: <NFTLanding />, noLayout: true },
];

const publicRoutes = [];

export {authProtectedRoutes, publicRoutes};
