import React from 'react';
import { Container } from 'reactstrap';
import Section from './Section';

const ProjectDetail = () => {
    document.title = "Project Details | Velzon - React Admin & Dashboard Template";

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

export default ProjectDetail;
