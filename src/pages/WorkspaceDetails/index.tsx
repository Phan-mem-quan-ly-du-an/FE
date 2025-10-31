import React from 'react';
import { Container } from 'reactstrap';
import Section from './Section';

const WorkspaceDetail = () => {
    document.title = "Workspace Details | Velzon - React Admin & Dashboard Template";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Section />
                </Container>
            </div>
        </React.Fragment>
    );
};

export default WorkspaceDetail;
