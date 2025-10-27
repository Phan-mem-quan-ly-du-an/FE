import React from 'react';
import { useParams } from 'react-router-dom';
import BacklogSprint from './BacklogSprint';

/**
 * Wrapper component để lấy projectId từ URL params
 * Route: /companies/:companyId/projects/:projectId/backlog
 */
const BacklogSprintPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Error: Project ID not found</h4>
          <p>Please navigate to this page from a valid project.</p>
        </div>
      </div>
    );
  }

  return <BacklogSprint projectId={projectId} />;
};

export default BacklogSprintPage;
