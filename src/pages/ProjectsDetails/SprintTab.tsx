import React from 'react';
import { useParams } from 'react-router-dom';
import BacklogSprint from '../BacklogSprint/BacklogSprint';

const SprintTab: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();

    if (!projectId) {
        return (
            <div className="alert alert-warning">
                Project ID not found
            </div>
        );
    }

    return <BacklogSprint projectId={projectId} />;
};

export default SprintTab;
