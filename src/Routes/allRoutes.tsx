import Logout from "../pages/Authentication/Logout";
import Companies from "../pages/companies";

const authProtectedRoutes = [
    {path: "/", component: <Companies/>},
];

const publicRoutes = [
    {path: "/logout", component: <Logout/>},

];

export {authProtectedRoutes, publicRoutes};