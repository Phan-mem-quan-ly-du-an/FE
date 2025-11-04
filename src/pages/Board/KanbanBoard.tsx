import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Modal,
  Form,
  Spinner,
  Alert,
} from 'reactstrap';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Check, Eye, Edit } from 'lucide-react';
import {
  getBoardByProjectId,
  createBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  moveTask,
  createTask,
  BoardResponse,
  BoardColumnResponse,
  TaskResponse,
} from '../../apiCaller/boards';
import { sprintAPI } from '../../apiCaller/backlogSprint';
import SprintDetailModal from './SprintDetailModal';
import EditSprintModal from '../BacklogSprint/EditSprintModal';
import './KanbanBoard.scss';

/**
 * Trang Kanban Board - Giao diện chuẩn Jira
 * Features:
 * - Hiển thị board với columns động
 * - Kéo thả tasks giữa các columns
 * - Tạo/sửa/xóa columns
 * - Hiển thị tasks với priority, assignee, due date
 */

const KanbanBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // ============= STATE =============
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isCompletingSprint, setIsCompletingSprint] = useState(false);

  // Modal states
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#6B7280');

  // Sprint modals
  const [showSprintDetailModal, setShowSprintDetailModal] = useState(false);
  const [showEditSprintModal, setShowEditSprintModal] = useState(false);
  const [currentSprint, setCurrentSprint] = useState<any>(null);

  // Task creation modal states
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    estimatedHours: '',
    dueDate: '',
    tags: ''
  });
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // ============= LOAD BOARD =============
  const loadBoard = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError('');
      const data = await getBoardByProjectId(projectId);
      console.log('📊 Board loaded:', data);
      console.log('📊 Active Sprint:', data.activeSprintId, data.activeSprintName);
      console.log('📊 Total tasks:', data.columns.reduce((sum, col) => sum + col.tasks.length, 0));
      data.columns.forEach(col => {
        console.log(`   Column "${col.name}": ${col.tasks.length} tasks`, col.tasks.map(t => t.id));
      });
      setBoard(data);
    } catch (err: any) {
      // Nếu chưa có board, tự động tạo board mặc định
      if (err?.response?.status === 404) {
        try {
          console.log('Board not found, creating default board with 3 default columns...');
          
          const newBoard = await createBoard({
            projectId: projectId,
            name: 'Default Board',
            isDefault: true,
          });
          
          console.log('Board created successfully with default columns:', newBoard);
          
          // Backend đã tự động tạo 3 columns mặc định (To Do, In Progress, Done)
          // Frontend chỉ cần load lại board
          const data = await getBoardByProjectId(projectId);
          setBoard(data);
        } catch (createErr: any) {
          const errorMsg = createErr?.response?.data?.message || createErr?.message || 'Không thể tạo board mặc định';
          setError(errorMsg);
          console.error('Create default board error:', createErr);
          console.error('Error response:', createErr?.response?.data);
        }
      } else {
        setError(err?.response?.data?.message || 'Không thể load board');
        console.error('Load board error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoard();
  }, [projectId]);

  // ============= HANDLE DRAG & DROP =============
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Không có destination hoặc không di chuyển
    if (!destination || (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )) {
      return;
    }

    console.log('🎯 Drag end:', { source, destination, draggableId });

    // Parse IDs - Remove prefix if exists
    const taskId = parseInt(draggableId.replace('task-', ''));
    const sourceColumnId = parseInt(source.droppableId);
    const destColumnId = parseInt(destination.droppableId);

    console.log('📦 Parsed IDs:', { taskId, sourceColumnId, destColumnId });

    try {
      // Gọi API để move task
      console.log('📤 Calling moveTask API...');
      await moveTask(projectId!, taskId, destColumnId, destination.index);
      
      console.log(`✅ API Success - Moved task ${taskId} from column ${sourceColumnId} to ${destColumnId}`);
      
      // Reload board để lấy dữ liệu mới
      console.log('🔄 Reloading board...');
      await loadBoard();
      console.log('✅ Board reloaded');
    } catch (err: any) {
      console.error('❌ Error moving task:', err);
      console.error('❌ Error details:', err?.response?.data);
      alert(err?.response?.data?.message || 'Không thể di chuyển task');
      // Reload board để revert về trạng thái cũ
      await loadBoard();
    }
  };

  // ============= HANDLE ADD COLUMN =============
  const handleAddColumn = async () => {
    if (!board || !newColumnName.trim()) return;

    try {
      await createColumn(board.id, {
        boardId: board.id,
        name: newColumnName,
        color: newColumnColor,
      });

      setShowAddColumnModal(false);
      setNewColumnName('');
      setNewColumnColor('#6B7280');
      loadBoard(); // Reload board
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể tạo column');
    }
  };

  // ============= HANDLE DELETE COLUMN =============
  const handleDeleteColumn = async (columnId: number, columnName: string) => {
    if (!window.confirm(`Xóa column "${columnName}"?\nCác tasks trong column sẽ chuyển về Unassigned.`)) {
      return;
    }

    try {
      await deleteColumn(columnId);
      loadBoard(); // Reload board
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể xóa column');
    }
  };

  // ============= HANDLE ADD TASK =============
  const handleOpenAddTask = (columnId: number) => {
    setSelectedColumnId(columnId);
    setNewTaskForm({
      title: '',
      description: '',
      priority: 'MEDIUM',
      estimatedHours: '',
      dueDate: '',
      tags: ''
    });
    setShowAddTaskModal(true);
  };

  const handleAddTask = async () => {
    if (!projectId || !selectedColumnId || !newTaskForm.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      setIsCreatingTask(true);
      await createTask(projectId, {
        title: newTaskForm.title,
        description: newTaskForm.description,
        statusColumnId: selectedColumnId,
        priority: newTaskForm.priority,
        estimatedHours: newTaskForm.estimatedHours ? parseInt(newTaskForm.estimatedHours) : undefined,
        dueDate: newTaskForm.dueDate || undefined,
        tags: newTaskForm.tags || undefined,
      });

      toast.success('Task created successfully');
      setShowAddTaskModal(false);
      setNewTaskForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        estimatedHours: '',
        dueDate: '',
        tags: ''
      });
      setSelectedColumnId(null);
      loadBoard(); // Reload board
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // ============= HANDLE COMPLETE SPRINT =============
  const handleCompleteSprint = async () => {
    if (!board?.activeSprintId) return;

    try {
      setIsCompletingSprint(true);

      // Get all tasks from board
      const allTasks = board.columns.flatMap(col => col.tasks);
      
      // Check incomplete tasks (not in DONE/COMPLETED column)
      const incompleteTasks = allTasks.filter(task => {
        const statusName = task.statusColumn?.name?.toUpperCase() || '';
        return statusName !== 'DONE' && statusName !== 'COMPLETED';
      });

      if (incompleteTasks.length > 0) {
        const proceed = window.confirm(
          `This sprint has ${incompleteTasks.length} incomplete task(s). ` +
          `These tasks will be moved back to the backlog. ` +
          `Do you want to complete this sprint?`
        );
        if (!proceed) {
          setIsCompletingSprint(false);
          return;
        }
      }

      // Complete sprint
      await sprintAPI.update(projectId!, board.activeSprintId, { status: 'completed' });
      
      toast.success('Sprint completed successfully!', { autoClose: 2000 });
      
      // Reload board (will show warning if no new active sprint)
      setTimeout(() => {
        loadBoard();
      }, 1000);
    } catch (error: any) {
      console.error('Error completing sprint:', error);
      toast.error(error?.response?.data?.message || 'Failed to complete sprint');
    } finally {
      setIsCompletingSprint(false);
    }
  };

  // ============= HANDLE SPRINT DETAIL =============
  const handleGoToSprintDetail = async () => {
    if (!board?.activeSprintId) return;
    
    try {
      // Fetch sprint details from API
      const sprints = await sprintAPI.listByProject(projectId!);
      const sprint = sprints.find(s => s.id === board.activeSprintId);
      
      if (sprint) {
        setCurrentSprint(sprint);
        setShowSprintDetailModal(true);
      } else {
        toast.error('Sprint not found');
      }
    } catch (error) {
      console.error('Error loading sprint:', error);
      toast.error('Failed to load sprint details');
    }
  };

  // ============= HANDLE EDIT SPRINT =============
  const handleEditSprint = async () => {
    if (!board?.activeSprintId) return;
    
    try {
      // Fetch sprint details from API
      const sprints = await sprintAPI.listByProject(projectId!);
      const sprint = sprints.find(s => s.id === board.activeSprintId);
      
      if (sprint) {
        setCurrentSprint(sprint);
        setShowEditSprintModal(true);
      } else {
        toast.error('Sprint not found');
      }
    } catch (error) {
      console.error('Error loading sprint:', error);
      toast.error('Failed to load sprint details');
    }
  };

  // ============= HANDLE EDIT SPRINT SUCCESS =============
  const handleEditSprintSuccess = () => {
    setShowEditSprintModal(false);
    setCurrentSprint(null);
    loadBoard(); // Reload board to get updated sprint info
  };

  // ============= RENDER =============
  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner color="primary" />
        <p className="mt-2">Đang tải board...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert color="danger">{error}</Alert>
        <Button color="primary" onClick={loadBoard}>
          Thử lại
        </Button>
      </Container>
    );
  }

  if (!board) {
    return (
      <Container className="mt-5">
        <Alert color="warning">Không tìm thấy board</Alert>
      </Container>
    );
  }

  // Warning nếu không có active sprint
  if (!board.activeSprintId) {
    return (
      <div className="page-content" style={{ paddingTop: '1rem' }}>
        <Container fluid>
          <Alert color="warning" className="mb-3">
            <h5 className="alert-heading">
              <i className="ri-information-line me-2"></i>
              No Active Sprint
            </h5>
            <p className="mb-0">
              Board chỉ hiển thị tasks của sprint đang active. 
              Vui lòng vào <strong>Sprint</strong> tab và set một sprint thành <strong>"Active"</strong> để xem tasks trong Board.
            </p>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ paddingTop: '1rem' }}>
      <Container fluid>
        {/* HEADER - Compact */}
        <Row className="mb-2">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">{board.name}</h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">{board.description || 'Kanban Board'}</span>
                  {board.activeSprintId ? (
                    <Badge color="success" className="ms-2">
                      <i className="ri-play-circle-line me-1"></i>
                      {board.activeSprintName}
                    </Badge>
                  ) : (
                    <Badge color="secondary" className="ms-2">
                      <i className="ri-information-line me-1"></i>
                      No active sprint
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* ACTION BUTTONS */}
              <div className="d-flex gap-2">
                {board.activeSprintId && (
                  <>
                    {/* Sprint Detail Button */}
                    <Button
                      color="info"
                      size="sm"
                      onClick={handleGoToSprintDetail}
                      className="d-flex align-items-center"
                    >
                      <Eye size={14} className="me-1" />
                      Sprint Detail
                    </Button>
                    
                    {/* Edit Sprint Button */}
                    <Button
                      color="warning"
                      size="sm"
                      onClick={handleEditSprint}
                      className="d-flex align-items-center"
                    >
                      <Edit size={14} className="me-1" />
                      Edit Sprint
                    </Button>
                    
                    {/* Complete Sprint Button */}
                    <Button
                      color="success"
                      size="sm"
                      onClick={handleCompleteSprint}
                      disabled={isCompletingSprint}
                      className="d-flex align-items-center"
                    >
                      {isCompletingSprint ? (
                        <>
                          <Spinner size="sm" className="me-1" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <Check size={14} className="me-1" />
                          Complete Sprint
                        </>
                      )}
                    </Button>
                  </>
                )}
                
                {/* Add Column Button */}
                <Button
                  color="primary"
                  size="sm"
                  onClick={() => setShowAddColumnModal(true)}
                >
                  <i className="ri-add-line me-1"></i>
                  Thêm Column
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* KANBAN BOARD - Horizontal Scroll */}
        <DragDropContext 
          onDragEnd={handleDragEnd}
          key={board.columns.map(c => c.id).join('-')}
        >
          <div 
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              paddingBottom: '16px',
              // Custom scrollbar
              scrollbarWidth: 'thin',
              scrollbarColor: '#888 #f1f1f1',
            }}
            className="kanban-board-container"
          >
            {board.columns.map((column) => (
              <div 
                key={`column-${column.id}`}
                style={{
                  minWidth: '320px',
                  maxWidth: '320px',
                  flexShrink: 0
                }}
              >
                <Card className="h-100">
                  {/* COLUMN HEADER */}
                  <div
                    className="card-header d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: column.color, color: '#fff' }}
                  >
                    <div>
                      <h5 className="mb-0" style={{ color: '#fff' }}>
                        {column.name}
                      </h5>
                      <small style={{ color: '#f0f0f0' }}>
                        {column.tasks.length} tasks
                      </small>
                    </div>
                    <Button
                      color="link"
                      size="sm"
                      className="text-white p-0"
                      onClick={() => handleDeleteColumn(column.id, column.name)}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </Button>
                  </div>

                  {/* DROPPABLE AREA */}
                  <Droppable droppableId={column.id.toString()}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="card-body"
                        style={{
                          minHeight: '500px',
                          maxHeight: '70vh',
                          overflowY: 'auto',
                          backgroundColor: snapshot.isDraggingOver ? '#f8f9fa' : '#fff',
                        }}
                      >
                        {/* TASKS */}
                        {column.tasks.length === 0 ? (
                          <p className="text-muted text-center mt-4">
                            Chưa có task nào
                          </p>
                        ) : (
                          column.tasks.map((task, index) => (
                            <Draggable
                              key={`task-${task.id}`}
                              draggableId={`task-${task.id}`}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    marginBottom: '12px',
                                  }}
                                >
                                  <TaskCard task={task} isDragging={snapshot.isDragging} />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                        
                        {/* ADD TASK BUTTON */}
                        <Button
                          color="light"
                          size="sm"
                          className="w-100 mt-2"
                          onClick={() => handleOpenAddTask(column.id)}
                        >
                          <i className="ri-add-line me-1"></i>
                          Thêm Task
                        </Button>
                      </div>
                    )}
                  </Droppable>
                </Card>
              </div>
            ))}
          </div>
        </DragDropContext>

        {/* MODAL ADD COLUMN */}
        <Modal isOpen={showAddColumnModal} toggle={() => setShowAddColumnModal(false)}>
          <div className="modal-header">
            <h5 className="modal-title">Thêm Column Mới</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowAddColumnModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <Form>
              <div className="mb-3">
                <label className="form-label">Tên Column</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="VD: Code Review, Testing..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Màu sắc</label>
                <input
                  type="color"
                  className="form-control form-control-color w-100"
                  value={newColumnColor}
                  onChange={(e) => setNewColumnColor(e.target.value)}
                />
              </div>
            </Form>
          </div>
          <div className="modal-footer">
            <Button color="light" onClick={() => setShowAddColumnModal(false)}>
              Hủy
            </Button>
            <Button color="primary" onClick={handleAddColumn}>
              Tạo Column
            </Button>
          </div>
        </Modal>

        {/* Modal for creating task */}
        <Modal isOpen={showAddTaskModal} toggle={() => setShowAddTaskModal(false)} size="lg">
          <div className="modal-header">
            <h5 className="modal-title">Create New Task</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowAddTaskModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <Form>
              <div className="mb-3">
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  placeholder="e.g., Implement user authentication"
                  autoFocus
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  placeholder="Describe the task in detail..."
                ></textarea>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={newTaskForm.priority}
                      onChange={(e) => setNewTaskForm({ 
                        ...newTaskForm, 
                        priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
                      })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Estimated Hours</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      placeholder="e.g., 8"
                      value={newTaskForm.estimatedHours}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, estimatedHours: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={newTaskForm.dueDate}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Tags</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="frontend, api, bug-fix (comma separated)"
                  value={newTaskForm.tags}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, tags: e.target.value })}
                />
                <small className="text-muted">Separate multiple tags with commas</small>
              </div>
            </Form>
          </div>
          <div className="modal-footer">
            <Button color="secondary" onClick={() => setShowAddTaskModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onClick={handleAddTask} disabled={!newTaskForm.title.trim() || isCreatingTask}>
              {isCreatingTask ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </Modal>

        {/* Sprint Detail & Edit Modals */}
        <Modals
          showSprintDetailModal={showSprintDetailModal}
          setShowSprintDetailModal={setShowSprintDetailModal}
          showEditSprintModal={showEditSprintModal}
          setShowEditSprintModal={setShowEditSprintModal}
          currentSprint={currentSprint}
          projectId={projectId!}
          totalTasks={board.columns.reduce((sum, col) => sum + col.tasks.length, 0)}
          completedTasks={board.columns
            .filter(col => col.name.toUpperCase() === 'DONE' || col.name.toUpperCase() === 'COMPLETED')
            .reduce((sum, col) => sum + col.tasks.length, 0)
          }
          handleEditSprintSuccess={handleEditSprintSuccess}
        />
      </Container>
    </div>
  );
};

// ============= TASK CARD COMPONENT =============
interface TaskCardProps {
  task: TaskResponse;
  isDragging: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging }) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Card
      className={`mb-0 shadow-sm ${isDragging ? 'shadow-lg' : ''}`}
      style={{
        border: isDragging ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        cursor: 'grab',
      }}
    >
      <div className="card-body p-3">
        {/* Task Title */}
        <h6 className="card-title mb-2">{task.title}</h6>

        {/* Task Description */}
        {task.description && (
          <p
            className="card-text text-muted small mb-2"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {task.description}
          </p>
        )}

        {/* Task Metadata */}
        <div className="d-flex justify-content-between align-items-center">
          <div>
            {task.priority && (
              <Badge color={getPriorityColor(task.priority)} className="me-1">
                {task.priority}
              </Badge>
            )}
            {task.estimatedHours && (
              <span className="text-muted small">
                <i className="ri-time-line me-1"></i>
                {task.estimatedHours}h
              </span>
            )}
          </div>

          {task.assigneeId && (
            <div
              className="avatar-xs"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {task.assigneeId.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className="mt-2 text-muted small">
            <i className="ri-calendar-line me-1"></i>
            {new Date(task.dueDate).toLocaleDateString('vi-VN')}
          </div>
        )}
      </div>
    </Card>
  );
};

// ============= MODALS =============
const Modals: React.FC<{
  showSprintDetailModal: boolean;
  setShowSprintDetailModal: (show: boolean) => void;
  showEditSprintModal: boolean;
  setShowEditSprintModal: (show: boolean) => void;
  currentSprint: any;
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  handleEditSprintSuccess: () => void;
}> = ({
  showSprintDetailModal,
  setShowSprintDetailModal,
  showEditSprintModal,
  setShowEditSprintModal,
  currentSprint,
  projectId,
  totalTasks,
  completedTasks,
  handleEditSprintSuccess
}) => (
  <>
    {/* Sprint Detail Modal */}
    <SprintDetailModal
      isOpen={showSprintDetailModal}
      toggle={() => setShowSprintDetailModal(false)}
      sprint={currentSprint}
      totalTasks={totalTasks}
      completedTasks={completedTasks}
    />

    {/* Edit Sprint Modal */}
    <EditSprintModal
      show={showEditSprintModal}
      onHide={() => setShowEditSprintModal(false)}
      projectId={projectId}
      sprint={currentSprint}
      onSuccess={handleEditSprintSuccess}
    />
  </>
);

export default KanbanBoard;
