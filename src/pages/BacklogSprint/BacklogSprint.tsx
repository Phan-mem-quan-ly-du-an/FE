import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Dropdown } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus, Play, Check, MoreVertical, Calendar, Clock, User, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import CreateSprintModal from './CreateSprintModal';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';
import { sprintAPI, taskAPI } from '../../apiCaller/backlogSprint';
import { getProjectMembers } from '../../apiCaller/projectMembers';
import './BacklogSprint.scss';

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
    color?: string;
  };
}

interface StatusColumn {
  id: number;
  name: string;
  color: string;
}

interface ProjectMember {
  userId: string;
  displayName: string;
  email: string;
}

interface Sprint {
  id: number;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled' | 'paused';
  description?: string;
  isBacklog: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BacklogSprintProps {
  projectId: string;
}

const BacklogSprint: React.FC<BacklogSprintProps> = ({ projectId }) => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [sprintTasks, setSprintTasks] = useState<{ [sprintId: number]: Task[] }>({});
  const [loading, setLoading] = useState(true);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createTaskSprintId, setCreateTaskSprintId] = useState<number | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([
    { userId: 'unassigned', displayName: 'Unassigned', email: '' }
  ]);
  const [openDropdown, setOpenDropdown] = useState<{ taskId: number; type: 'status' | 'assignee' } | null>(null);

  // Status columns from database (correct IDs)
  const statusColumns: StatusColumn[] = [
    { id: 1, name: 'TO DO', color: '#6b7280' },
    { id: 1, name: 'IN PROGRESS', color: '#3b82f6' },  // Same ID as TO DO in DB
    { id: 2, name: 'DONE', color: '#10b981' }
  ];

  useEffect(() => {
    loadData();
    loadProjectMembers();
  }, [projectId]);

  // Helper function to enrich task statusColumn with color
  const enrichTaskWithColor = (task: Task): Task => {
    if (task.statusColumn) {
      // Find matching status column by name (case insensitive)
      const matched = statusColumns.find(
        col => col.name.toUpperCase() === task.statusColumn?.name?.toUpperCase()
      );
      if (matched) {
        return {
          ...task,
          statusColumn: {
            ...task.statusColumn,
            color: matched.color
          }
        };
      }
    }
    return task;
  };

  const loadProjectMembers = async () => {
    try {
      console.log('🔄 Loading project members for project:', projectId);
      const members = await getProjectMembers(projectId);
      console.log('✅ Project members loaded:', members);
      setProjectMembers([
        { userId: 'unassigned', displayName: 'Unassigned', email: '' },
        ...members
      ]);
    } catch (error) {
      console.error('❌ Error loading project members:', error);
      // Fallback: Use mock data if API is not ready
      console.log('⚠️ Using fallback mock data for project members');
      setProjectMembers([
        { userId: 'unassigned', displayName: 'Unassigned', email: '' },
        { userId: 'user-1', displayName: 'John Doe', email: 'john@example.com' },
        { userId: 'user-2', displayName: 'Jane Smith', email: 'jane@example.com' },
        { userId: 'user-3', displayName: 'Bob Johnson', email: 'bob@example.com' }
      ]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Load sprints
      const sprintsData = await sprintAPI.listByProject(projectId);
      setSprints(sprintsData);

      // Load all tasks
      const tasksData = await taskAPI.listByProject(projectId);
      console.log('📋 Tasks data loaded:', tasksData);
      
      // Separate backlog tasks and sprint tasks
      const backlog: Task[] = [];
      const sprintTasksMap: { [sprintId: number]: Task[] } = {};

      // Check if tasksData has content array or is array itself
      const tasksList = Array.isArray(tasksData) ? tasksData : (tasksData.content || []);
      console.log('📋 Tasks list:', tasksList);
      
      // Debug: Check first task's statusColumn
      if (tasksList.length > 0) {
        console.log('🔍 Sample task statusColumn:', tasksList[0].statusColumn);
      }

      tasksList.forEach((task: Task) => {
        // Enrich task with color from statusColumns
        const enrichedTask = enrichTaskWithColor(task);
        
        if (!enrichedTask.sprintId) {
          backlog.push(enrichedTask);
        } else {
          if (!sprintTasksMap[enrichedTask.sprintId]) {
            sprintTasksMap[enrichedTask.sprintId] = [];
          }
          sprintTasksMap[enrichedTask.sprintId].push(enrichedTask);
        }
      });

      console.log('📋 Backlog tasks:', backlog);
      console.log('📋 Sprint tasks:', sprintTasksMap);

      setBacklogTasks(backlog.sort((a, b) => a.orderIndex - b.orderIndex));
      setSprintTasks(sprintTasksMap);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast.error('Failed to load backlog and sprints');
    } finally {
      setLoading(false);
    }
  };

  // Update task locally without reloading entire page
  const updateTaskLocally = (taskId: number, updates: Partial<Task>) => {
    // Update in backlog
    setBacklogTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));

    // Update in sprints
    setSprintTasks(prev => {
      const newSprintTasks = { ...prev };
      Object.keys(newSprintTasks).forEach(sprintId => {
        newSprintTasks[Number(sprintId)] = newSprintTasks[Number(sprintId)].map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        );
      });
      return newSprintTasks;
    });
  };

  // Handle status change without reload
  const handleStatusChange = async (task: Task, statusId: number, statusName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    const previousStatus = task.statusColumn;
    
    // Close dropdown immediately
    setOpenDropdown(null);
    
    // Optimistic update
    updateTaskLocally(task.id, {
      statusColumn: { id: statusId, name: statusName }
    });

    try {
      // Send only columnId to backend
      await taskAPI.update(projectId, task.id, {
        ...task,
        columnId: statusId  // Send columnId instead of statusColumn object
      });
      toast.success(`Status updated to ${statusName}`, { autoClose: 2000 });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
      // Revert on error
      updateTaskLocally(task.id, { statusColumn: previousStatus });
    }
  };

  // Handle assignee change without reload
  const handleAssigneeChange = async (task: Task, userId: string, displayName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    const previousAssignee = task.assignedTo;
    
    // Close dropdown immediately
    setOpenDropdown(null);
    
    // Optimistic update
    updateTaskLocally(task.id, {
      assignedTo: userId === 'unassigned' ? undefined : userId
    });

    try {
      await taskAPI.update(projectId, task.id, {
        ...task,
        assignedTo: userId === 'unassigned' ? undefined : userId
      });
      toast.success(`Assigned to ${displayName}`, { autoClose: 2000 });
    } catch (error: any) {
      console.error('Error updating assignee:', error);
      toast.error('Failed to update assignee');
      // Revert on error
      updateTaskLocally(task.id, { assignedTo: previousAssignee });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const taskId = parseInt(draggableId);
    const sourceSprintId = source.droppableId === 'backlog' ? null : parseInt(source.droppableId);
    const destSprintId = destination.droppableId === 'backlog' ? null : parseInt(destination.droppableId);

    try {
      // Find the task
      let task: Task | undefined;
      if (sourceSprintId === null) {
        task = backlogTasks.find(t => t.id === taskId);
      } else {
        task = sprintTasks[sourceSprintId]?.find(t => t.id === taskId);
      }

      if (!task) return;

      // Update task's sprintId
      await taskAPI.update(projectId, taskId, {
        ...task,
        sprintId: destSprintId,
        orderIndex: destination.index
      });

      // Update local state
      if (sourceSprintId === null) {
        // Moving from backlog
        const newBacklog = Array.from(backlogTasks);
        const [removed] = newBacklog.splice(source.index, 1);
        setBacklogTasks(newBacklog);

        if (destSprintId !== null) {
          const newSprintTasks = Array.from(sprintTasks[destSprintId] || []);
          newSprintTasks.splice(destination.index, 0, { ...removed, sprintId: destSprintId });
          setSprintTasks({ ...sprintTasks, [destSprintId]: newSprintTasks });
        }
      } else {
        // Moving from sprint
        const sourceList = Array.from(sprintTasks[sourceSprintId] || []);
        const [removed] = sourceList.splice(source.index, 1);
        
        if (destSprintId === null) {
          // Moving to backlog
          setSprintTasks({ ...sprintTasks, [sourceSprintId]: sourceList });
          const newBacklog = Array.from(backlogTasks);
          newBacklog.splice(destination.index, 0, { ...removed, sprintId: null });
          setBacklogTasks(newBacklog);
        } else if (sourceSprintId === destSprintId) {
          // Reordering within same sprint
          sourceList.splice(destination.index, 0, removed);
          setSprintTasks({ ...sprintTasks, [sourceSprintId]: sourceList });
        } else {
          // Moving between sprints
          setSprintTasks({ ...sprintTasks, [sourceSprintId]: sourceList });
          const destList = Array.from(sprintTasks[destSprintId] || []);
          destList.splice(destination.index, 0, { ...removed, sprintId: destSprintId });
          setSprintTasks({ ...sprintTasks, [destSprintId]: destList });
        }
      }

      toast.success('Task moved successfully');
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
      loadData(); // Reload on error
    }
  };

  const handleStartSprint = async (sprintId: number) => {
    try {
      // Find the sprint to validate
      const sprint = sprints.find(s => s.id === sprintId);
      if (!sprint) {
        toast.error('Sprint not found');
        return;
      }

      // Validation 1: Check if there's already an active sprint
      const hasActiveSprint = sprints.some(s => s.status === 'active' && s.id !== sprintId);
      if (hasActiveSprint) {
        toast.error('You already have an active sprint. Please complete it before starting a new one.');
        return;
      }

      // Validation 2: Check if sprint has tasks
      const tasks = sprintTasks[sprintId] || [];
      if (tasks.length === 0) {
        const proceed = window.confirm(
          'This sprint has no tasks. Do you want to start it anyway?'
        );
        if (!proceed) return;
      }

      // Validation 3: Check if start date is valid
      const startDate = new Date(sprint.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);

      if (startDate > today) {
        const proceed = window.confirm(
          `This sprint is scheduled to start on ${startDate.toLocaleDateString()}. ` +
          `Do you want to start it early?`
        );
        if (!proceed) return;
      }

      try {
        await sprintAPI.update(projectId, sprintId, { status: 'active' });
        
        // Update sprint status locally without reload
        setSprints(prevSprints => 
          prevSprints.map(s => 
            s.id === sprintId ? { ...s, status: 'active' } : s
          )
        );
        
        toast.success('Sprint started successfully', { autoClose: 2000 });
      } catch (error) {
        console.error('Error starting sprint:', error);
        toast.error('Failed to start sprint');
      }
    } catch (error) {
      console.error('Unexpected error in handleStartSprint:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleCompleteSprint = async (sprintId: number) => {
    // Find the sprint to validate
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) {
      toast.error('Sprint not found');
      return;
    }

    // Validation 1: Only active sprints can be completed
    if (sprint.status !== 'active') {
      toast.error('Only active sprints can be completed. Please start the sprint first.');
      return;
    }

    // Validation 2: Check if there are incomplete tasks
    const tasks = sprintTasks[sprintId] || [];
    const incompleteTasks = tasks.filter(task => {
      const statusName = task.statusColumn?.name?.toUpperCase() || '';
      return statusName !== 'DONE' && statusName !== 'COMPLETED';
    });
    
    if (incompleteTasks.length > 0) {
      const proceed = window.confirm(
        `This sprint has ${incompleteTasks.length} incomplete task(s). ` +
        `These tasks will be moved back to the backlog. ` +
        `Do you want to complete this sprint?`
      );
      if (!proceed) return;
    }

    try {
      await sprintAPI.update(projectId, sprintId, { status: 'completed' });
      
      // Update sprint status locally without reload
      setSprints(prevSprints => 
        prevSprints.map(s => 
          s.id === sprintId ? { ...s, status: 'completed' } : s
        )
      );
      
      toast.success('Sprint completed successfully', { autoClose: 2000 });
    } catch (error) {
      console.error('Error completing sprint:', error);
      toast.error('Failed to complete sprint');
    }
  };

  const handleDeleteSprint = async (sprintId: number) => {
    if (!window.confirm('Are you sure you want to delete this sprint? Tasks will be moved to backlog.')) {
      return;
    }
    try {
      await sprintAPI.delete(projectId, sprintId);
      toast.success('Sprint deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting sprint:', error);
      toast.error('Failed to delete sprint');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'secondary';
      case 'planned': return 'primary';
      case 'paused': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const renderTask = (task: Task, index: number) => {
    // Task already enriched with color, just use it with fallback
    const currentStatus: StatusColumn = task.statusColumn 
      ? { ...task.statusColumn, color: task.statusColumn.color || statusColumns[0].color }
      : statusColumns[0];
    
    const currentAssignee = projectMembers.find(m => m.userId === task.assignedTo) || projectMembers[0];

    return (
      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          >
            <div className="task-header">
              <span className="task-id">#{task.id}</span>
              <Badge bg={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            </div>
            
            <div 
              className="task-title"
              onClick={() => {
                setSelectedTask(task);
                setShowTaskDetail(true);
              }}
            >
              {task.title}
            </div>
            
            {task.description && (
              <div className="task-description">{task.description.substring(0, 80)}...</div>
            )}
            
            {/* Action buttons */}
            <div className="task-actions" onClick={(e) => e.stopPropagation()}>
              {/* Status Dropdown */}
              <Dropdown 
                className="d-inline-block" 
                drop="down"
                show={openDropdown?.taskId === task.id && openDropdown?.type === 'status'}
                onToggle={(isOpen) => {
                  if (isOpen) {
                    setOpenDropdown({ taskId: task.id, type: 'status' });
                  } else {
                    setOpenDropdown(null);
                  }
                }}
              >
                <Dropdown.Toggle 
                  variant="light" 
                  size="sm"
                  id={`status-dropdown-${task.id}`}
                  className="task-action-btn"
                  style={{ 
                    borderColor: currentStatus.color,
                    color: currentStatus.color,
                    fontSize: '11px',
                    padding: '2px 8px'
                  }}
                >
                  <CheckCircle size={12} className="me-1" />
                  {currentStatus.name}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {statusColumns.map((status, index) => (
                    <Dropdown.Item
                      key={`${status.name}-${index}`}
                      onClick={(e) => handleStatusChange(task, status.id, status.name, e)}
                      active={currentStatus.name === status.name}
                    >
                      <span
                        className="d-inline-block me-2"
                        style={{
                          width: '10px',
                          height: '10px',
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
              <Dropdown 
                className="d-inline-block ms-2" 
                drop="down"
                show={openDropdown?.taskId === task.id && openDropdown?.type === 'assignee'}
                onToggle={(isOpen) => {
                  if (isOpen) {
                    setOpenDropdown({ taskId: task.id, type: 'assignee' });
                  } else {
                    setOpenDropdown(null);
                  }
                }}
              >
                <Dropdown.Toggle 
                  variant="light" 
                  size="sm"
                  id={`assignee-dropdown-${task.id}`}
                  className="task-action-btn"
                  style={{ 
                    fontSize: '11px',
                    padding: '2px 8px'
                  }}
                >
                  <User size={12} className="me-1" />
                  {currentAssignee.displayName}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {projectMembers.map(member => (
                    <Dropdown.Item
                      key={member.userId}
                      onClick={(e) => handleAssigneeChange(task, member.userId, member.displayName, e)}
                      active={currentAssignee.userId === member.userId}
                    >
                      <User size={12} className="me-2" />
                      {member.displayName}
                      {member.email && (
                        <small className="text-muted ms-2">({member.email})</small>
                      )}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>

            <div className="task-footer">
              {task.estimatedHours && (
                <span className="task-meta">
                  <Clock size={14} /> {task.estimatedHours}h
                </span>
              )}
              {task.dueDate && (
                <span className="task-meta">
                  <Calendar size={14} /> {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  if (loading) {
    return (
      <Container fluid className="backlog-sprint-page">
        <div className="text-center py-5">Loading...</div>
      </Container>
    );
  }

  return (
    <Container fluid className="backlog-sprint-page">
      <Row className="mb-3 align-items-center page-header">
        <Col>
          <h2>📋 Backlog & Sprints</h2>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => setShowCreateSprint(true)}>
            <Plus size={16} className="me-1" /> Create Sprint
          </Button>
        </Col>
      </Row>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Backlog Section */}
        <Card className="backlog-section">
          <Card.Header>
            <h5>📦 Backlog</h5>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                setCreateTaskSprintId(null);
                setShowCreateTask(true);
              }}
            >
              <Plus size={14} className="me-1" /> Add Issue
            </Button>
          </Card.Header>
          <Card.Body>
            <Droppable droppableId="backlog">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`tasks-list ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                >
                  {backlogTasks.length === 0 ? (
                    <div className="empty-state">No tasks in backlog</div>
                  ) : (
                    backlogTasks.map((task, index) => renderTask(task, index))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </Card.Body>
        </Card>

        {/* Sprints Section */}
        {sprints
          .filter(sprint => !sprint.isBacklog)
          .sort((a, b) => {
            // Active sprints first, then by start date
            if (a.status === 'active' && b.status !== 'active') return -1;
            if (a.status !== 'active' && b.status === 'active') return 1;
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          })
          .map(sprint => {
            const tasks = sprintTasks[sprint.id] || [];
            return (
              <Card key={sprint.id} className="mb-4 sprint-section">
                <Card.Header className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <h5 className="mb-0">🏃 {sprint.name}</h5>
                    <Badge bg={getStatusColor(sprint.status)}>
                      {sprint.status.toUpperCase()}
                    </Badge>
                    <small className="text-muted">
                      {new Date(sprint.startDate).toLocaleDateString()} -{' '}
                      {new Date(sprint.endDate).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="d-flex gap-2">
                    {(() => {
                      console.log(`🔍 Sprint ${sprint.id} status:`, sprint.status, '(is planned?', sprint.status === 'planned', ')');
                      return null;
                    })()}
                    {sprint.status === 'planned' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={async (e) => {
                          console.log('🔴 BUTTON CLICKED - Sprint ID:', sprint.id);
                          console.log('� Event:', e);
                          console.log('🔴 handleStartSprint type:', typeof handleStartSprint);
                          
                          e.preventDefault();
                          e.stopPropagation();
                          
                          console.log('🔴 About to call handleStartSprint...');
                          
                          try {
                            await handleStartSprint(sprint.id);
                            console.log('🔴 handleStartSprint completed');
                          } catch (err) {
                            console.error('🔴 Error calling handleStartSprint:', err);
                          }
                        }}
                        title="Start this sprint"
                      >
                        <Play size={16} /> Start Sprint
                      </Button>
                    )}
                    {sprint.status === 'active' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCompleteSprint(sprint.id)}
                        title="Complete this sprint and move incomplete tasks to backlog"
                      >
                        <Check size={16} /> Complete Sprint
                      </Button>
                    )}
                    {sprint.status === 'completed' && (
                      <Badge bg="secondary" className="px-3 py-2">
                        ✓ Completed
                      </Badge>
                    )}
                    {sprint.status !== 'completed' && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setCreateTaskSprintId(sprint.id);
                          setShowCreateTask(true);
                        }}
                        title="Add a new task to this sprint"
                      >
                        <Plus size={16} /> Add Task
                      </Button>
                    )}
                    <Dropdown align="end">
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        <MoreVertical size={16} />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleDeleteSprint(sprint.id)}>
                          Delete Sprint
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Droppable droppableId={sprint.id.toString()}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`tasks-list ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                      >
                        {tasks.length === 0 ? (
                          <div className="empty-state">
                            No tasks in this sprint. Drag tasks here to start planning.
                          </div>
                        ) : (
                          tasks.map((task, index) => renderTask(task, index))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </Card.Body>
              </Card>
            );
          })}
      </DragDropContext>

      {/* Modals */}
      <CreateSprintModal
        show={showCreateSprint}
        onHide={() => setShowCreateSprint(false)}
        projectId={projectId}
        onSuccess={loadData}
      />
      <CreateTaskModal
        show={showCreateTask}
        onHide={() => {
          setShowCreateTask(false);
          setCreateTaskSprintId(null);
        }}
        projectId={projectId}
        sprintId={createTaskSprintId}
        onSuccess={loadData}
      />
      {selectedTask && (
        <TaskDetailModal
          show={showTaskDetail}
          onHide={() => {
            setShowTaskDetail(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          projectId={projectId}
          onUpdate={loadData}
        />
      )}
    </Container>
  );
};

export default BacklogSprint;
