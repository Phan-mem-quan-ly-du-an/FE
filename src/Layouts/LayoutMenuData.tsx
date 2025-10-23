import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';

const Navdata = () => {
    const history = useNavigate();
    const { companyId: routeCompanyId } = useParams();

    const [isDashboard, setIsDashboard] = useState<boolean>(false);
    const [isCurrentState, setIsCurrentState] = useState('Dashboard');

    function updateIconSidebar(e: any) {
        if (e && e.target && e.target.getAttribute('sub-items')) {
            const ul: any = document.getElementById('two-column-menu');
            const iconItems = ul.querySelectorAll('.nav-icon.active');
            let activeIconItems = [...iconItems];
            activeIconItems.forEach((item) => {
                item.classList.remove('active');
                const id = item.getAttribute('sub-items');
                const getID = document.getElementById(id) as HTMLElement;
                if (getID) getID.classList.remove('show');
            });
        }
    }

    const [companyIdSafe, setCompanyIdSafe] = useState<string | null>(null);
    useEffect(() => {
        if (routeCompanyId) {
            localStorage.setItem('currentCompanyId', routeCompanyId);
            setCompanyIdSafe(routeCompanyId);
        } else {
            const stored = localStorage.getItem('currentCompanyId');
            setCompanyIdSafe(stored || null);
        }
    }, [routeCompanyId]);

    useEffect(() => {
        document.body.classList.remove('twocolumn-panel');
        if (isCurrentState !== 'Dashboard') setIsDashboard(false);
    }, [history, isCurrentState]);

    const withCompany = useMemo(
        () => (build: (id: string) => string, fallback = '/companies') =>
            companyIdSafe ? build(companyIdSafe) : fallback,
        [companyIdSafe]
    );

    const menuItems: any = [
        {
            label: 'Menu',
            isHeader: true,
        },
        {
            id: 'CompanyMembers',
            label: 'CompanyMembers',
            icon: <FeatherIcon icon="users" className="icon-dual" />,
            link: withCompany((id) => `/companies/${id}/members`),
            stateVariables: isDashboard,
            click: function (e: any) {
                e.preventDefault();
                setIsCurrentState('CompanyMembers');
                updateIconSidebar(e);
            },
        },
        {
            id: 'CompanyRoles',
            label: 'CompanyRoles',
            icon: <FeatherIcon icon="shield" className="icon-dual" />,
            link: withCompany((id) => `/companies/${id}/roles`),
            stateVariables: isDashboard,
            click: function (e: any) {
                e.preventDefault();
                setIsCurrentState('CompanyRoles');
                updateIconSidebar(e);
            },
        },
        {
            id: 'Projects',
            label: 'Projects',
            icon: <FeatherIcon icon="folder" className="icon-dual" />,
            link: withCompany((id) => `/companies/${id}/projects`),
            stateVariables: isDashboard,
            click: function (e: any) {
                e.preventDefault();
                setIsCurrentState('Projects');
                updateIconSidebar(e);
            },
        },
        {
            id: 'Workspaces',
            label: 'Workspaces',
            icon: <FeatherIcon icon="briefcase" className="icon-dual" />,
            link: withCompany((id) => `/companies/${id}/workspaces`),
            stateVariables: isDashboard,
            click: function (e: any) {
                e.preventDefault();
                setIsCurrentState('Workspaces');
                updateIconSidebar(e);
            },
        },
    ];

    return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;
