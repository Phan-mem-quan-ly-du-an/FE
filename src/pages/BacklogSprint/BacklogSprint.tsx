import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Dropdown, Accordion } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus, Play, Check, MoreVertical, Calendar, Clock, User, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-toastify';
import CreateSprintModal from './CreateSprintModal';
import EditSprintModal from './EditSprintModal';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';
import { sprintAPI, taskAPI } from '../../apiCaller/backlogSprint';
import { getProjectMembers, ProjectMember } from '../../apiCaller/projectMembers';
import { getBoardByProjectId } from '../../apiCaller/boards'; // Import để load board columns
import '../../assets/scss/pages/BacklogSprint.scss';

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
}

interface StatusColumn {
  id: number;
  name: string;
  color: string;
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
  const [showEditSprint, setShowEditSprint] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [editSprintFocusDates, setEditSprintFocusDates] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createTaskSprintId, setCreateTaskSprintId] = useState<number | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([
    { userId: 'unassigned', displayName: 'Unassigned', email: '' }
  ]);
  const [openDropdown, setOpenDropdown] = useState<{ taskId: number; type: 'status' | 'assignee' } | null>(null);
  const [expandedSprints, setExpandedSprints] = useState<{ [sprintId: number]: boolean }>({});

  // Status columns loaded from API (dynamic)
  const [statusColumns, setStatusColumns] = useState<StatusColumn[]>([]);

  useEffect(() => {
    loadData();
    loadProjectMembers();
    loadStatusColumns(); // Load dynamic status columns
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
      console.log('✅ Project members loaded with email:', members);
      
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

  const loadStatusColumns = async () => {
    try {
      console.log('🔄 Loading status columns for project:', projectId);
      const boardData = await getBoardByProjectId(projectId);
      console.log('✅ Board data loaded:', boardData);
      
      // Extract columns from board
      const columns: StatusColumn[] = boardData.columns.map(col => ({
        id: col.id,
        name: col.name,
        color: col.color
      }));
      
      setStatusColumns(columns);
      console.log('✅ Status columns loaded:', columns);
    } catch (error) {
      console.error('❌ Error loading status columns:', error);
      // Fallback: Use default 3 columns if board doesn't exist yet
      console.log('⚠️ Using fallback default status columns');
      setStatusColumns([
        { id: 1, name: 'To Do', color: '#6B7280' },
        { id: 2, name: 'In Progress', color: '#3B82F6' },
        { id: 3, name: 'Done', color: '#10B981' }
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
        console.log('🔍 Sample task assigneeId:', (tasksList[0] as any).assigneeId);
        console.log('🔍 Sample task assignedTo:', tasksList[0].assignedTo);
      }

      tasksList.forEach((task: Task) => {
        // Normalize backend shape: some responses use `assigneeId` (backend) while UI expects `assignedTo`
        // Keep existing assignedTo if present, otherwise fall back to assigneeId.
        const anyTask: any = task as any;
        const normalized: Task = {
          ...task,
          assignedTo: task.assignedTo ?? anyTask.assigneeId ?? undefined
        };
        
        console.log(`🔄 Task #${task.id}: assigneeId=${anyTask.assigneeId}, assignedTo=${task.assignedTo}, normalized=${normalized.assignedTo}`);

        // Enrich task with color from statusColumns
        const enrichedTask = enrichTaskWithColor(normalized);

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
      // Send complete task object with updated statusColumn
      const updatedTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        sprintId: task.sprintId,
        assignedTo: task.assignedTo,
        priority: task.priority,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours,
        tags: task.tags,
        orderIndex: task.orderIndex,
        statusColumn: { 
          id: statusId, 
          name: statusName 
        }
      };
      
      console.log('Updating task with statusColumn:', updatedTask);
      await taskAPI.update(projectId, task.id, updatedTask);
      toast.success(`Status updated to ${statusName}`, { autoClose: 2000 });
    } catch (error: any) {
      console.error('Error updating status:', error);
      console.error('Error details:', error.response?.data);
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
      // Send complete task object with updated assigneeId (đúng tên field của backend)
      const updatedTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        sprintId: task.sprintId,
        assigneeId: userId === 'unassigned' ? null : userId, // ĐỔI assignedTo -> assigneeId
        priority: task.priority,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours,
        tags: task.tags,
        orderIndex: task.orderIndex,
        statusColumn: task.statusColumn
      };
      
      await taskAPI.update(projectId, task.id, updatedTask);
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

    // Store original state for rollback on error
    const originalBacklogTasks = [...backlogTasks];
    const originalSprintTasks = { ...sprintTasks };

    try {
      // Find the task
      let task: Task | undefined;
      if (sourceSprintId === null) {
        task = backlogTasks.find(t => t.id === taskId);
      } else {
        task = sprintTasks[sourceSprintId]?.find(t => t.id === taskId);
      }

      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }

      // Update local state OPTIMISTICALLY (before API call completes)
      if (sourceSprintId === null) {
        // Moving from backlog
        const newBacklog = Array.from(backlogTasks);
        const [removed] = newBacklog.splice(source.index, 1);
        
        if (destSprintId !== null) {
          // Moving to sprint
          const newSprintTasks = Array.from(sprintTasks[destSprintId] || []);
          newSprintTasks.splice(destination.index, 0, { ...removed, sprintId: destSprintId });
          
          // Update both states
          setBacklogTasks(newBacklog);
          setSprintTasks({ ...sprintTasks, [destSprintId]: newSprintTasks });
        } else {
          // Moving within backlog (reorder)
          newBacklog.splice(destination.index, 0, removed);
          setBacklogTasks(newBacklog);
        }
      } else {
        // Moving from sprint
        const sourceList = Array.from(sprintTasks[sourceSprintId] || []);
        const [removed] = sourceList.splice(source.index, 1);
        
        if (destSprintId === null) {
          // Moving to backlog
          const newBacklog = Array.from(backlogTasks);
          newBacklog.splice(destination.index, 0, { ...removed, sprintId: null });
          
          // Update both states
          setBacklogTasks(newBacklog);
          setSprintTasks({ ...sprintTasks, [sourceSprintId]: sourceList });
        } else if (sourceSprintId === destSprintId) {
          // Reordering within same sprint
          sourceList.splice(destination.index, 0, removed);
          setSprintTasks({ ...sprintTasks, [sourceSprintId]: sourceList });
        } else {
          // Moving between sprints
          const destList = Array.from(sprintTasks[destSprintId] || []);
          destList.splice(destination.index, 0, { ...removed, sprintId: destSprintId });
          
          // Update both sprint states
          setSprintTasks({ 
            ...sprintTasks, 
            [sourceSprintId]: sourceList,
            [destSprintId]: destList 
          });
        }
      }

      // Now update backend - Send only necessary fields to avoid conflicts
      await taskAPI.update(projectId, taskId, {
        sprintId: destSprintId,
        orderIndex: destination.index
      });

      toast.success('Task moved successfully', { autoClose: 1500 });
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task. Rolling back...');
      
      // Rollback to original state
      setBacklogTasks(originalBacklogTasks);
      setSprintTasks(originalSprintTasks);
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

      // Validation 0: Check if sprint has dates - MUST HAVE DATES TO START
      if (!sprint.startDate || !sprint.endDate) {
        toast.warning(
          'Please set start and end dates for this sprint',
          { autoClose: 3000 }
        );
        // Open edit modal with focus on dates
        setEditingSprint(sprint);
        setEditSprintFocusDates(true);
        setShowEditSprint(true);
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
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) {
      toast.error('Sprint not found');
      return;
    }

    // Warning for active sprints
    if (sprint.status === 'active') {
      if (!window.confirm(
        '⚠️ Warning: This is an ACTIVE sprint!\n\n' +
        'Deleting an active sprint will move all tasks back to the backlog.\n\n' +
        'Are you sure you want to delete this sprint?'
      )) {
        return;
      }
    } else {
      if (!window.confirm(
        'Are you sure you want to delete this sprint?\n\n' +
        'All tasks will be moved back to the backlog.'
      )) {
        return;
      }
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
      ? { 
          id: task.statusColumn.id,
          name: task.statusColumn.name, 
          color: task.statusColumn.color || (statusColumns.length > 0 ? statusColumns[0].color : '#6B7280')
        }
      : (statusColumns.length > 0 ? statusColumns[0] : { id: 0, name: 'No Status', color: '#6B7280' });
    
    const currentAssignee = projectMembers.find(m => m.userId === task.assignedTo) || projectMembers[0];
    console.log(`🎯 Render Task #${task.id}: assignedTo=${task.assignedTo}, found member=`, currentAssignee);
    console.log(`🎯 All projectMembers:`, projectMembers);

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
            
            <div className="task-content-row">
              <div className="task-main-content">
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
              </div>

              {/* Action buttons on the right */}
              <div className="task-actions-right" onClick={(e) => e.stopPropagation()}>
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
                      fontSize: '10px',
                      padding: '2px 6px'
                    }}
                  >
                    <CheckCircle size={10} className="me-1" />
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
                  className="d-inline-block" 
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
                      fontSize: '10px',
                      padding: '2px 6px'
                    }}
                  >
                    <User size={10} className="me-1" />
                    {currentAssignee?.displayName || 'Unassigned'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {projectMembers.length === 1 ? (
                      <Dropdown.Item disabled className="text-muted">
                        <small>Loading members...</small>
                      </Dropdown.Item>
                    ) : (
                      projectMembers.map(member => (
                        <Dropdown.Item
                          key={member.userId}
                          onClick={(e) => handleAssigneeChange(task, member.userId, member.displayName, e)}
                          active={currentAssignee?.userId === member.userId}
                        >
                          <User size={12} className="me-2" />
                          {member.email || member.displayName}
                        </Dropdown.Item>
                      ))
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>

            <div className="task-footer">
              {task.estimatedHours && (
                <span className="task-meta">
                  <Clock size={12} /> {task.estimatedHours}h
                </span>
              )}
              {task.dueDate && (
                <span className="task-meta">
                  <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
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
        <Col xs="auto">
          <Button variant="primary" onClick={() => setShowCreateSprint(true)}>
            <Plus size={16} className="me-1" /> Create Sprint
          </Button>
        </Col>
      </Row>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Backlog Section */}
        <Accordion defaultActiveKey="backlog" alwaysOpen className="mb-3">
          <Accordion.Item eventKey="backlog" className="sprint-accordion-item">
            <Accordion.Header className="sprint-accordion-header">
              <div className="d-flex align-items-center justify-content-between w-100 pe-3">
                <div className="d-flex align-items-center gap-3">
                  <h5 className="mb-0">📦 Backlog</h5>
                  <Badge bg="secondary" className="task-count-badge">
                    {backlogTasks.length} {backlogTasks.length === 1 ? 'task' : 'tasks'}
                  </Badge>
                </div>
                <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateTaskSprintId(null);
                      setShowCreateTask(true);
                    }}
                    title="Add a new task to backlog"
                  >
                    <Plus size={14} /> Add Task
                  </Button>
                </div>
              </div>
            </Accordion.Header>
            <Accordion.Body className="sprint-accordion-body">
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
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        {/* Sprints Section */}
        <Accordion defaultActiveKey="0" alwaysOpen>
          {sprints
            .filter(sprint => !sprint.isBacklog && sprint.status !== 'completed')
            .sort((a, b) => {
              // Active sprints always come first
              if (a.status === 'active' && b.status !== 'active') return -1;
              if (a.status !== 'active' && b.status === 'active') return 1;
              
              // Sort by start date if both have dates
              if (a.startDate && b.startDate) {
                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
              }
              
              // Sprints with dates come before sprints without dates
              if (a.startDate && !b.startDate) return -1;
              if (!a.startDate && b.startDate) return 1;
              
              // If both have no dates, maintain original order
              return 0;
            })
            .map((sprint, index) => {
              const tasks = sprintTasks[sprint.id] || [];
              const isExpanded = expandedSprints[sprint.id] !== false; // Default expanded
              
              return (
                <Accordion.Item eventKey={index.toString()} key={sprint.id} className="mb-3 sprint-accordion-item">
                  <Accordion.Header className="sprint-accordion-header">
                    <div className="d-flex align-items-center justify-content-between w-100 pe-3">
                      <div className="d-flex align-items-center gap-3">
                        <h5 className="mb-0">🏃 {sprint.name}</h5>
                        <Badge bg={getStatusColor(sprint.status)} className="sprint-badge">
                          {sprint.status.toUpperCase()}
                        </Badge>
                        {sprint.startDate && sprint.endDate && (
                          <span className="text-muted small">
                            {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                          </span>
                        )}
                        {!sprint.startDate && !sprint.endDate && (
                          <span className="text-muted small fst-italic">
                            📅 No dates set
                          </span>
                        )}
                        <Badge bg="secondary" className="task-count-badge">
                          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                        </Badge>
                      </div>
                      <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {sprint.status === 'planned' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartSprint(sprint.id);
                            }}
                            disabled={sprints.some(s => s.status === 'active' && s.id !== sprint.id)}
                            title={
                              sprints.some(s => s.status === 'active' && s.id !== sprint.id)
                                ? "Complete the active sprint first"
                                : "Start this sprint"
                            }
                          >
                            <Play size={14} /> Start
                          </Button>
                        )}
                        {sprint.status === 'active' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteSprint(sprint.id);
                            }}
                            title="Complete this sprint"
                          >
                            <Check size={14} /> Complete
                          </Button>
                        )}
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreateTaskSprintId(sprint.id);
                            setShowCreateTask(true);
                          }}
                          title="Add a new task"
                        >
                          <Plus size={14} />
                        </Button>
                        <Dropdown align="end" onClick={(e) => e.stopPropagation()}>
                          <Dropdown.Toggle variant="outline-secondary" size="sm">
                            <MoreVertical size={14} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item 
                              onClick={() => {
                                setEditingSprint(sprint);
                                setEditSprintFocusDates(false);
                                setShowEditSprint(true);
                              }}
                            >
                              <i className="ri-edit-line me-2"></i>
                              Edit Sprint
                            </Dropdown.Item>
                            <Dropdown.Item 
                              onClick={() => handleDeleteSprint(sprint.id)}
                              className="text-danger"
                            >
                              <i className="ri-delete-bin-line me-2"></i>
                              Delete Sprint
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="sprint-accordion-body">
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
                  </Accordion.Body>
                </Accordion.Item>
              );
            })}
        </Accordion>
      </DragDropContext>

      {/* Modals */}
      <CreateSprintModal
        show={showCreateSprint}
        onHide={() => setShowCreateSprint(false)}
        projectId={projectId}
        onSuccess={loadData}
      />
      <EditSprintModal
        show={showEditSprint}
        onHide={() => {
          setShowEditSprint(false);
          setEditingSprint(null);
          setEditSprintFocusDates(false);
        }}
        projectId={projectId}
        sprint={editingSprint}
        focusOnDates={editSprintFocusDates}
        autoStartAfterSave={editSprintFocusDates} // Auto start if we're setting dates to start
        onSuccess={async () => {
          // Just reload data, don't try to start again
          await loadData();
        }}
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
