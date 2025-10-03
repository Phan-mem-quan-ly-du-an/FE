import React from 'react';
import { Routes, Route } from "react-router-dom";

//Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

//routes
import { authProtectedRoutes, publicRoutes } from "./allRoutes";
import AuthProtected  from './AuthProtected';
import {AuthProvider} from "react-oidc-context";

const Index = () => {
    return (
        <React.Fragment>
            <Routes>
                <Route>
                    {publicRoutes.map((route, idx) => (
                        <Route
                            path={route.path}
                            element={
                                <NonAuthLayout>
                                    {route.component}
                                </NonAuthLayout>
                            }
                            key={idx}
                        />
                    ))}
                </Route>

                <Route>
                    {authProtectedRoutes.map((route, idx) => (
                        <Route
                            path={route.path}
                            element={
                                <AuthProvider>
                                    <VerticalLayout>{route.component}</VerticalLayout>
                                </AuthProvider>}
                            key={idx}
                        />
                    ))}
                </Route>
            </Routes>
        </React.Fragment>
    );
};

export default Index;