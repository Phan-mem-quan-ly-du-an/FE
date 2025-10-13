import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';

//Import Icons
import FeatherIcon from 'feather-icons-react';

const Navdata = () => {
    const history = useNavigate();
    const {companyId} = useParams();
    const [isDashboard, setIsDashboard] = useState<boolean>(false);

    const [isCurrentState, setIsCurrentState] = useState('Dashboard');

    function updateIconSidebar(e: any) {
        if (e && e.target && e.target.getAttribute('sub-items')) {
            const ul: any = document.getElementById('two-column-menu');
            const iconItems = ul.querySelectorAll('.nav-icon.active');
            let activeIconItems = [...iconItems];
            activeIconItems.forEach((item) => {
                item.classList.remove('active');
                var id = item.getAttribute('sub-items');
                const getID = document.getElementById(id) as HTMLElement;
                if (getID)
                    getID.classList.remove('show');
            });
        }
    }

    useEffect(() => {
        document.body.classList.remove('twocolumn-panel');
        if (isCurrentState !== 'Dashboard') {
            setIsDashboard(false);
        }
    }, [
        history,
        isCurrentState]);

    const menuItems: any = [
        {
            label: 'Menu',
            isHeader: true,
        },
        {
            id: 'CompanyMembers',
            label: 'CompanyMembers',
            icon: <FeatherIcon icon="users" className="icon-dual"/>,
            link: `/companies/${companyId}/members`,
            stateVariables: isDashboard,
            click: function (e: any) {
                e.preventDefault();
                setIsCurrentState('CompanyMembers');
                updateIconSidebar(e);
            }
        }
    ];
    return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;
