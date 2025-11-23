import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    CardBody,
    Row,
    Col,
    Button,
    Input,
    Table,
    Badge,
    Spinner,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    InputGroup,
    InputGroupText,
    UncontrolledDropdown
} from 'reactstrap';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User } from 'lucide-react';
import { taskAPI } from '../../apiCaller/backlogSprint';
import { getProjectMembers, ProjectMember } from '../../apiCaller/projectMembers';
import CreateTaskModal from '../BacklogSprint/CreateTaskModal';
import TaskDetailModal from '../BacklogSprint/TaskDetailModal';
import './TaskList.scss';

interface Task {
    id: number;
    title: string;
    description?: string;
    projectId: string;
    sprintId?: number | null;
    assignedTo?: string;
    assigneeId?: string | null; // Allow null for unassigned tasks
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

const TaskListView = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterAssignee, setFilterAssignee] = useState<string>('all');
    const [sortField, setSortField] = useState<string>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
    const [openAssigneeDropdown, setOpenAssigneeDropdown] = useState<number | null>(null);

    // Load tasks
    const loadTasks = async () => {
        if (!projectId) return;
        
        try {
            setLoading(true);
            const response = await taskAPI.listByProject(projectId, false);
            const rawTaskList = response.content || [];
            
            // Normalize tasks: Backend returns assigneeId, ensure type compatibility
            const taskList: Task[] = rawTaskList.map((task: any) => ({
                ...task,
                assigneeId: task.assigneeId ?? task.assignedTo ?? null,
                assignedTo: task.assignedTo ?? task.assigneeId ?? undefined
            }));
            
            setTasks(taskList);
            setFilteredTasks(taskList);
        } catch (error) {
            console.error('Error loading tasks:', error);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    // Load project members
    const loadProjectMembers = async () => {
        if (!projectId) return;
        
        try {
            const members = await getProjectMembers(projectId);
            setProjectMembers(members);
        } catch (error) {
            console.error('Error loading project members:', error);
        }
    };

    useEffect(() => {
        loadTasks();
        loadProjectMembers();
    }, [projectId]);

    // Filter and search
    useEffect(() => {
        let result = [...tasks];

        // Search
        if (searchTerm) {
            result = result.filter(task =>
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by priority
        if (filterPriority !== 'all') {
            result = result.filter(task => {
                const taskPriority = task.priority?.toUpperCase();
                const selectedPriority = filterPriority.toUpperCase();
                return taskPriority === selectedPriority;
            });
        }

        // Filter by status
        if (filterStatus !== 'all') {
            result = result.filter(task => task.statusColumn?.name === filterStatus);
        }

        // Filter by assignee
        if (filterAssignee !== 'all') {
            if (filterAssignee === 'unassigned') {
                result = result.filter(task => !task.assigneeId);
            } else {
                result = result.filter(task => task.assigneeId === filterAssignee);
            }
        }

        // Sort
        result.sort((a, b) => {
            let aVal: any = a[sortField as keyof Task];
            let bVal: any = b[sortField as keyof Task];

            if (sortField === 'statusColumn') {
                aVal = a.statusColumn?.name || '';
                bVal = b.statusColumn?.name || '';
            }

            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc' 
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return sortDirection === 'asc' 
                ? (aVal > bVal ? 1 : -1)
                : (bVal > aVal ? 1 : -1);
        });

        setFilteredTasks(result);
    }, [tasks, searchTerm, filterPriority, filterStatus, filterAssignee, sortField, sortDirection]);

    // Priority badge color (same as Board)
    const getPriorityColor = (priority: string) => {
        switch (priority?.toUpperCase()) {
            case 'HIGH': return 'warning';
            case 'MEDIUM': return 'info';
            case 'LOW': return 'secondary';
            default: return 'secondary';
        }
    };

    // Status badge color
    const getStatusColor = (status?: string) => {
        if (!status) return 'secondary';
        const lower = status.toLowerCase();
        if (lower.includes('done') || lower.includes('completed')) return 'success';
        if (lower.includes('progress') || lower.includes('doing')) return 'primary';
        if (lower.includes('review')) return 'warning';
        return 'secondary';
    };

    // Handle assign member
    const handleAssignMember = async (taskId: number, memberId: string) => {
        if (!projectId) return;

        try {
            await taskAPI.update(projectId, taskId, { assigneeId: memberId });
            
            // Update state immediately without reloading
            setTasks(prevTasks => 
                prevTasks.map(task => 
                    task.id === taskId 
                        ? { ...task, assigneeId: memberId }
                        : task
                )
            );
            
            toast.success('Assigned successfully', { autoClose: 1500 });
        } catch (error) {
            console.error('Error assigning task:', error);
            toast.error('Failed to assign task');
        }
    };

    // Handle sort
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Get sort icon
    const getSortIcon = (field: string) => {
        if (sortField !== field) return <i className="ri-expand-up-down-line ms-1 text-muted"></i>;
        return sortDirection === 'asc' 
            ? <i className="ri-arrow-up-line ms-1"></i>
            : <i className="ri-arrow-down-line ms-1"></i>;
    };

    // Get member info
    const getMemberInfo = (assigneeId?: string | null) => {
        if (!assigneeId) return null;
        return projectMembers.find(m => m.userId === assigneeId);
    };

    // Format date
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB');
    };

    // Deduplicate project members
    const uniqueProjectMembers = useMemo(() => {
        const seen = new Set<string>();
        return projectMembers.filter(member => {
            if (seen.has(member.userId)) {
                return false;
            }
            seen.add(member.userId);
            return true;
        });
    }, [projectMembers]);

    // Statistics
    const stats = useMemo(() => {
        const total = tasks.length;
        const highPriority = tasks.filter(t => t.priority?.toUpperCase() === 'HIGH').length;
        const assigned = tasks.filter(t => t.assigneeId).length;
        const unassigned = total - assigned;
        
        console.log('📊 Stats:', { total, highPriority, assigned, unassigned });
        console.log('📊 Tasks with priority:', tasks.map(t => ({ id: t.id, priority: t.priority })));
        
        return { total, highPriority, assigned, unassigned };
    }, [tasks]);

    return (
        <React.Fragment>
            <Row>
                <Col lg={12}>
                    {/* Statistics Cards */}
                    <Row className="mb-3">
                        <Col xl={3} md={6}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Total Tasks</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <div className="avatar-sm">
                                                <div className="avatar-title bg-primary-subtle text-primary rounded fs-3">
                                                    <i className="ri-task-line"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <h4 className="fs-22 fw-semibold mb-0">{stats.total}</h4>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={3} md={6}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">High Priority</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <div className="avatar-sm">
                                                <div className="avatar-title bg-danger-subtle text-danger rounded fs-3">
                                                    <i className="ri-alert-line"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <h4 className="fs-22 fw-semibold mb-0">{stats.highPriority}</h4>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={3} md={6}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Assigned</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <div className="avatar-sm">
                                                <div className="avatar-title bg-success-subtle text-success rounded fs-3">
                                                    <i className="ri-user-line"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <h4 className="fs-22 fw-semibold mb-0">{stats.assigned}</h4>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={3} md={6}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Unassigned</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <div className="avatar-sm">
                                                <div className="avatar-title bg-warning-subtle text-warning rounded fs-3">
                                                    <i className="ri-user-unfollow-line"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <h4 className="fs-22 fw-semibold mb-0">{stats.unassigned}</h4>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Main Card */}
                    <Card>
                        <CardBody>
                            {/* Header with Search and Actions */}
                            <Row className="align-items-center mb-3">
                                <Col md={4}>
                                    <InputGroup>
                                        <InputGroupText>
                                            <i className="ri-search-line"></i>
                                        </InputGroupText>
                                        <Input
                                            type="text"
                                            placeholder="Search tasks..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </InputGroup>
                                </Col>
                                <Col md={8} className="text-end">
                                    <div className="d-flex align-items-center justify-content-end gap-2">
                                        {/* Unified Filter Button */}
                                        <Dropdown isOpen={isFilterOpen} toggle={() => setIsFilterOpen(!isFilterOpen)}>
                                            <DropdownToggle caret color="light" size="sm">
                                                <i className="ri-filter-line me-1"></i>
                                                Filter
                                                {(filterAssignee !== "all" || filterPriority !== "all") && (
                                                    <Badge color="primary" className="ms-1" pill>
                                                        {(filterAssignee !== "all" ? 1 : 0) + (filterPriority !== "all" ? 1 : 0)}
                                                    </Badge>
                                                )}
                                            </DropdownToggle>
                                            <DropdownMenu end style={{ minWidth: '280px' }}>
                                                <div className="px-3 py-2">
                                                    <h6 className="mb-2">
                                                        <i className="ri-user-line me-1"></i>
                                                        Assignee
                                                    </h6>
                                                    <div className="d-flex flex-wrap gap-1 mb-3">
                                                        <Button
                                                            color={filterAssignee === "all" ? "primary" : "light"}
                                                            size="sm"
                                                            onClick={() => setFilterAssignee("all")}
                                                        >
                                                            All
                                                        </Button>
                                                        <Button
                                                            color={filterAssignee === "unassigned" ? "primary" : "light"}
                                                            size="sm"
                                                            onClick={() => setFilterAssignee("unassigned")}
                                                        >
                                                            Unassigned
                                                        </Button>
                                                    </div>
                                                    <div className="d-flex flex-column gap-1 mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                        {uniqueProjectMembers.map((member) => (
                                                            <Button
                                                                key={member.userId}
                                                                color={filterAssignee === member.userId ? "primary" : "light"}
                                                                size="sm"
                                                                onClick={() => setFilterAssignee(member.userId)}
                                                                className="text-start"
                                                            >
                                                                {member.email || member.displayName}
                                                            </Button>
                                                        ))}
                                                    </div>

                                                    <DropdownItem divider />

                                                    <h6 className="mb-2 mt-2">
                                                        <i className="ri-price-tag-3-line me-1"></i>
                                                        Priority
                                                    </h6>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        <Button
                                                            color={filterPriority === "all" ? "primary" : "light"}
                                                            size="sm"
                                                            onClick={() => setFilterPriority("all")}
                                                        >
                                                            All
                                                        </Button>
                                                        <Button
                                                            color={filterPriority === "HIGH" ? "warning" : "light"}
                                                            size="sm"
                                                            onClick={() => setFilterPriority("HIGH")}
                                                        >
                                                            HIGH
                                                        </Button>
                                                        <Button
                                                            color={filterPriority === "MEDIUM" ? "info" : "light"}
                                                            size="sm"
                                                            onClick={() => setFilterPriority("MEDIUM")}
                                                        >
                                                            MEDIUM
                                                        </Button>
                                                        <Button
                                                            color={filterPriority === "LOW" ? "secondary" : "light"}
                                                            size="sm"
                                                            onClick={() => setFilterPriority("LOW")}
                                                        >
                                                            LOW
                                                        </Button>
                                                    </div>

                                                    {(filterAssignee !== "all" || filterPriority !== "all") && (
                                                        <>
                                                            <DropdownItem divider />
                                                            <Button
                                                                color="danger"
                                                                size="sm"
                                                                outline
                                                                className="w-100"
                                                                onClick={() => {
                                                                    setFilterAssignee("all");
                                                                    setFilterPriority("all");
                                                                }}
                                                            >
                                                                <i className="ri-close-line me-1"></i>
                                                                Clear All Filters
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </DropdownMenu>
                                        </Dropdown>

                                        {/* Create Task Button */}
                                        <Button 
                                            color="primary" 
                                            size="sm"
                                            onClick={() => setShowCreateModal(true)}
                                        >
                                            <i className="ri-add-line me-1"></i>
                                            Create Task
                                        </Button>
                                    </div>
                                </Col>
                            </Row>

                            {/* Results Count */}
                            <div className="mb-2">
                                <span className="text-muted">
                                    Showing {filteredTasks.length} of {tasks.length} tasks
                                </span>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner color="primary" />
                                    <div className="mt-2 text-muted">Loading tasks...</div>
                                </div>
                            ) : filteredTasks.length === 0 ? (
                                <div className="text-center py-5">
                                    <div className="avatar-md mx-auto mb-3">
                                        <div className="avatar-title bg-light text-muted rounded-circle fs-1">
                                            <i className="ri-inbox-line"></i>
                                        </div>
                                    </div>
                                    <h5 className="text-muted">No tasks found</h5>
                                    <p className="text-muted">
                                        {searchTerm || filterPriority !== 'all' || filterAssignee !== 'all'
                                            ? 'Try adjusting your filters'
                                            : 'Create your first task to get started'}
                                    </p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="align-middle table-nowrap mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="cursor-pointer" onClick={() => handleSort('title')}>
                                                    Task {getSortIcon('title')}
                                                </th>
                                                <th className="cursor-pointer" onClick={() => handleSort('priority')}>
                                                    Priority {getSortIcon('priority')}
                                                </th>
                                                <th className="cursor-pointer" onClick={() => handleSort('statusColumn')}>
                                                    Status {getSortIcon('statusColumn')}
                                                </th>
                                                <th>Assignee</th>
                                                <th className="cursor-pointer" onClick={() => handleSort('dueDate')}>
                                                    Due Date {getSortIcon('dueDate')}
                                                </th>
                                                <th className="cursor-pointer" onClick={() => handleSort('estimatedHours')}>
                                                    Est. Hours {getSortIcon('estimatedHours')}
                                                </th>
                                                <th className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                                                    Created {getSortIcon('createdAt')}
                                                </th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTasks.map(task => {
                                                const member = getMemberInfo(task.assigneeId);
                                                return (
                                                    <tr key={task.id}>
                                                        <td>
                                                            <div 
                                                                className="cursor-pointer"
                                                                onClick={() => {
                                                                    setSelectedTask(task);
                                                                    setShowDetailModal(true);
                                                                }}
                                                            >
                                                                <h6 className="mb-1 fw-semibold text-primary">
                                                                    {task.title}
                                                                </h6>
                                                                {task.description && (
                                                                    <p className="text-muted mb-0 text-truncate" style={{ maxWidth: '300px' }}>
                                                                        {task.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <Badge color={getPriorityColor(task.priority)} className="fs-11">
                                                                {task.priority}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Badge color={getStatusColor(task.statusColumn?.name)} className="fs-11">
                                                                {task.statusColumn?.name || 'No Status'}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Dropdown
                                                                isOpen={openAssigneeDropdown === task.id}
                                                                toggle={() => setOpenAssigneeDropdown(openAssigneeDropdown === task.id ? null : task.id)}
                                                            >
                                                                <DropdownToggle
                                                                    tag="div"
                                                                    style={{
                                                                        cursor: "pointer",
                                                                        width: "32px",
                                                                        height: "32px",
                                                                        borderRadius: "50%",
                                                                        backgroundColor: member ? "#3b82f6" : "#6B7280",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        color: "#fff",
                                                                        fontSize: "12px",
                                                                        fontWeight: "bold",
                                                                    }}
                                                                    title={member?.displayName || "Unassigned"}
                                                                >
                                                                    {member ? (
                                                                        member.displayName.charAt(0).toUpperCase()
                                                                    ) : (
                                                                        <User size={16} />
                                                                    )}
                                                                </DropdownToggle>
                                                                <DropdownMenu 
                                                                    end
                                                                    popperConfig={{ 
                                                                        strategy: "fixed",
                                                                        modifiers: [
                                                                            {
                                                                                name: 'preventOverflow',
                                                                                options: {
                                                                                    boundary: 'viewport'
                                                                                }
                                                                            }
                                                                        ]
                                                                    }}
                                                                    style={{ zIndex: 9999 }}
                                                                    container="body"
                                                                >
                                                                    <DropdownItem
                                                                        onClick={() => handleAssignMember(task.id, '')}
                                                                    >
                                                                        <User size={14} className="me-2" />
                                                                        Unassigned
                                                                    </DropdownItem>
                                                                    <DropdownItem divider />
                                                                    {uniqueProjectMembers.map(m => (
                                                                        <DropdownItem
                                                                            key={m.userId}
                                                                            onClick={() => handleAssignMember(task.id, m.userId)}
                                                                            active={m.userId === task.assigneeId}
                                                                        >
                                                                            <User size={14} className="me-2" />
                                                                            {m.displayName}
                                                                        </DropdownItem>
                                                                    ))}
                                                                </DropdownMenu>
                                                            </Dropdown>
                                                        </td>
                                                        <td>
                                                            {task.dueDate ? (
                                                                <span className={
                                                                    new Date(task.dueDate) < new Date() 
                                                                        ? 'text-danger fw-medium'
                                                                        : ''
                                                                }>
                                                                    {formatDate(task.dueDate)}
                                                                    {new Date(task.dueDate) < new Date() && (
                                                                        <i className="ri-error-warning-line ms-1"></i>
                                                                    )}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                        <td>
                                                            {task.estimatedHours ? (
                                                                <span>
                                                                    <i className="ri-time-line me-1 text-muted"></i>
                                                                    {task.estimatedHours}h
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="text-muted">
                                                            {formatDate(task.createdAt)}
                                                        </td>
                                                        <td>
                                                            <Button
                                                                color="primary"
                                                                size="sm"
                                                                outline
                                                                onClick={() => {
                                                                    console.log('Opening task detail:', task);
                                                                    setSelectedTask(task);
                                                                    setShowDetailModal(true);
                                                                }}
                                                            >
                                                                <i className="ri-eye-line"></i>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Create Task Modal */}
            {showCreateModal && (
                <CreateTaskModal
                    show={showCreateModal}
                    onHide={() => setShowCreateModal(false)}
                    projectId={projectId!}
                    sprintId={null}
                    onSuccess={() => {
                        loadTasks();
                        setShowCreateModal(false);
                    }}
                />
            )}

            {/* Task Detail Modal */}
            {showDetailModal && selectedTask && (
                <TaskDetailModal
                    show={showDetailModal}
                    onHide={() => {
                        console.log('Closing task detail modal');
                        setShowDetailModal(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                    projectId={projectId!}
                    onUpdate={() => {
                        console.log('Task updated, reloading...');
                        loadTasks();
                    }}
                />
            )}
        </React.Fragment>
    );
};

export default TaskListView;
