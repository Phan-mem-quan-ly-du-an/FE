import React from 'react';
import {Route, Routes} from 'react-router-dom';

//Layouts
import VerticalLayout from '../Layouts/index';

//routes
import {authProtectedRoutes, AuthRoute} from './allRoutes';
import AuthProtected from './AuthProtected';
import NonAuthLayout from '../Layouts/NonAuthLayout';

const Index = () => {
    // @ts-ignore
    return (
        <React.Fragment>
            <Routes>
                <Route>
                    {/*{publicRoutes.map((route, idx) => (*/}
                    {/*    <Route*/}
                    {/*        path={route.path}*/}
                    {/*        element={*/}
                    {/*            <NonAuthLayout>*/}
                    {/*                {route.component}*/}
                    {/*            </NonAuthLayout>*/}
                    {/*        }*/}
                    {/*        key={idx}*/}
                    {/*    />*/}
                    {/*))}*/}
                </Route>

                <Route>
                    {authProtectedRoutes.map((route: AuthRoute, idx) => (
                        <Route
                            path={route.path}
                            element={
                                <AuthProtected>
                                    {route.noLayout ? (
                                        <NonAuthLayout>
                                            {route.component}
                                        </NonAuthLayout>
                                    ) : (
                                        <VerticalLayout>
                                            {route.component}
                                        </VerticalLayout>
                                    )}
                                </AuthProtected>
                            }
                            key={idx}
                        />
                    ))}
                </Route>

            </Routes>
        </React.Fragment>
    );
};

export default Index;
