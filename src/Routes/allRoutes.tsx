import CompaniesRolePermissionPage from "../pages/Companies/CompaniesRolePermissionPage";
import CompaniesPage from "../pages/Companies/CompaniesPage";
import CompaniesMembersPage from "../pages/Companies/CompaniesMembersPage";
import {Navigate} from "react-router-dom";
import CreateCompanyPage from "../pages/Companies/CreateCompanyPage";
import EditCompanyPage from "../pages/Companies/EditCompanyPage";
import RolePermissionEditPage from "../pages/Companies/RolePermissionEditPage";

const authProtectedRoutes = [
    { path: "/", component: <Navigate to="/companies" /> },

    // === Companies ===
    { path: "/companies", component: <CompaniesPage />},
    { path: "/companies/:companyId", component: <CompaniesMembersPage/> },
    { path: "/companies/:companyId/roles", component: <CompaniesRolePermissionPage /> },
    { path: "/companies/new", component: <CreateCompanyPage /> },
    { path: "/companies/:companyId/edit", component: <EditCompanyPage /> },
    { path: "/companies/:companyId/roles/:roleId", component: <RolePermissionEditPage/> },
];

const publicRoutes = [
];

export {authProtectedRoutes, publicRoutes};
