import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Badge, Row, Col, Card, Tab, Nav } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { taskAPI } from '../../apiCaller/backlogSprint';
import { getBoardByProjectId } from '../../apiCaller/boards';
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
    color?: string;
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
  statusColumns?: StatusColumn[]; // Optional: pass from parent for better performance
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  show,
  onHide,
  task,
  projectId,
  onUpdate,
  statusColumns: propStatusColumns
}) => {
  const [formData, setFormData] = useState<Task>(task);
  
  // Status columns state - will load from API if not provided via props
  const [statusColumns, setStatusColumns] = useState<StatusColumn[]>(
    propStatusColumns || [
      { id: 1, name: 'TO DO', color: '#840417ff' },
      { id: 2, name: 'IN PROGRESS', color: '#3b82f6' },
      { id: 3, name: 'DONE', color: '#10b981' }
    ]
  );
  const [loadingStatus, setLoadingStatus] = useState(false);
  
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

  // Load status columns from API if not provided via props
  const loadStatusColumns = async () => {
    if (propStatusColumns && propStatusColumns.length > 0) {
      setStatusColumns(propStatusColumns);
      return;
    }
    
    try {
      setLoadingStatus(true);
      const boardData = await getBoardByProjectId(projectId);
      if (boardData && boardData.columns && boardData.columns.length > 0) {
        const columns = boardData.columns.map((col: any) => ({
          id: col.id,
          name: col.name,
          color: col.color || '#3b82f6'
        }));
        setStatusColumns(columns);
        console.log('✅ TaskDetailModal: Loaded board columns:', columns);
      }
    } catch (error) {
      console.error('❌ TaskDetailModal: Error loading board columns:', error);
      // Keep default columns if load fails
    } finally {
      setLoadingStatus(false);
    }
  };

  // Update status columns when props change
  useEffect(() => {
    if (propStatusColumns && propStatusColumns.length > 0) {
      setStatusColumns(propStatusColumns);
    }
  }, [propStatusColumns]);

  useEffect(() => {
    if (show) {
      setFormData(task);
      // Load saved time
      const savedTime = localStorage.getItem(`task-${task.id}-time`);
      if (savedTime) {
        setTrackedSeconds(parseInt(savedTime));
      }
      // Load status columns if modal is shown and no props provided
      if (!propStatusColumns || propStatusColumns.length === 0) {
        loadStatusColumns();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, show, propStatusColumns]);

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

  // Get current status with color
  const getCurrentStatus = (): StatusColumn => {
    if (formData.statusColumn) {
      const matched = statusColumns.find(col => col.id === formData.statusColumn?.id);
      if (matched) {
        return matched;
      }
      // Try matching by name if ID doesn't match
      const matchedByName = statusColumns.find(
        col => col.name.toUpperCase() === formData.statusColumn?.name?.toUpperCase()
      );
      if (matchedByName) {
        return matchedByName;
      }
    }
    return statusColumns[0] || { id: 1, name: 'TO DO', color: '#840417ff' };
  };

  // Handle status change - only update local state
  // User must click Save button to persist changes
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStatus = statusColumns.find(s => s.id === parseInt(e.target.value));
    if (!selectedStatus) return;

    setFormData(prev => ({
      ...prev,
      statusColumn: { 
        id: selectedStatus.id, 
        name: selectedStatus.name, 
        color: selectedStatus.color 
      }
    }));
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
                  value={getCurrentStatus().id}
                  onChange={handleStatusChange}
                  disabled={loadingStatus}
                  style={{ 
                    borderLeft: `4px solid ${getCurrentStatus().color || '#3b82f6'}`,
                  }}
                >
                  {statusColumns.map(status => (
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
