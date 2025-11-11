import React, { useState } from 'react';
import { Modal, Button, Form, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { taskAPI } from '../../apiCaller/backlogSprint';

interface CreateTaskModalProps {
  show: boolean;
  onHide: () => void;
  projectId: string;
  sprintId?: number | null;
  onSuccess: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  show,
  onHide,
  projectId,
  sprintId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    estimatedHours: '',
    dueDate: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      setLoading(true);
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        projectId: projectId,
        sprintId: sprintId || null,
        priority: formData.priority,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
        dueDate: formData.dueDate || undefined,
        tags: formData.tags.trim() || undefined,
        orderIndex: 0
      };
      console.log('📝 Creating task:', taskData);
      
      const createdTask = await taskAPI.create(projectId, taskData);
      console.log('✅ Task created:', createdTask);
      
      toast.success('Task created successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('❌ Error creating task:', error);
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      estimatedHours: '',
      dueDate: '',
      tags: ''
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Create New Task {sprintId && <Badge bg="info" className="ms-2">Sprint #{sprintId}</Badge>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Task Title *</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Implement user authentication"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe the task in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Form.Group>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    priority: e.target.value as any 
                  })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Estimated Hours</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  placeholder="e.g., 8"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                />
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Due Date</Form.Label>
            <Form.Control
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tags</Form.Label>
            <Form.Control
              type="text"
              placeholder="frontend, api, bug-fix (comma separated)"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
            <Form.Text className="text-muted">
              Separate multiple tags with commas
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Task'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateTaskModal;
