import React from 'react';
import BacklogSprint from './BacklogSprint';

/**
 * Demo page for Backlog & Sprint Management
 * This is a standalone demo that can be used to test the component
 */
const BacklogSprintDemo: React.FC = () => {
  // You can get projectId from URL params or props
  const projectId = 'demo-project-id'; // Replace with actual projectId

  return (
    <div>
      <BacklogSprint projectId={projectId} />
    </div>
  );
};

export default BacklogSprintDemo;
