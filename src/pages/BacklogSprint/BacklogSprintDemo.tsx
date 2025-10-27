import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import BacklogSprint from './BacklogSprint';

/**
 * Demo page for Backlog & Sprint Management
 * Allows testing with different project IDs
 */
const BacklogSprintDemo: React.FC = () => {
  const [projectId, setProjectId] = useState('');
  const [activeProjectId, setActiveProjectId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectId.trim()) {
      setActiveProjectId(projectId.trim());
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">🧪 Backlog & Sprint Demo</h5>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <strong>Note:</strong> This is a demo page. Enter a valid Project ID to test the Backlog & Sprint management features.
              </Alert>
              
              <Form onSubmit={handleSubmit}>
                <Row className="align-items-end">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Project ID</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter project ID (e.g., project-123)"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        Get the project ID from your Projects page
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Button type="submit" variant="primary" className="w-100">
                      Load Project
                    </Button>
                  </Col>
                </Row>
              </Form>

              {activeProjectId && (
                <div className="mt-3">
                  <Alert variant="success">
                    <strong>Active Project:</strong> {activeProjectId}
                  </Alert>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {activeProjectId && (
        <Row>
          <Col>
            <BacklogSprint projectId={activeProjectId} />
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default BacklogSprintDemo;
