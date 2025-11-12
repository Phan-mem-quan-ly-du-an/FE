import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Badge, Row, Col, Card, Dropdown, ButtonGroup, Tabs, Tab } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { taskAPI } from '../../apiCaller/backlogSprint';
import { getProjectMembers, ProjectMember } from '../../apiCaller/projectMembers';
import '../../assets/scss/pages/TaskDetailModal.scss';

interface Task {
  id: number;
  title: string;
  description?: string;
  projectId: string;
  sprintId?: number | null;
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  estimatedHours?: number;
  tags?: string;
  orderIndex: number;
  statusColumn?: {
    id: number;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface StatusColumn {
  id: number;
  name: string;
  color?: string;
}

interface TaskDetailModalProps {
  show: boolean;
  onHide: () => void;
  task: Task;
  projectId: string;
  onUpdate: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  show,
  onHide,
  task,
  projectId,
  onUpdate
}) => {
  const [formData, setFormData] = useState<Task>(task);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Mock data - Replace with actual API calls
  const [statusColumns] = useState<StatusColumn[]>([
    { id: 1, name: 'TO DO', color: '#6b7280' },
    { id: 2, name: 'IN PROGRESS', color: '#3b82f6' },
    { id: 3, name: 'IN REVIEW', color: '#f59e0b' },
    { id: 4, name: 'DONE', color: '#10b981' }
  ]);

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([
    { userId: 'unassigned', displayName: 'Unassigned', email: '' }
  ]);

  // Load project members
  useEffect(() => {
    const loadMembers = async () => {
      if (!projectId) return;
      
      try {
        const members = await getProjectMembers(projectId);
        setProjectMembers([
          { userId: 'unassigned', displayName: 'Unassigned', email: '' },
          ...members
        ]);
      } catch (error) {
        console.error('Error loading project members:', error);
      }
    };

    if (show) {
      loadMembers();
    }
  }, [projectId, show]);

  useEffect(() => {
    // Normalize task data (backend returns assigneeId, frontend uses assignedTo)
    const anyTask: any = task as any;
    const normalizedTask: Task = {
      ...task,
      assignedTo: task.assignedTo ?? anyTask.assigneeId ?? undefined
    };
    setFormData(normalizedTask);
  }, [task]);

  const handleStatusChange = async (statusColumnId: number, statusName: string) => {
    try {
      const updatedTask = {
        ...formData,
        statusColumn: { id: statusColumnId, name: statusName }
      };
      setFormData(updatedTask);
      
      await taskAPI.update(projectId, task.id, updatedTask);
      toast.success(`Status updated to ${statusName}`);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
      setFormData(task); // Revert on error
    }
  };

  const handleAssigneeChange = (userId: string, displayName: string) => {
    // Only update local state, don't save to API yet
    // User must click Save button to persist changes
    setFormData({
      ...formData,
      assignedTo: userId === 'unassigned' ? undefined : userId
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      setLoading(true);
      
      // Convert assignedTo to assigneeId for backend
      const apiPayload = {
        id: formData.id,
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        sprintId: formData.sprintId,
        assigneeId: formData.assignedTo || null, // Backend expects assigneeId
        priority: formData.priority,
        dueDate: formData.dueDate,
        estimatedHours: formData.estimatedHours,
        tags: formData.tags,
        orderIndex: formData.orderIndex,
        statusColumn: formData.statusColumn
      };
      
      await taskAPI.update(projectId, task.id, apiPayload);
      toast.success('Task updated successfully');
      onUpdate();
      onHide();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(error.response?.data?.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      setLoading(true);
      await taskAPI.delete(projectId, task.id);
      toast.success('Task deleted successfully');
      onUpdate();
      onHide();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(error.response?.data?.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (statusName: string) => {
    const status = statusColumns.find(s => s.name === statusName);
    return status?.color || '#6b7280';
  };

  const getCurrentAssignee = () => {
    if (!formData.assignedTo) return projectMembers[0]; // Unassigned
    return projectMembers.find(m => m.userId === formData.assignedTo) || projectMembers[0];
  };

  const getCurrentStatus = () => {
    return formData.statusColumn || statusColumns[0];
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <div className="d-flex align-items-center justify-content-between w-100 me-3">
          <div>
            <Modal.Title>
              Task #{task.id}
              <Badge bg={getPriorityColor(formData.priority)} className="ms-2">
                {formData.priority}
              </Badge>
            </Modal.Title>
          </div>
          <div className="d-flex gap-2">
            {/* Status Dropdown */}
            <Dropdown as={ButtonGroup}>
              <Button 
                variant="outline-secondary" 
                size="sm"
                style={{ 
                  borderColor: getStatusColor(getCurrentStatus().name),
                  color: getStatusColor(getCurrentStatus().name)
                }}
              >
                <i className="ri-checkbox-circle-line me-1"></i>
                {getCurrentStatus().name}
              </Button>
              <Dropdown.Toggle 
                split 
                variant="outline-secondary" 
                size="sm"
                style={{ 
                  borderColor: getStatusColor(getCurrentStatus().name),
                  color: getStatusColor(getCurrentStatus().name)
                }}
              />
              <Dropdown.Menu>
                {statusColumns.map(status => (
                  <Dropdown.Item
                    key={status.id}
                    onClick={() => handleStatusChange(status.id, status.name)}
                    active={getCurrentStatus().id === status.id}
                  >
                    <span
                      className="d-inline-block me-2"
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: status.color
                      }}
                    />
                    {status.name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            {/* Assignee Dropdown */}
            <Dropdown as={ButtonGroup}>
              <Button variant="outline-secondary" size="sm">
                <i className="ri-user-line me-1"></i>
                {getCurrentAssignee().displayName}
              </Button>
              <Dropdown.Toggle split variant="outline-secondary" size="sm" />
              <Dropdown.Menu>
                {projectMembers.map(member => (
                  <Dropdown.Item
                    key={member.userId}
                    onClick={() => handleAssigneeChange(member.userId, member.displayName)}
                    active={getCurrentAssignee().userId === member.userId}
                  >
                    <i className="ri-user-line me-2"></i>
                    {member.displayName}
                    {member.email && (
                      <small className="text-muted ms-2">({member.email})</small>
                    )}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'details')}
          className="mb-3"
        >
          <Tab eventKey="details" title="Details">
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Task Title *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={formData.description || ''}
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
                    <Form.Label>Due Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.dueDate || ''}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Estimated Hours</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={formData.estimatedHours || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        estimatedHours: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                    />
                  </Form.Group>
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Tags</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.tags || ''}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="frontend, api, bug-fix"
                />
              </Form.Group>
            </Form>
          </Tab>

          <Tab eventKey="activity" title="Activity">
            <div className="py-3">
              <div className="mb-3">
                <strong>Created:</strong> {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}
              </div>
              <div className="mb-3">
                <strong>Last Updated:</strong> {task.updatedAt ? new Date(task.updatedAt).toLocaleString() : 'N/A'}
              </div>
              <div className="mb-3">
                <strong>Sprint:</strong> {task.sprintId ? `Sprint #${task.sprintId}` : 'Backlog'}
              </div>
              <div className="mb-3">
                <strong>Status:</strong> {task.statusColumn?.name || 'To Do'}
              </div>
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button 
          variant="danger" 
          onClick={handleDelete}
          disabled={loading}
        >
          <i className="ri-delete-bin-line me-2"></i>
          Delete
        </Button>
        <div>
          <Button variant="secondary" onClick={onHide} className="me-2">
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={loading}
          >
            <i className="ri-save-line me-2"></i>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default TaskDetailModal;
