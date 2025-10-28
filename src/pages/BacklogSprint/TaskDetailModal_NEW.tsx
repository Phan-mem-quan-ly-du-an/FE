import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Badge, Row, Col, Card, Tab, Nav } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { taskAPI } from '../../apiCaller/backlogSprint';
import './TaskDetailModal.scss';

interface Task {
  id: number;
  title: string;
  description?: string;
  projectId: string;
  sprintId?: number | null;
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
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
  
  // Time tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [trackedSeconds, setTrackedSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Subtasks
  const [subtasks, setSubtasks] = useState([
    { id: 1, text: 'Product Design, Figma (Software), Prototype', completed: false },
    { id: 2, text: 'Dashboards : Ecommerce, Analytics, Project,etc.', completed: true },
    { id: 3, text: 'Create calendar, chat and email app pages', completed: false },
    { id: 4, text: 'Add authentication pages', completed: false },
  ]);

  // Status options
  const [statusOptions] = useState([
    { id: 1, name: 'TO DO', color: '#6b7280' },
    { id: 2, name: 'IN PROGRESS', color: '#3b82f6' },
    { id: 3, name: 'IN REVIEW', color: '#f59e0b' },
    { id: 4, name: 'DONE', color: '#10b981' }
  ]);

  useEffect(() => {
    setFormData(task);
    // Load saved time
    const savedTime = localStorage.getItem(`task-${task.id}-time`);
    if (savedTime) {
      setTrackedSeconds(parseInt(savedTime));
    }
  }, [task]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Start tracking
  const handleStartTracking = () => {
    setIsTracking(true);
    const interval = setInterval(() => {
      setTrackedSeconds(prev => {
        const newTime = prev + 1;
        localStorage.setItem(`task-${task.id}-time`, newTime.toString());
        return newTime;
      });
    }, 1000);
    setTimerInterval(interval);
  };

  // Stop tracking
  const handleStopTracking = () => {
    setIsTracking(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    // Save to backend
    toast.success('Time saved!');
  };

  // Format seconds to hours and minutes
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return { hrs, mins };
  };

  const { hrs, mins } = formatTime(trackedSeconds);

  // Handle status change
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStatus = statusOptions.find(s => s.id === parseInt(e.target.value));
    if (!selectedStatus) return;

    try {
      const updatedTask = {
        ...formData,
        statusColumn: { id: selectedStatus.id, name: selectedStatus.name }
      };
      await taskAPI.update(projectId, task.id, updatedTask);
      setFormData(updatedTask);
      toast.success('Status updated');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Handle priority change
  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const priority = e.target.value as Task['priority'];
    try {
      const updatedTask = { ...formData, priority };
      await taskAPI.update(projectId, task.id, updatedTask);
      setFormData(updatedTask);
      toast.success('Priority updated');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update priority');
    }
  };

  // Toggle subtask
  const toggleSubtask = (id: number) => {
    setSubtasks(prev =>
      prev.map(st =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    );
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const tags = task.tags ? task.tags.split(',').map(t => t.trim()) : [];

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      className="task-detail-modal"
      centered
    >
      <Modal.Header closeButton className="border-0">
        <Modal.Title>TASK DETAILS</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Row className="g-0">
          {/* Left Side: Time Tracking */}
          <Col md={4} className="time-tracking-section">
            <div className="text-center">
              <h4 className="mb-4">Time Tracking</h4>

              {/* Clock Circle */}
              <div className="time-circle">
                <div className="time-display">
                  <i className="ri-time-line"></i>
                </div>
              </div>

              {/* Time Display */}
              <div className="time-info">
                <div className="time-value">{hrs} hrs {mins} min</div>
                <div className="time-label">{task.title}</div>
              </div>

              {/* Control Buttons */}
              <div className="tracking-controls">
                {!isTracking ? (
                  <Button variant="primary" onClick={handleStartTracking}>
                    <i className="ri-play-line me-1"></i> Start
                  </Button>
                ) : (
                  <Button variant="danger" onClick={handleStopTracking}>
                    <i className="ri-stop-line me-1"></i> Stop
                  </Button>
                )}
              </div>
            </div>

            {/* Task Info Sidebar */}
            <div className="task-info-sidebar">
              <div className="info-item">
                <div className="info-label">Status</div>
                <Form.Select 
                  size="sm" 
                  value={formData.statusColumn?.id || 1}
                  onChange={handleStatusChange}
                >
                  {statusOptions.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="info-item">
                <div className="info-label">Tasks No</div>
                <div className="info-value">#{task.id}</div>
              </div>

              <div className="info-item">
                <div className="info-label">Tasks Title</div>
                <div className="info-value">{task.title}</div>
              </div>

              <div className="info-item">
                <div className="info-label">Priority</div>
                <Form.Select
                  size="sm"
                  value={formData.priority}
                  onChange={handlePriorityChange}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </Form.Select>
              </div>

              {task.estimatedHours && (
                <div className="info-item">
                  <div className="info-label">Estimated</div>
                  <div className="info-value">{task.estimatedHours} hours</div>
                </div>
              )}

              {task.dueDate && (
                <div className="info-item">
                  <div className="info-label">Due Date</div>
                  <div className="info-value">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </Col>

          {/* Right Side: Task Content */}
          <Col md={8} className="task-content-section">
            {/* Breadcrumb */}
            <div className="breadcrumb">
              Tasks  › Task Details
            </div>

            {/* Task Header */}
            <div className="task-header">
              <h3>{task.title}</h3>
            </div>

            {/* Summary Section */}
            <div className="summary-section">
              <h5>SUMMARY</h5>
              <p>
                {task.description || 'No description provided. Click to add a description for this task.'}
              </p>
            </div>

            {/* Sub-tasks Section */}
            <div className="subtasks-section">
              <h5>SUB-TASKS</h5>
              {subtasks.map(subtask => (
                <div key={subtask.id} className="subtask-item">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(subtask.id)}
                    id={`subtask-${subtask.id}`}
                  />
                  <label
                    htmlFor={`subtask-${subtask.id}`}
                    className={subtask.completed ? 'completed' : ''}
                  >
                    {subtask.text}
                  </label>
                </div>
              ))}
            </div>

            {/* Tags Section */}
            {tags.length > 0 && (
              <div className="tags-section">
                <h5>TASKS TAGS</h5>
                <div className="tags-list">
                  {tags.map((tag, idx) => (
                    <Badge key={idx} bg="light" text="dark">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs Section */}
            <div className="tabs-section">
              <Tab.Container defaultActiveKey="comments">
                <Nav variant="tabs">
                  <Nav.Item>
                    <Nav.Link eventKey="comments">
                      Comments <Badge bg="primary">5</Badge>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="attachments">
                      Attachments File <Badge bg="primary">4</Badge>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="time-entries">
                      Time Entries <Badge bg="primary">{hrs} hrs {mins} min</Badge>
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content>
                  <Tab.Pane eventKey="comments">
                    <div className="py-3">
                      <p className="text-muted">Comments feature coming soon...</p>
                    </div>
                  </Tab.Pane>
                  <Tab.Pane eventKey="attachments">
                    <div className="py-3">
                      <p className="text-muted">Attachments feature coming soon...</p>
                    </div>
                  </Tab.Pane>
                  <Tab.Pane eventKey="time-entries">
                    <div className="py-3">
                      <p><strong>Total Time Tracked:</strong> {hrs} hrs {mins} min</p>
                      <p className="text-muted">Detailed time entries will appear here...</p>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default TaskDetailModal;
