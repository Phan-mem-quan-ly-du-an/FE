import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BacklogSprint from '../BacklogSprint/BacklogSprint';

const SprintTab: React.FC = () => {
    const { t } = useTranslation();
    const { projectId } = useParams<{ projectId: string }>();

    if (!projectId) {
        return (
            <div className="alert alert-warning">
                {t('ProjectIDNotFound')}
            </div>
        );
    }

    return <BacklogSprint projectId={projectId} />;
};

export default SprintTab;
