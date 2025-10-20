import React from 'react';
import {Container} from 'reactstrap';
import {useTranslation} from 'react-i18next';

import List from './List';
import BreadCrumb from '../../Components/Common/BreadCrumb';

const ProjectList = () => {
    const {t} = useTranslation();
    document.title = `${t('ProjectList')} | Velzon - React Admin & Dashboard Template`;
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t('ProjectList')} pageTitle={t('Projects')} />
                    <List />
                </Container>
            </div>
        </React.Fragment>
    );
};

export default ProjectList;
