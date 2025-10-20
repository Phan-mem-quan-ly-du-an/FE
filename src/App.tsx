import React from 'react';
import {QueryClient, QueryClientProvider,} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';

import './assets/scss/themes.scss';

import Route from './Routes';
import {ToastContainer} from 'react-toastify';

const queryClient = new QueryClient();

function App() {
    return (
        <React.Fragment>
            <QueryClientProvider client={queryClient}>
                <Route/>
                <ToastContainer/>
                <ReactQueryDevtools initialIsOpen={false}/>
            </QueryClientProvider>
        </React.Fragment>
    );
}

export default App;
