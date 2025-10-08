import Logout from "../pages/Authentication/Logout";
import Companies from "../pages/companies";
import AccountPage from "../pages/Accounts/AccountPage";

const authProtectedRoutes = [
    {path: "/", component: <Companies/>},
    {path: "/account", component: <AccountPage/>},
];

const publicRoutes = [
    {path: "/logout", component: <Logout/>},

];

export {authProtectedRoutes, publicRoutes};