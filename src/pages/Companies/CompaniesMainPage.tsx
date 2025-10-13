import {useEffect} from 'react';
import CompaniesList from './CompaniesList';

const Companies = () => {
    useEffect(() => {
        const previousHtmlOverflow = document.documentElement.style.overflow;
        const previousBodyOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        return () => {
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.style.overflow = previousBodyOverflow;
        };
    }, []);

    return (
        <div
            className={`nft-hero`}
            style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden'
            }}
        >
            <CompaniesList />
        </div>
    );
};

export default Companies;
