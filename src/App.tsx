import React from 'react';
import {QueryClient, QueryClientProvider,} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';

import './assets/scss/themes.scss';
import 'react-toastify/dist/ReactToastify.css';

import Route from './Routes';
import {ToastContainer} from 'react-toastify';
import { ActiveCompanyProvider } from './contexts/ActiveCompanyContext';

const queryClient = new QueryClient();

function App() {
    return (
        <React.Fragment>
            <QueryClientProvider client={queryClient}>
                <ActiveCompanyProvider>
                    <Route/>
                    <ToastContainer
                        position="top-right"
                        autoClose={5000}
                        hideProgressBar={false}
                        newestOnTop={true}
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                        theme="light"
                        style={{ zIndex: 99999 }}
                        toastStyle={{
                            fontSize: '14px',
                            padding: '12px',
                            zIndex: 99999
                        }}
                        icon={({ type }) => {
                            if (type === 'success') return '✅';
                            if (type === 'error') return '❌';
                            if (type === 'warning') return '⚠️';
                            if (type === 'info') return 'ℹ️';
                            return null;
                        }}
                    />
                    <ReactQueryDevtools initialIsOpen={false}/>
                </ActiveCompanyProvider>
            </QueryClientProvider>
        </React.Fragment>
    );
}

export default App;
