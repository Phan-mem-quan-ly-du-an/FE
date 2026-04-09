import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Badge, Dropdown, Accordion, Form, ProgressBar, Card, Modal, Spinner } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Play, Check, MoreVertical, Calendar, Clock, User, CheckCircle, Archive, RotateCcw, ChevronDown, ChevronLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import CreateSprintModal from './CreateSprintModal';
import EditSprintModal from './EditSprintModal';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';
import { sprintAPI, taskAPI } from '../../apiCaller/backlogSprint';
import { getBoardByProjectId } from '../../apiCaller/boards';
import { getProjectMembers } from '../../apiCaller/projectMembers';
import ApiCaller from '../../apiCaller/caller/apiCaller';
import '../../assets/scss/pages/BacklogSprint.scss';

interface Task {
    id: number;
    title: string;
    description?: string;
    projectId: string;
    sprintId?: number | null;
    assignedTo?: string; // deprecated, use assigneeId
    assigneeId?: string | null; // current field used by backend
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
    estimatedHours?: number;
    tags?: string;
    orderIndex: number;
    archivedAt?: string | null;
    epicId?: number | null;
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

interface Epic {
    id: number;
    projectId: string;
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    totalTasks?: number;
    doneTasks?: number;
    progressPercent?: number;
    overdue?: boolean;
}

interface BacklogSprintProps {
    projectId: string;
}

const BacklogSprint: React.FC<BacklogSprintProps> = ({ projectId }) => {
    const { t } = useTranslation();
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
    const [sprintTasks, setSprintTasks] = useState<{ [sprintId: number]: Task[] }>({});
    const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
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
    const [openDropdown, setOpenDropdown] = useState<{ taskId: number; type: 'status' | 'assignee' | 'epic' } | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [statusColumns, setStatusColumns] = useState<StatusColumn[]>([
        { id: 1, name: 'TO DO', color: '#840417ff' },
        { id: 2, name: 'IN PROGRESS', color: '#3b82f6' },
        { id: 3, name: 'DONE', color: '#10b981' }
    ]);
    const [epics, setEpics] = useState<Epic[]>([]);
    const [expandedEpicIds, setExpandedEpicIds] = useState<number[]>([]);
    const [showCreateEpic, setShowCreateEpic] = useState(false);
    const [creatingEpic, setCreatingEpic] = useState(false);
    const [newEpicTitle, setNewEpicTitle] = useState('');
    const [newEpicDescription, setNewEpicDescription] = useState('');
    const [newEpicStartDate, setNewEpicStartDate] = useState<string>('');
    const [newEpicEndDate, setNewEpicEndDate] = useState<string>('');
    const [showEpicSidebar, setShowEpicSidebar] = useState<boolean>(() => {
        const persisted = localStorage.getItem('showEpicSidebar');
        return persisted ? persisted === 'true' : true;
    });
    const [selectedEpicId, setSelectedEpicId] = useState<number | null>(null);
    const [epicFilterId, setEpicFilterId] = useState<number | null>(null);
    const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
    const [epicLoading, setEpicLoading] = useState<boolean>(false);
    const [epicEditTitle, setEpicEditTitle] = useState<string>('');
    const [epicEditDescription, setEpicEditDescription] = useState<string>('');
    const [epicEditStartDate, setEpicEditStartDate] = useState<string>('');
    const [epicEditEndDate, setEpicEditEndDate] = useState<string>('');
    const [epicTasks, setEpicTasks] = useState<Task[]>([]);
    const [epicTasksLoading, setEpicTasksLoading] = useState<boolean>(false);
    const [showAssignTaskModal, setShowAssignTaskModal] = useState<boolean>(false);
    const [assignSelectedTaskId, setAssignSelectedTaskId] = useState<number | null>(null);
    const [assignMode, setAssignMode] = useState<'existing' | 'new'>('existing');
    const [newTaskTitle, setNewTaskTitle] = useState<string>('');
    const [newTaskDescription, setNewTaskDescription] = useState<string>('');
    const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [newTaskSprintId, setNewTaskSprintId] = useState<number | null>(null);
    const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string>('');
    const [newTaskEstimatedHours, setNewTaskEstimatedHours] = useState<string>('');
    const [newTaskTags, setNewTaskTags] = useState<string>('');
    const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');

    const loadBoardColumns = async () => {
        try {
            const boardData = await getBoardByProjectId(projectId);
            if (boardData && boardData.columns && boardData.columns.length > 0) {
                const columns = boardData.columns.map((col: any) => ({
                    id: col.id,
                    name: col.name,
                    color: col.color || '#3b82f6'
                }));
                setStatusColumns(columns);
                console.log('✅ Loaded board columns:', columns);
            }
        } catch (error) {
            console.error('❌ Error loading board columns:', error);
            // Keep default columns if load fails
        }
    };

    useEffect(() => {
        loadBoardColumns();
        loadData();
        loadProjectMembers();
    }, [projectId, showArchived, t]);

    const enrichTaskWithColor = (task: Task): Task => {
        if (task.statusColumn) {
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
            const members = await getProjectMembers(projectId);
            setProjectMembers([
                { userId: 'unassigned', displayName: t('Unassigned'), email: '' },
                ...members
            ]);
        } catch (error) {
            console.error('Error loading project members:', error);
            setProjectMembers([
                { userId: 'unassigned', displayName: t('Unassigned'), email: '' }
            ]);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Load sprints (không đổi)
            const sprintsData = await sprintAPI.listByProject(projectId);
            setSprints(sprintsData);

            // 2. Load tasks bình thường (exclude archived)
            const normalTasksResponse = await taskAPI.listByProject(projectId, false); // false = không lấy archived
            const normalTasksList = Array.isArray(normalTasksResponse)
                ? normalTasksResponse
                : (normalTasksResponse.content || []);

            // 3. Nếu showArchived = true → load thêm archived tasks
            let archived: Task[] = [];
            if (showArchived) {
                try {
                    const archivedResponse = await taskAPI.listArchived(projectId);
                    archived = Array.isArray(archivedResponse)
                        ? archivedResponse
                        : (archivedResponse.content || []);
                } catch (err) {
                    console.warn('Failed to load archived tasks:', err);
                    // Không lỗi toàn bộ nếu archived API lỗi
                }
            }

            // 4. Normalize tasks: Backend returns assigneeId, frontend uses assignedTo
            const normalizeTask = (task: any): Task => {
                return {
                    ...task,
                    // Normalize assigneeId to assignedTo for frontend consistency
                    assignedTo: task.assignedTo || task.assigneeId || undefined
                };
            };

            // 5. Phân loại tasks
            const backlog: Task[] = [];
            const sprintTasksMap: { [sprintId: number]: Task[] } = {};

            normalTasksList.forEach((task: any) => {
                // Normalize task first
                const normalizedTask = normalizeTask(task);
                const enrichedTask = enrichTaskWithColor(normalizedTask);

                if (!enrichedTask.sprintId) {
                    backlog.push(enrichedTask);
                } else {
                    if (!sprintTasksMap[enrichedTask.sprintId]) {
                        sprintTasksMap[enrichedTask.sprintId] = [];
                    }
                    sprintTasksMap[enrichedTask.sprintId].push(enrichedTask);
                }
            });

            // 6. Cập nhật state
            setBacklogTasks(backlog.sort((a, b) => a.orderIndex - b.orderIndex));
            setSprintTasks(sprintTasksMap);
            setArchivedTasks(archived.map((task: any) => {
                const normalized = normalizeTask(task);
                return enrichTaskWithColor(normalized);
            }).sort((a, b) => {
                const dateA = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
                const dateB = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
                return dateB - dateA;
            }));

            const activeSprint = Array.isArray(sprintsData) ? sprintsData.find(s => s.status === 'active') : undefined;
            await loadEpics(activeSprint?.id);

        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load backlog and sprints');
        } finally {
            setLoading(false);
        }
    };

    const loadEpics = async (sprintId?: number) => {
        try {
            const query = sprintId ? `?sprintId=${sprintId}` : '';
            const res: any = await new ApiCaller().setUrl(`/projects/${projectId}/epics${query}`).get();
            const raw: any = res.data?.data || res.data || {};
            const list: any[] = Array.isArray(raw)
                ? raw
                : (raw?.epics?.content || raw?.content || []);
            setEpics(list);
        } catch (e) {
            setEpics([]);
        }
    };

    const loadEpicDetail = async (epicId: number) => {
        try {
            setEpicLoading(true);
            const res: any = await new ApiCaller().setUrl(`/projects/${projectId}/epics/${epicId}`).get();
            const epic: Epic = (res.data?.data || res.data) as any;
            setSelectedEpic(epic);
            setEpicEditTitle(epic.title || '');
            setEpicEditDescription(epic.description || '');
            setEpicEditStartDate(epic.startDate || '');
            setEpicEditEndDate(epic.endDate || '');
            await loadEpicTasks(epicId);
        } catch (e) {
            toast.error('Failed to load epic detail');
            setSelectedEpic(null);
            setSelectedEpicId(null);
        } finally {
            setEpicLoading(false);
        }
    };

    const loadEpicTasks = async (epicId: number) => {
        try {
            setEpicTasksLoading(true);
            const res: any = await new ApiCaller().setUrl(`/projects/${projectId}/epics/${epicId}/tasks`).get();
            const data: any = res.data?.data || res.data || [];
            const list: Task[] = Array.isArray(data) ? data : (data.content || []);
            setEpicTasks(list);
        } catch (e) {
            setEpicTasks([]);
        } finally {
            setEpicTasksLoading(false);
        }
    };

    const toggleEpicFilter = (epicId: number) => {
        setEpicFilterId(prev => (prev === epicId ? null : epicId));
    };

    const openEpicDetail = (epicId: number) => {
        setSelectedEpicId(epicId);
        loadEpicDetail(epicId);
    };

    const toggleEpicExpand = (epicId: number) => {
        setExpandedEpicIds(prev => prev.includes(epicId) ? prev.filter(id => id !== epicId) : [...prev, epicId]);
    };

    const handleUpdateEpic = async () => {
        if (!selectedEpicId) return;
        if (!epicEditTitle.trim()) {
            toast.warn('Please enter epic title');
            return;
        }
        try {
            setEpicLoading(true);
            const payload: any = {
                title: epicEditTitle.trim(),
                description: epicEditDescription?.trim() || undefined,
                startDate: epicEditStartDate || undefined,
                endDate: epicEditEndDate || undefined
            };
            const res: any = await new ApiCaller().setUrl(`/projects/${projectId}/epics/${selectedEpicId}`).put({ data: payload });
            const updated: Epic = (res.data?.data || res.data) as any;
            setSelectedEpic(prev => ({ ...(prev || {} as Epic), ...updated }));
            setEpics(prev => prev.map(e => e.id === selectedEpicId ? { ...e, ...updated } : e));
            toast.success('Epic updated');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to update epic');
        } finally {
            setEpicLoading(false);
        }
    };

    const handleDeleteEpic = async () => {
        if (!selectedEpicId) return;
        const ok = window.confirm('Are you sure you want to delete this epic?');
        if (!ok) return;
        try {
            setEpicLoading(true);
            await new ApiCaller().setUrl(`/projects/${projectId}/epics/${selectedEpicId}`).delete();
            setEpics(prev => prev.filter(e => e.id !== selectedEpicId));
            setSelectedEpic(null);
            setSelectedEpicId(null);
            setEpicTasks([]);
            toast.success('Epic deleted');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to delete epic');
        } finally {
            setEpicLoading(false);
        }
    };

    const handleAssignSelectedTaskToEpic = async () => {
        if (!selectedEpicId || !assignSelectedTaskId) return;
        try {
            setEpicLoading(true);
            await new ApiCaller()
                .setUrl(`/projects/${projectId}/tasks/${assignSelectedTaskId}/epic`)
                .setQueryParams({ epicId: selectedEpicId })
                .patch({ data: {} });
            await loadEpicTasks(selectedEpicId);
            setShowAssignTaskModal(false);
            setAssignSelectedTaskId(null);
            setAssignMode('existing');
            toast.success('Task assigned to epic');

            const activeSprintId = sprints.find(s => s.status === 'active')?.id;
            const allSprintTasks = Object.values(sprintTasks).flat();
            const task = [...backlogTasks, ...allSprintTasks].find(t => t.id === assignSelectedTaskId);
            if (task && activeSprintId && task.sprintId === activeSprintId) {
                const isDone = (task.statusColumn?.name || '').toLowerCase().includes('done') || (task.statusColumn?.name || '').toLowerCase().includes('completed');
                setEpics(prev => prev.map(e => {
                    if (e.id !== selectedEpicId) return e;
                    const newTotal = (typeof e.totalTasks === 'number' ? e.totalTasks : 0) + 1;
                    const newDone = (typeof e.doneTasks === 'number' ? e.doneTasks : 0) + (isDone ? 1 : 0);
                    const newPercent = newTotal > 0 ? Math.round((newDone / newTotal) * 100) : 0;
                    return { ...e, totalTasks: newTotal, doneTasks: newDone, progressPercent: newPercent };
                }));
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to assign task');
        } finally {
            setEpicLoading(false);
        }
    };

    const handleCreateTaskInEpic = async () => {
        if (!selectedEpicId) return;
        if (!newTaskTitle.trim()) {
            toast.warn('Please enter task title');
            return;
        }
        if (newTaskSprintId && newTaskDueDate) {
            const sp = sprints.find(s => s.id === newTaskSprintId);
            if (sp && sp.startDate) {
                const sprintStart = new Date(sp.startDate);
                const due = new Date(newTaskDueDate);
                sprintStart.setHours(0,0,0,0);
                due.setHours(0,0,0,0);
                if (due < sprintStart) {
                    toast.warn('Due date cannot be before sprint start date');
                    return;
                }
            }
        }
        try {
            setEpicLoading(true);
            let created: any = null;
            try {
                const res1: any = await new ApiCaller()
                    .setUrl(`/projects/${projectId}/epic/${selectedEpicId}/tasks`)
                    .post({ data: {
                        title: newTaskTitle.trim(),
                        description: newTaskDescription?.trim() || undefined,
                        priority: newTaskPriority,
                        sprintId: newTaskSprintId || undefined,
                        assigneeId: newTaskAssigneeId || undefined,
                        estimatedHours: newTaskEstimatedHours ? Number(newTaskEstimatedHours) : undefined,
                        tags: newTaskTags || undefined,
                        dueDate: newTaskDueDate || undefined,
                        orderIndex: 0
                    } });
                created = res1?.data?.data || res1?.data;
            } catch {}
            if (!created) {
                const res2: any = await new ApiCaller()
                    .setUrl(`/projects/${projectId}/epics/${selectedEpicId}/tasks`)
                    .post({ data: {
                        title: newTaskTitle.trim(),
                        description: newTaskDescription?.trim() || undefined,
                        priority: newTaskPriority,
                        sprintId: newTaskSprintId || undefined,
                        assigneeId: newTaskAssigneeId || undefined,
                        estimatedHours: newTaskEstimatedHours ? Number(newTaskEstimatedHours) : undefined,
                        tags: newTaskTags || undefined,
                        dueDate: newTaskDueDate || undefined,
                        orderIndex: 0
                    } });
                created = res2?.data?.data || res2?.data;
            }

            await loadEpicTasks(selectedEpicId);
            setShowAssignTaskModal(false);
            setAssignMode('existing');
            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskPriority('MEDIUM');
            setNewTaskSprintId(null);
            setNewTaskAssigneeId('');
            setNewTaskEstimatedHours('');
            setNewTaskTags('');
            setNewTaskDueDate('');
            toast.success('Task created in epic');

            const activeSprintId = sprints.find(s => s.status === 'active')?.id;
            const isInActive = created?.sprintId && activeSprintId && created.sprintId === activeSprintId;
            const isDone = ((created?.statusColumn?.name || '')).toLowerCase().includes('done') || ((created?.statusColumn?.name || '')).toLowerCase().includes('completed');
            if (isInActive) {
                setEpics(prev => prev.map(e => {
                    if (e.id !== selectedEpicId) return e;
                    const newTotal = (typeof e.totalTasks === 'number' ? e.totalTasks : 0) + 1;
                    const newDone = (typeof e.doneTasks === 'number' ? e.doneTasks : 0) + (isDone ? 1 : 0);
                    const newPercent = newTotal > 0 ? Math.round((newDone / newTotal) * 100) : 0;
                    return { ...e, totalTasks: newTotal, doneTasks: newDone, progressPercent: newPercent };
                }));
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to create task');
        } finally {
            setEpicLoading(false);
        }
    };

    const handleRemoveTaskFromEpic = async (taskId: number) => {
        if (!selectedEpicId) return;
        try {
            setEpicLoading(true);
            try {
                await new ApiCaller()
                    .setUrl(`/projects/${projectId}/tasks/${taskId}/epic`)
                    .setQueryParams({ epicId: '' })
                    .patch({ data: {} });
            } catch {
                await new ApiCaller()
                    .setUrl(`/projects/${projectId}/tasks/${taskId}/epic`)
                    .setQueryParams({ epicId: null as any })
                    .patch({ data: {} });
            }
            setEpicTasks(prev => prev.filter(t => t.id !== taskId));
            toast.success('Task removed from epic');

            const activeSprintId = sprints.find(s => s.status === 'active')?.id;
            const task = epicTasks.find(t => t.id === taskId);
            if (task && activeSprintId && task.sprintId === activeSprintId) {
                const isDone = (task.statusColumn?.name || '').toLowerCase().includes('done') || (task.statusColumn?.name || '').toLowerCase().includes('completed');
                setEpics(prev => prev.map(e => {
                    if (e.id !== selectedEpicId) return e;
                    const newTotal = Math.max(0, (typeof e.totalTasks === 'number' ? e.totalTasks : 0) - 1);
                    const newDone = Math.max(0, (typeof e.doneTasks === 'number' ? e.doneTasks : 0) - (isDone ? 1 : 0));
                    const newPercent = newTotal > 0 ? Math.round((newDone / newTotal) * 100) : 0;
                    return { ...e, totalTasks: newTotal, doneTasks: newDone, progressPercent: newPercent };
                }));
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to remove task');
        } finally {
            setEpicLoading(false);
        }
    };

    const handleCreateEpic = async () => {
        if (!newEpicTitle.trim()) {
            toast.warn('Please enter epic title');
            return;
        }
        try {
            setCreatingEpic(true);
            const payload: any = {
                title: newEpicTitle.trim(),
                description: newEpicDescription?.trim() || undefined,
                startDate: newEpicStartDate || undefined,
                endDate: newEpicEndDate || undefined
            };
            const res: any = await new ApiCaller().setUrl(`/projects/${projectId}/epics`).post({ data: payload });
            const created: any = res.data?.data || res.data;
            const activeSprintId = sprints.find(s => s.status === 'active')?.id;
            await loadEpics(activeSprintId);
            setShowCreateEpic(false);
            setNewEpicTitle('');
            setNewEpicDescription('');
            setNewEpicStartDate('');
            setNewEpicEndDate('');
            toast.success('Epic created successfully', { autoClose: 1500 });
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to create epic');
        } finally {
            setCreatingEpic(false);
        }
    };

    const handleArchiveTask = async (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(t('ArchiveTaskConfirm', { taskTitle: task.title }))) return;

        try {
            await taskAPI.archive(projectId, task.id);
            toast.success(t('TaskArchivedSuccessfully'));
            loadData(); // Reload toàn bộ
        } catch (error) {
            console.error('Error archiving task:', error);
            toast.error(t('FailedToArchiveTask'));
        }
    };

    const handleRestoreTask = async (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(t('RestoreTaskConfirm', { taskTitle: task.title }))) return;

        try {
            await taskAPI.restore(projectId, task.id);
            toast.success(t('TaskRestoredSuccessfully'));
            loadData(); // Reload toàn bộ
        } catch (error) {
            console.error('Error restoring task:', error);
            toast.error(t('FailedToRestoreTask'));
        }
    };

    const handlePermanentDelete = async (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();

        // Xác nhận 2 bước
        const confirm1 = window.confirm(
            `⚠️ XÓA VĨNH VIỄN TASK #${task.id}: "${task.title}"\n\n` +
            `Task này đã bị archived. Bạn có chắc muốn XÓA HOÀN TOÀN khỏi hệ thống?\n` +
            `Hành động này KHÔNG THỂ KHÔI PHỤC!`
        );
        if (!confirm1) return;

        const confirm2 = window.prompt(
            `Gõ từ "DELETE FOREVER" để xác nhận xóa vĩnh viễn:`
        );
        if (confirm2 !== "DELETE FOREVER") {
            toast.warn("Xóa bị hủy. Từ khóa không đúng.");
            return;
        }

        try {
            await taskAPI.delete(projectId, task.id); // Gọi hard delete
            setArchivedTasks(prev => prev.filter(t => t.id !== task.id));
            toast.success(`Task #${task.id} đã bị xóa vĩnh viễn!`, { autoClose: 3000 });
        } catch (error: any) {
            console.error('Hard delete failed:', error);
            if (error.status === 403) {
                toast.error("Bạn không có quyền xóa vĩnh viễn task này.");
            } else if (error.status === 404) {
                toast.warn("Task đã không còn tồn tại.");
                setArchivedTasks(prev => prev.filter(t => t.id !== task.id));
            } else {
                toast.error("Xóa vĩnh viễn thất bại. Vui lòng thử lại.");
            }
        }
    };
    const updateTaskLocally = (taskId: number, updates: Partial<Task>) => {
        setBacklogTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, ...updates } : task
        ));

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

    const handleStatusChange = async (task: Task, statusId: number, statusName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const previousStatus = task.statusColumn;

        setOpenDropdown(null);

        updateTaskLocally(task.id, {
            statusColumn: { id: statusId, name: statusName }
        });

        try {
            const updatedTask = {
                id: task.id,
                title: task.title,
                description: task.description,
                projectId: task.projectId,
                sprintId: task.sprintId,
                assigneeId: task.assigneeId,
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

            await taskAPI.update(projectId, task.id, updatedTask);
            toast.success(`Status updated to ${statusName}`, { autoClose: 2000 });
        } catch (error: any) {
            console.error('Error updating status:', error);
            const errorMsg = error?.response?.data?.message || 'Failed to update status';
            toast.error(errorMsg);
            
            // If column not found, reload columns from backend
            if (errorMsg.includes('Status column not found')) {
                toast.info('Reloading latest columns...', { autoClose: 1500 });
                await loadBoardColumns();
            }
            
            updateTaskLocally(task.id, { statusColumn: previousStatus });
        }
    };

    const handleAssigneeChange = async (task: Task, userId: string, displayName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const previousAssigneeId = task.assigneeId;

        setOpenDropdown(null);

        updateTaskLocally(task.id, {
            assigneeId: userId === 'unassigned' ? undefined : userId
        });

        try {
            // Only send assigneeId field (use empty string for unassign, not undefined)
            const updatePayload = {
                assigneeId: userId === 'unassigned' ? '' : userId
            };

            await taskAPI.update(projectId, task.id, updatePayload);
            toast.success(`Assigned to ${displayName}`, { autoClose: 2000 });
        } catch (error: any) {
            console.error('Error updating assignee:', error);
            toast.error('Failed to update assignee');
            updateTaskLocally(task.id, { assigneeId: previousAssigneeId });
        }
    };

    const handleEpicChange = async (task: Task, epicId: number | null, e: React.MouseEvent) => {
        e.stopPropagation();
        const previousEpicId = task.epicId ?? null;

        setOpenDropdown(null);

        updateTaskLocally(task.id, { epicId });

        try {
            await new ApiCaller()
                .setUrl(`/projects/${projectId}/tasks/${task.id}/epic`)
                .setQueryParams({ epicId: epicId ?? '' })
                .patch({ data: {} });
            toast.success(epicId ? 'Epic assigned' : 'Epic removed', { autoClose: 1500 });
        } catch (error: any) {
            console.error('Error updating epic:', error);
            toast.error(error?.response?.data?.message || 'Failed to update epic');
            updateTaskLocally(task.id, { epicId: previousEpicId });
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

        const originalBacklogTasks = [...backlogTasks];
        const originalSprintTasks = { ...sprintTasks };

        try {
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

            if (sourceSprintId === null) {
                const newBacklog = Array.from(backlogTasks);
                const [removed] = newBacklog.splice(source.index, 1);

                if (destSprintId !== null) {
                    const newSprintTasks = Array.from(sprintTasks[destSprintId] || []);
                    newSprintTasks.splice(destination.index, 0, { ...removed, sprintId: destSprintId });

                    setBacklogTasks(newBacklog);
                    setSprintTasks({ ...sprintTasks, [destSprintId]: newSprintTasks });
                } else {
                    newBacklog.splice(destination.index, 0, removed);
                    setBacklogTasks(newBacklog);
                }
            } else {
                const sourceList = Array.from(sprintTasks[sourceSprintId] || []);
                const [removed] = sourceList.splice(source.index, 1);

                if (destSprintId === null) {
                    const newBacklog = Array.from(backlogTasks);
                    newBacklog.splice(destination.index, 0, { ...removed, sprintId: null });

                    setBacklogTasks(newBacklog);
                    setSprintTasks({ ...sprintTasks, [sourceSprintId]: sourceList });
                } else if (sourceSprintId === destSprintId) {
                    sourceList.splice(destination.index, 0, removed);
                    setSprintTasks({ ...sprintTasks, [sourceSprintId]: sourceList });
                } else {
                    const destList = Array.from(sprintTasks[destSprintId] || []);
                    destList.splice(destination.index, 0, { ...removed, sprintId: destSprintId });

                    setSprintTasks({
                        ...sprintTasks,
                        [sourceSprintId]: sourceList,
                        [destSprintId]: destList
                    });
                }
            }

            // Only send necessary fields for sprint drag-drop (exclude statusColumn)
            await taskAPI.update(projectId, taskId, {
                sprintId: destSprintId,
                orderIndex: destination.index
            });

            toast.success('Task moved successfully', { autoClose: 1500 });
        } catch (error) {
            console.error('Error moving task:', error);
            toast.error('Failed to move task. Rolling back...');

            setBacklogTasks(originalBacklogTasks);
            setSprintTasks(originalSprintTasks);
        }
    };

    const handleStartSprint = async (sprintId: number) => {
        try {
            const sprint = sprints.find(s => s.id === sprintId);
            if (!sprint) {
                toast.error('Sprint not found');
                return;
            }

            if (!sprint.startDate || !sprint.endDate) {
                toast.warning('Please set start and end dates for this sprint', { autoClose: 3000 });
                setEditingSprint(sprint);
                setEditSprintFocusDates(true);
                setShowEditSprint(true);
                return;
            }

            const hasActiveSprint = sprints.some(s => s.status === 'active' && s.id !== sprintId);
            if (hasActiveSprint) {
                toast.error('You already have an active sprint. Please complete it before starting a new one.');
                return;
            }

            const tasks = sprintTasks[sprintId] || [];
            if (tasks.length === 0) {
                const proceed = window.confirm('This sprint has no tasks. Do you want to start it anyway?');
                if (!proceed) return;
            }

            const startDate = new Date(sprint.startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);

            if (startDate > today) {
                const proceed = window.confirm(
                    `This sprint is scheduled to start on ${startDate.toLocaleDateString()}. Do you want to start it early?`
                );
                if (!proceed) return;
            }

            await sprintAPI.update(projectId, sprintId, { status: 'active' });

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
    };

    const handleCompleteSprint = async (sprintId: number) => {
        const sprint = sprints.find(s => s.id === sprintId);
        if (!sprint) {
            toast.error('Sprint not found');
            return;
        }

        if (sprint.status !== 'active') {
            toast.error('Only active sprints can be completed. Please start the sprint first.');
            return;
        }

        const tasks = sprintTasks[sprintId] || [];
        const incompleteTasks = tasks.filter(task => {
            const statusName = task.statusColumn?.name?.toUpperCase() || '';
            return statusName !== 'DONE' && statusName !== 'COMPLETED';
        });

        if (incompleteTasks.length > 0) {
            const proceed = window.confirm(
                `This sprint has ${incompleteTasks.length} incomplete task(s). ` +
                `These tasks will be moved back to the backlog. Do you want to complete this sprint?`
            );
            if (!proceed) return;
        }

        try {
            await sprintAPI.update(projectId, sprintId, { status: 'completed' });

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

        if (sprint.status === 'active') {
            if (!window.confirm(
                t('DeleteSprintWarning') + '\n\n' +
                t('DeleteSprintActiveMessage') + '\n\n' +
                t('DeleteSprintConfirm')
            )) {
                return;
            }
        } else {
            if (!window.confirm(
                t('DeleteSprintConfirm') + '\n\n' +
                t('DeleteSprintPlannedMessage')
            )) {
                return;
            }
        }

        try {
            await sprintAPI.delete(projectId, sprintId);
            toast.success(t('SprintDeletedSuccessfully'));
            loadData();
        } catch (error) {
            console.error('Error deleting sprint:', error);
            toast.error(t('FailedToDeleteSprint'));
        }
    };

    const getPriorityColor = (priority: string) => {
        // Match colors with Board and List: HIGH=warning, MEDIUM=info, LOW=secondary
        switch (priority?.toUpperCase()) {
            case 'HIGH': return 'warning'; // Yellow/Orange color
            case 'MEDIUM': return 'info';  // Blue color
            case 'LOW': return 'secondary'; // Gray color
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

    const renderTask = (task: Task, index: number, isArchived = false) => {
        // Find matching status from statusColumns by ID or name
        let currentStatus: StatusColumn;
        if (task.statusColumn) {
            const matchedById = statusColumns.find(col => col.id === task.statusColumn?.id);
            const matchedByName = statusColumns.find(col =>
                col.name.toUpperCase() === task.statusColumn?.name?.toUpperCase()
            );
            currentStatus = matchedById || matchedByName || {
                ...task.statusColumn,
                color: task.statusColumn.color || statusColumns[0]?.color || '#3b82f6'
            };
        } else {
            currentStatus = statusColumns[0] || { id: 1, name: 'TO DO', color: '#840417ff' };
        }

        const currentAssignee = projectMembers.length > 0 
            ? (projectMembers.find(m => m.userId === task.assigneeId) || projectMembers[0])
            : { userId: 'unassigned', displayName: t('Unassigned'), email: '' };

        const TaskContent = (
            <div className={`task-card ${isArchived ? 'archived-task' : ''}`}>
                <div className="task-header">
                    <span className="task-id">#{task.id}</span>
                    <div className="d-flex gap-1 align-items-center">
                        {/* Priority Badge */}
                        <Badge bg={getPriorityColor(task.priority)}>
                            {task.priority?.toUpperCase() === 'HIGH' ? t('PriorityHigh') :
                             task.priority?.toUpperCase() === 'MEDIUM' ? t('PriorityMedium') :
                             task.priority?.toUpperCase() === 'LOW' ? t('PriorityLow') :
                             task.priority}
                        </Badge>

                        {/* Nút Archive (chỉ task chưa archive) */}
                        {!isArchived && (
                            <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-muted"
                                onClick={(e) => handleArchiveTask(task, e)}
                                title={t('ArchiveThisTask')}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Archive size={14} />
                            </Button>
                        )}

                        {/* Nút Restore (chỉ archived task) */}
                        {isArchived && (
                            <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-success"
                                onClick={(e) => handleRestoreTask(task, e)}
                                title={t('RestoreThisTask')}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <RotateCcw size={14} />
                            </Button>
                        )}

                        {isArchived && (
                            <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-danger"
                                onClick={(e) => handlePermanentDelete(task, e)}
                                title="Xóa vĩnh viễn (không thể khôi phục)"
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <i className="ri-delete-bin-2-fill" style={{ fontSize: '14px' }}></i>
                            </Button>
                        )}
                    </div>
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

                    {!isArchived && (
                        <div className="task-actions-right" onClick={(e) => e.stopPropagation()}>
                            {/* Epic Dropdown - left of Status */}
                            <Dropdown
                                className="d-inline-block"
                                show={openDropdown?.taskId === task.id && openDropdown?.type === 'epic'}
                                onToggle={(isOpen) => {
                                    if (isOpen) {
                                        setOpenDropdown({ taskId: task.id, type: 'epic' });
                                    } else {
                                        setOpenDropdown(null);
                                    }
                                }}
                            >
                                <Dropdown.Toggle
                                    variant="light"
                                    size="sm"
                                    id={`epic-dropdown-${task.id}`}
                                    className="task-action-btn"
                                    style={{
                                        fontSize: '10px',
                                        padding: '2px 6px',
                                        backgroundColor: task.epicId ? '#eae6ff' : '#f4f5f7',
                                        color: task.epicId ? '#5e4db2' : '#5e6c84',
                                        border: task.epicId ? '1px solid #c0b6f2' : '1px solid #dfe1e6',
                                    }}
                                >
                                    {task.epicId ? (epics.find(e => e.id === task.epicId)?.title || 'Epic') : 'Epic'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu 
                                    popperConfig={{ strategy: 'fixed' }}
                                    style={{ maxHeight: '260px', overflowY: 'auto' }}
                                >
                                    <Dropdown.Item
                                        active={!task.epicId}
                                        onClick={(e) => handleEpicChange(task, null, e)}
                                    >
                                        None
                                    </Dropdown.Item>
                                    {epics.map((epic) => (
                                        <Dropdown.Item
                                            key={`epic-${epic.id}`}
                                            active={task.epicId === epic.id}
                                            onClick={(e) => handleEpicChange(task, epic.id, e)}
                                        >
                                            {epic.title}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Status Dropdown */}
                            <Dropdown
                                className="d-inline-block"
                                show={openDropdown?.taskId === task.id && openDropdown?.type === 'status'}
                                onToggle={async (isOpen) => {
                                    if (isOpen) {
                                        setOpenDropdown({ taskId: task.id, type: 'status' });
                                        // Reload columns to ensure we have the latest statuses
                                        await loadBoardColumns();
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
                                    {currentStatus.name?.toUpperCase() === 'TO DO' ? t('StatusTodo') :
                                     currentStatus.name?.toUpperCase() === 'IN PROGRESS' ? t('StatusInProgress') :
                                     currentStatus.name?.toUpperCase() === 'DONE' ? t('StatusDone') :
                                     currentStatus.name}
                                </Dropdown.Toggle>
                                <Dropdown.Menu 
                                    popperConfig={{ strategy: 'fixed' }}
                                    style={{ maxHeight: '260px', overflowY: 'auto' }}
                                >
                                    {statusColumns.map((status, idx) => {
                                        const statusDisplayName = status.name?.toUpperCase() === 'TO DO' ? t('StatusTodo') :
                                                                 status.name?.toUpperCase() === 'IN PROGRESS' ? t('StatusInProgress') :
                                                                 status.name?.toUpperCase() === 'DONE' ? t('StatusDone') :
                                                                 status.name;
                                        return (
                                        <Dropdown.Item
                                            key={`${status.id}-${idx}`}
                                            onClick={(e) => handleStatusChange(task, status.id, status.name, e)}
                                            active={currentStatus.id === status.id || currentStatus.name?.toUpperCase() === status.name?.toUpperCase()}
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
                                            {statusDisplayName}
                                        </Dropdown.Item>
                                        );
                                    })}
                                </Dropdown.Menu>
                            </Dropdown>

                            <Dropdown
                                className="d-inline-block"
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
                                    {currentAssignee.displayName}
                                </Dropdown.Toggle>
                                <Dropdown.Menu
                                    popperConfig={{ strategy: 'fixed' }}
                                    style={{ maxHeight: '260px', overflowY: 'auto' }}
                                >
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
                    )}
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
                    {isArchived && task.archivedAt && (
                        <span className="task-meta text-muted">
              <Archive size={12} /> {t('Archived')} {new Date(task.archivedAt).toLocaleDateString()}
            </span>
                    )}
                </div>
            </div>
        );

        if (isArchived) {
            return <div key={task.id}>{TaskContent}</div>;
        }

        return (
            <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={snapshot.isDragging ? 'dragging' : ''}
                    >
                        {TaskContent}
                    </div>
                )}
            </Draggable>
        );
    };

    if (loading) {
        return (
            <Container fluid className="backlog-sprint-page">
                <div className="text-center py-5">{t('Loading')}</div>
            </Container>
        );
    }

    const filteredBacklogTasks = epicFilterId
        ? backlogTasks.filter(t => t.epicId === epicFilterId)
        : backlogTasks;

    const filteredSprintTasks: { [sprintId: number]: Task[] } = epicFilterId
        ? Object.fromEntries(
            Object.entries(sprintTasks).map(([sid, list]) => [Number(sid), list.filter(t => t.epicId === epicFilterId)])
        )
        : sprintTasks;

    const filteredArchivedTasks = epicFilterId
        ? archivedTasks.filter(t => t.epicId === epicFilterId)
        : archivedTasks;

    return (
        <Container fluid className="backlog-sprint-page">
            <Row className="mb-3 align-items-center page-header">
                <Col xs="auto">
                    <Button variant="primary" onClick={() => setShowCreateSprint(true)}>
                        <Plus size={16} className="me-1" /> {t('CreateSprint')}
                    </Button>
                </Col>
                <Col xs="auto" className="ms-auto">
                    <Form.Check
                        type="switch"
                        id="show-archived-toggle"
                        label={`${t('ShowArchivedTasks')} (${archivedTasks.length})`}
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                    />
                </Col>
                <Col xs="auto">
                    <Form.Check
                        type="switch"
                        id="show-epics-toggle"
                        label={`${showEpicSidebar ? t('HideEpics') : t('ShowEpics')}`}
                        checked={showEpicSidebar}
                        onChange={(e) => {
                            setShowEpicSidebar(e.target.checked);
                            localStorage.setItem('showEpicSidebar', String(e.target.checked));
                        }}
                    />
                </Col>
            </Row>
            <Row>
                {showEpicSidebar && (
                    <Col md={2} className="mb-3">
                        <Card>
                            <Card.Body>
                                <h6 className="mb-3">{t('Epics')}</h6>
                                {epics.length === 0 ? (
                                    <div className="text-muted">{t('NoEpics')}</div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {epics.map(e => {
                                            const total = typeof e.totalTasks === 'number' ? e.totalTasks : undefined;
                                            const done = typeof e.doneTasks === 'number' ? e.doneTasks : undefined;
                                            const percent = typeof e.progressPercent === 'number'
                                                ? Math.round(e.progressPercent)
                                                : (total && done ? Math.round((done / Math.max(total, 1)) * 100) : 0);
                                            const isExpanded = expandedEpicIds.includes(e.id);
                                        return (
                                            <div
                                                key={e.id}
                                                className={`epic-card ${epicFilterId === e.id ? 'selected' : ''}`}
                                                onClick={() => toggleEpicFilter(e.id)}
                                                role="button"
                                            >
                                                <div className="d-flex align-items-start justify-content-between mb-1">
                                                    <div className="fw-semibold text-truncate" title={e.title}>{e.title}</div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="small text-muted">{percent}%</span>
                                                        <Button
                                                            type="button"
                                                            variant="link"
                                                            size="sm"
                                                            className="p-0 epic-card-menu"
                                                            title={isExpanded ? t('HideInfo') : t('ShowInfo')}
                                                            onMouseDown={(ev) => ev.stopPropagation()}
                                                            onClick={(ev) => { ev.stopPropagation(); toggleEpicExpand(e.id); }}
                                                        >
                                                            {isExpanded ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <ProgressBar now={percent} variant={percent >= 100 ? 'success' : 'info'} style={{ height: 6 }} />
                                                {typeof total === 'number' && typeof done === 'number' && (
                                                    <div className="small text-muted mt-1">{done} / {total}</div>
                                                )}
                                                {isExpanded && (
                                                    <div className="epic-card-details">
                                                        <div className="dates small">
                                                            <div>
                                                                {t('Start')}: {e.startDate ? new Date(e.startDate).toLocaleDateString() : t('NA')}
                                                            </div>
                                                            <div>
                                                                {t('End')}: {e.endDate ? new Date(e.endDate).toLocaleDateString() : t('NA')}
                                                            </div>
                                                        </div>
                                                        <div className="actions mt-2">
                                                            <Button
                                                                type="button"
                                                                variant="link"
                                                                size="sm"
                                                                className="p-0 epic-card-menu"
                                                                title={t('ViewEpicDetails')}
                                                                onMouseDown={(ev) => ev.stopPropagation()}
                                                                onClick={(ev) => { ev.stopPropagation(); openEpicDetail(e.id); }}
                                                            >
                                                                {t('ViewEpicDetails')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                        })}
                                    </div>
                                )}
                                <div className="mt-3">
                                    <Button variant="outline-primary" size="sm" onClick={() => setShowCreateEpic(true)}>
                                        <Plus size={14} className="me-1" /> {t('AddEpic')}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                )}
                <Col md={showEpicSidebar ? (selectedEpic ? 7 : 10) : (selectedEpic ? 8 : 12)}>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Accordion defaultActiveKey="backlog" alwaysOpen className="mb-3">
                    <Accordion.Item eventKey="backlog" className="sprint-accordion-item">
                        <Accordion.Header className="sprint-accordion-header">
                            <div className="d-flex align-items-center justify-content-between w-100 pe-3">
                                <div className="d-flex align-items-center gap-3">
                                    <h5 className="mb-0">{t('Backlog')}</h5>
                                    <Badge bg="secondary" className="task-count-badge">
                                        {filteredBacklogTasks.length} {t(filteredBacklogTasks.length === 1 ? 'Task' : 'Tasks')}
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
                                        title={t('AddNewTaskToBacklog')}
                                    >
                                        <Plus size={14} /> {t('AddTask')}
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
                                        {filteredBacklogTasks.length === 0 ? (
                                            <div className="empty-state">{t('NoTasksInBacklog')}</div>
                                        ) : (
                                            filteredBacklogTasks.map((task, index) => renderTask(task, index))
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>

                <Accordion defaultActiveKey="0" alwaysOpen>
                    {sprints
                        .filter(sprint => !sprint.isBacklog && sprint.status !== 'completed')
                        .sort((a, b) => {
                            if (a.status === 'active' && b.status !== 'active') return -1;
                            if (a.status !== 'active' && b.status === 'active') return 1;

                            if (a.startDate && b.startDate) {
                                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                            }

                            if (a.startDate && !b.startDate) return -1;
                            if (!a.startDate && b.startDate) return 1;

                            return 0;
                        })
                        .map((sprint, index) => {
                            const tasks = filteredSprintTasks[sprint.id] || [];

                            return (
                                <Accordion.Item eventKey={index.toString()} key={sprint.id} className="mb-3 sprint-accordion-item">
                                    <Accordion.Header className="sprint-accordion-header">
                                        <div className="d-flex align-items-center justify-content-between w-100 pe-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <h5 className="mb-0">{sprint.name}</h5>
                                                <Badge bg={getStatusColor(sprint.status)} className="sprint-badge">
                                                    {sprint.status === 'active' ? t('StatusActive') :
                                                     sprint.status === 'planned' ? t('StatusPlanned') :
                                                     sprint.status === 'completed' ? t('StatusCompleted') :
                                                     sprint.status === 'paused' ? t('StatusPaused') :
                                                     sprint.status === 'cancelled' ? t('StatusCancelled') :
                                                     String(sprint.status).toUpperCase()}
                                                </Badge>
                                                {sprint.startDate && sprint.endDate && (
                                                    <span className="text-muted small">
                            {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                          </span>
                                                )}
                                                {!sprint.startDate && !sprint.endDate && (
                                                    <span className="text-muted small fst-italic">{t('NoDatesSet')}
                          </span>
                                                )}
                                                <Badge bg="secondary" className="task-count-badge">
                                                    {tasks.length} {tasks.length === 1 ? t('Task') : t('Tasks')}
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
                                                                ? t('CompleteActiveSprintFirst')
                                                                : t('StartThisSprint')
                                                        }
                                                    >
                                                        <Play size={14} /> {t('Start')}
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
                                                        title={t('CompleteThisSprint')}
                                                    >
                                                        <Check size={14} /> {t('Complete')}
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
                                                    title={t('AddNewTask')}
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
                                                            {t('EditSprint')}
                                                        </Dropdown.Item>
                                                        <Dropdown.Item
                                                            onClick={() => handleDeleteSprint(sprint.id)}
                                                            className="text-danger"
                                                        >
                                                            <i className="ri-delete-bin-line me-2"></i>
                                                            {t('DeleteSprint')}
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
                                                            {t('NoTasksInSprint')}
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

                {showArchived && archivedTasks.length > 0 && (
                    <Accordion defaultActiveKey="archived" alwaysOpen className="mb-3 mt-4">
                        <Accordion.Item eventKey="archived" className="sprint-accordion-item archived-section">
                            <Accordion.Header className="sprint-accordion-header">
                                <div className="d-flex align-items-center justify-content-between w-100 pe-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <h5 className="mb-0">
                                            <Archive size={18} className="me-2" />
                                            {t('ArchivedTasks')}
                                        </h5>
                                        <Badge bg="secondary" className="task-count-badge">
                                                    {filteredArchivedTasks.length} {filteredArchivedTasks.length === 1 ? 'task' : 'tasks'}
                                        </Badge>
                                    </div>
                                </div>
                            </Accordion.Header>
                            <Accordion.Body className="sprint-accordion-body">
                                <div className="tasks-list archived-tasks-list">
                                    {filteredArchivedTasks.map((task, index) => renderTask(task, index, true))}
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                )}
                    </DragDropContext>
                </Col>
                {selectedEpic && (
                    <Col md={showEpicSidebar ? 3 : 4} className="mb-3">
                        <Card>
                            <Card.Body>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <h6 className="mb-0">{t('EpicDetails')}</h6>
                                    <Button variant="outline-secondary" size="sm" onClick={() => { setSelectedEpic(null); }}>Close</Button>
                                </div>
                                {epicLoading && (
                                    <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                                )}
                                {!epicLoading && selectedEpic && (
                                    <>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Title</Form.Label>
                                            <Form.Control type="text" value={epicEditTitle} onChange={(e) => setEpicEditTitle(e.target.value)} />
                                        </Form.Group>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Description</Form.Label>
                                            <Form.Control as="textarea" rows={3} value={epicEditDescription} onChange={(e) => setEpicEditDescription(e.target.value)} />
                                        </Form.Group>
                                        <Row className="g-2">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Start Date</Form.Label>
                                                    <Form.Control type="date" value={epicEditStartDate} onChange={(e) => setEpicEditStartDate(e.target.value)} />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>End Date</Form.Label>
                                                    <Form.Control type="date" value={epicEditEndDate} onChange={(e) => setEpicEditEndDate(e.target.value)} />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <div className="d-flex gap-2 mt-3 epic-detail-actions">
                                            <Button variant="outline-primary" size="sm" className="add-task" onClick={() => setShowAssignTaskModal(true)}>{t('AddTask')}</Button>
                                            <Button variant="outline-success" size="sm" className="save-epic" onClick={handleUpdateEpic} disabled={epicLoading}>{t('Save')}</Button>
                                            <Button variant="outline-danger" size="sm" className="delete-epic" onClick={handleDeleteEpic} disabled={epicLoading}>{t('Delete')}</Button>
                                        </div>

                                        <hr className="my-3" />
                                        
                                        {epicTasksLoading ? (
                                            <div className="text-center py-2"><Spinner animation="border" size="sm" /></div>
                                        ) : epicTasks.length === 0 ? (
                                            <div className="text-muted">{t('NoTasksAssigned')}</div>
                                        ) : (
                                            <div className="d-flex flex-column gap-2">
                                                {epicTasks.map(taskItem => (
                                                    <div key={taskItem.id} className="d-flex align-items-center justify-content-between">
                                                        <div className="text-truncate">
                                                            <Button variant="link" className="p-0 fw-semibold text-truncate" onClick={() => { setSelectedTask(taskItem); setShowTaskDetail(true); }} title={taskItem.title}>
                                                                {taskItem.title}
                                                            </Button>
                                                            {taskItem.statusColumn?.name && (
                                                                <Badge bg="secondary" className="ms-2">{taskItem.statusColumn.name}</Badge>
                                                            )}
                                                        </div>
                                                        <Button variant="outline-secondary" size="sm" className="btn-remove-epic-task" onClick={() => handleRemoveTaskFromEpic(taskItem.id)}>{t('Remove')}</Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                )}
            </Row>

            <Modal show={showAssignTaskModal} onHide={() => setShowAssignTaskModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t('AddTaskToEpic')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex gap-3 mb-3">
                        <Form.Check
                            type="radio"
                            label="Add existing task"
                            name="assign-mode"
                            checked={assignMode === 'existing'}
                            onChange={() => setAssignMode('existing')}
                        />
                        <Form.Check
                            type="radio"
                            label="Create new task"
                            name="assign-mode"
                            checked={assignMode === 'new'}
                            onChange={() => setAssignMode('new')}
                        />
                    </div>

                    {assignMode === 'existing' ? (
                        <Form.Group>
                            <Form.Label>Select Task</Form.Label>
                            <Form.Select value={assignSelectedTaskId || ''} onChange={(e) => setAssignSelectedTaskId(e.target.value ? parseInt(e.target.value) : null)}>
                                <option value="">Choose a task</option>
                                {(() => {
                                    const epicTaskIds = new Set(epicTasks.map(t => t.id));
                                    const allSprintTasks = Object.values(sprintTasks).flat();
                                    const pool = [...backlogTasks, ...allSprintTasks].filter(t => !epicTaskIds.has(t.id));
                                    return pool.map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ));
                                })()}
                            </Form.Select>
                        </Form.Group>
                    ) : (
                        <>
                            <Form.Group className="mb-2">
                                <Form.Label>Title</Form.Label>
                                <Form.Control type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Task title" />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows={3} value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Description..." />
                            </Form.Group>
                            <Row className="g-2">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Priority</Form.Label>
                                        <Form.Select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as any)}>
                                            {['HIGH','MEDIUM','LOW'].map(p => (<option key={p} value={p}>{p}</option>))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Assignee</Form.Label>
                                        <Form.Select value={newTaskAssigneeId} onChange={(e) => setNewTaskAssigneeId(e.target.value)}>
                                            <option value="">Unassigned</option>
                                            {[...projectMembers.filter((m, idx, arr) => m.userId !== 'unassigned' || idx === arr.findIndex(mm => mm.userId === 'unassigned'))].map(m => (
                                                m.userId === 'unassigned' ? null : (<option key={m.userId} value={m.userId}>{m.displayName || m.email}</option>)
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row className="g-2 mt-0">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Estimate Hours</Form.Label>
                                        <Form.Control type="number" min="0" step="0.5" value={newTaskEstimatedHours} onChange={(e) => setNewTaskEstimatedHours(e.target.value)} placeholder="e.g. 4" />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Due Date</Form.Label>
                                        <Form.Control type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} min={newTaskSprintId ? (sprints.find(s => s.id === newTaskSprintId)?.startDate || undefined) : undefined} />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Tags</Form.Label>
                                        <Form.Control type="text" value={newTaskTags} onChange={(e) => setNewTaskTags(e.target.value)} placeholder="tag1, tag2" />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mt-2">
                                <Form.Label>Sprint</Form.Label>
                                <Form.Select value={newTaskSprintId ?? ''} onChange={(e) => setNewTaskSprintId(e.target.value ? parseInt(e.target.value) : null)}>
                                    <option value="">None</option>
                                    {sprints.filter(s => !s.isBacklog).map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                                </Form.Select>
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAssignTaskModal(false)}>{t('Cancel')}</Button>
                    <Button
                        variant="primary"
                        onClick={assignMode === 'existing' ? handleAssignSelectedTaskToEpic : handleCreateTaskInEpic}
                        disabled={assignMode === 'existing' ? !assignSelectedTaskId : !newTaskTitle.trim()}
                    >
                        Add
                    </Button>
                </Modal.Footer>
            </Modal>

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
                autoStartAfterSave={editSprintFocusDates}
                onSuccess={async () => {
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

            <Modal show={showCreateEpic} onHide={() => setShowCreateEpic(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t('CreateEpic')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control type="text" value={newEpicTitle} onChange={(e) => setNewEpicTitle(e.target.value)} placeholder="Epic title" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" rows={3} value={newEpicDescription} onChange={(e) => setNewEpicDescription(e.target.value)} placeholder="Description..." />
                    </Form.Group>
                    <Row className="g-2">
                        <Col md={6}>
                            <Form.Group>
                                                    <Form.Label>{t('StartDate')}</Form.Label>
                                <Form.Control type="date" value={newEpicStartDate} onChange={(e) => setNewEpicStartDate(e.target.value)} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                                    <Form.Label>{t('EndDate')}</Form.Label>
                                <Form.Control type="date" value={newEpicEndDate} onChange={(e) => setNewEpicEndDate(e.target.value)} />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCreateEpic(false)} disabled={creatingEpic}>{t('Cancel')}</Button>
                    <Button variant="primary" onClick={handleCreateEpic} disabled={creatingEpic}>
                        {creatingEpic ? t('Creating') : t('CreateEpic')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default BacklogSprint;
