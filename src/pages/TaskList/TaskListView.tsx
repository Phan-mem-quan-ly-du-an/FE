import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardBody, Row, Col, Button, Input, Table, Badge, Spinner, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, InputGroup, InputGroupText, UncontrolledDropdown, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label } from 'reactstrap';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiCaller from '../../apiCaller/caller/apiCaller';
import { getProjectMembers, ProjectMember } from '../../apiCaller/projectMembers';
import { sprintAPI } from '../../apiCaller/backlogSprint';
import CreateTaskModal from '../BacklogSprint/CreateTaskModal';
import TaskDetailModal from '../BacklogSprint/TaskDetailModal';
import './TaskList.scss';

interface Task {
  id: number;
  title: string;
  description?: string;
  projectId: string;
  sprintId?: number | null;
  assigneeId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' ;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string;
  orderIndex: number;
  statusColumn?: { id: number; name: string };
  createdAt?: string;
  updatedAt?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

interface BoardResponseColumn { id: number; name: string; position: number; }

const TaskListView = () => {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [columns, setColumns] = useState<BoardResponseColumn[]>([]);
  const [sprints, setSprints] = useState<{ id: number; name: string }[]>([]);
  const [openAssigneeDropdown, setOpenAssigneeDropdown] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    q: '',
    priorities: [] as string[],
    assigneeIds: [] as string[],
    columnIds: [] as number[],
    sprintId: undefined as number | undefined,
    onlyActiveSprint: false,
    includeArchived: false
  });
  const [groupBy, setGroupBy] = useState<'none' | 'priority' | 'assignee' | 'status' | 'sprint'>('none');
  const [groupValue, setGroupValue] = useState<string | number | undefined>(undefined);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [viewDensity, setViewDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const appliedFiltersRef = useRef<typeof filters | null>(null);
  const debounceTimerRef = useRef<any>(null);

  const hasFilters = (f: typeof filters) => {
    if (f.q && f.q.trim() !== '') return true;
    if (f.priorities.length) return true;
    if (f.assigneeIds.length) return true;
    if (f.columnIds.length) return true;
    if (typeof f.sprintId !== 'undefined') return true;
    if (f.includeArchived === true) return true;
    if (f.onlyActiveSprint === true) return true;
    return false;
  };

  const loadProjectMembers = async () => {
    if (!projectId) return;
    try {
      const members = await getProjectMembers(projectId);
      setProjectMembers(members);
    } catch {}
  };

  const loadBoardColumns = async () => {
    if (!projectId) return;
    try {
      const res: any = await new ApiCaller().setUrl(`/projects/${projectId}/board`).get();
      const data: any = res.data || {};
      const board = data.data || data;
      const cols = (board.columns || []).map((c: any) => ({ id: c.id, name: c.name, position: c.position }));
      setColumns(cols);
    } catch {}
  };

  const loadSprints = async () => {
    if (!projectId) return;
    try {
      const list = await sprintAPI.listByProject(projectId);
      setSprints(list.map(s => ({ id: (s as any).id, name: (s as any).name })) as any);
    } catch {}
  };

  const fetchTasks = async (useFilters: typeof filters | null) => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const query = `sort=${encodeURIComponent(`${sortField},${sortDirection}`)}&page=${page}&size=${size}`;
      if (useFilters && hasFilters(useFilters)) {
        const body: any = {
          q: useFilters.q || undefined,
          priorities: (useFilters.priorities || []).map(p => p.toLowerCase()),
          assigneeIds: useFilters.assigneeIds || [],
          columnIds: useFilters.columnIds || [],
          sprintId: typeof useFilters.sprintId === 'number' ? useFilters.sprintId : undefined,
          onlyActiveSprint: useFilters.onlyActiveSprint,
          includeArchived: useFilters.includeArchived
        };
        const res: any = await new ApiCaller().setUrl(`/projects/${projectId}/tasks/search?${query}`).post({ data: body });
        const data: any = res.data;
        const pageData: PageResponse<Task> = (data.data || data) as any;
        setTasks(pageData.content || []);
        setTotalElements(pageData.totalElements || 0);
        setTotalPages(pageData.totalPages || 0);
      } else {
        const res: any = await new ApiCaller().setUrl(`/projects/${projectId}/tasks?${query}`).get();
        const data: any = res.data;
        const pageData: PageResponse<Task> = (data.data || data) as any;
        setTasks(pageData.content || []);
        setTotalElements(pageData.totalElements || 0);
        setTotalPages(pageData.totalPages || 0);
      }
    } catch (e: any) {
      setError(t('FailedToLoadTasks'));
      toast.error(t('FailedToLoadTasks'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectMembers();
    loadBoardColumns();
    loadSprints();
  }, [projectId]);

  useEffect(() => {
    if (appliedFiltersRef.current) {
      fetchTasks(appliedFiltersRef.current);
    } else {
      fetchTasks(null);
    }
  }, [projectId, sortField, sortDirection, page, size]);

  useEffect(() => {
    appliedFiltersRef.current = { ...filters };
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchTasks(appliedFiltersRef.current);
    }, 300);
  }, [filters.priorities, filters.assigneeIds, filters.columnIds, filters.sprintId, filters.onlyActiveSprint, filters.includeArchived]);

  const onChangeQ = (v: string) => {
    setFilters(prev => {
      const next = { ...prev, q: v };
      appliedFiltersRef.current = next;
      return next;
    });
    setPage(0);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchTasks(appliedFiltersRef.current);
    }, 400);
  };

  const togglePriority = (p: 'LOW' | 'MEDIUM' | 'HIGH') => {
    setFilters(prev => {
      const exists = prev.priorities.includes(p);
      const priorities = exists ? prev.priorities.filter(x => x !== p) : [...prev.priorities, p];
      return { ...prev, priorities };
    });
    setPage(0);
  };

  const toggleAssignee = (id: string) => {
    setFilters(prev => {
      const exists = prev.assigneeIds.includes(id);
      const assigneeIds = exists ? prev.assigneeIds.filter(x => x !== id) : [...prev.assigneeIds, id];
      return { ...prev, assigneeIds };
    });
    setPage(0);
  };

  const toggleColumn = (id: number) => {
    setFilters(prev => {
      const exists = prev.columnIds.includes(id);
      const columnIds = exists ? prev.columnIds.filter(x => x !== id) : [...prev.columnIds, id];
      return { ...prev, columnIds };
    });
    setPage(0);
  };

  const toggleOnlyActiveSprint = () => {
    setFilters(prev => ({ ...prev, onlyActiveSprint: !prev.onlyActiveSprint, sprintId: prev.onlyActiveSprint ? prev.sprintId : undefined }));
    setPage(0);
  };

  const setSprint = (id?: number) => {
    setFilters(prev => ({ ...prev, sprintId: id }));
    setPage(0);
  };

  const toggleIncludeArchived = () => {
    if (!filters.includeArchived) {
      const ok = window.confirm(t('IncludeArchivedTasks') + '?');
      if (!ok) return;
    }
    setFilters(prev => ({ ...prev, includeArchived: !prev.includeArchived }));
    setPage(0);
  };

  const handleAssignMember = async (taskId: number, memberId: string) => {
    if (!projectId) return;
    try {
      const res: any = await new ApiCaller().setUrl(`/projects/${projectId}/tasks/${taskId}`).put({ data: { assigneeId: memberId } });
      const updated: any = res.data?.data || res.data;
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, assigneeId: updated.assigneeId } : t)));
      toast.success(t('AssignedSuccessfully'), { autoClose: 1500 });
    } catch {
      toast.error(t('FailedToAssignTask'));
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <i className="ri-expand-up-down-line ms-1 text-muted"></i>;
    return sortDirection === 'asc' ? <i className="ri-arrow-up-line ms-1"></i> : <i className="ri-arrow-down-line ms-1"></i>;
  };

  const getPriorityColor = (priority: string) => {
    switch ((priority || '').toUpperCase()) {
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'secondary';
    const lower = status.toLowerCase();
    if (lower.includes('done') || lower.includes('completed')) return 'success';
    if (lower.includes('progress') || lower.includes('doing')) return 'primary';
    if (lower.includes('review')) return 'warning';
    return 'secondary';
  };

  const getMemberInfo = (assigneeId?: string) => {
    if (!assigneeId) return null;
    return projectMembers.find(m => m.userId === assigneeId);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  };

  const stats = useMemo(() => {
    const total = totalElements;
    const highPriority = tasks.filter(t => (t.priority || '').toString().toUpperCase() === 'HIGH').length;
    const assigned = tasks.filter(t => t.assigneeId).length;
    const unassigned = (tasks.length || 0) - assigned;
    return { total, highPriority, assigned, unassigned };
  }, [tasks, totalElements]);

  const displayTasks = useMemo(() => {
    if (groupBy === 'none' || typeof groupValue === 'undefined' || groupValue === null || groupValue === '') return tasks;
    const isMatch = (t: Task) => {
      if (groupBy === 'priority') return ((t.priority || '').toString().toUpperCase()) === ((groupValue as string) || '').toUpperCase();
      if (groupBy === 'assignee') return (t.assigneeId || '') === (groupValue as string);
      if (groupBy === 'status') return (t.statusColumn?.id || -1) === (groupValue as number);
      if (groupBy === 'sprint') return (t.sprintId || null) === (groupValue as number);
      return false;
    };
    const matched: Task[] = [];
    const others: Task[] = [];
    tasks.forEach(t => { (isMatch(t) ? matched : others).push(t); });
    return [...matched, ...others];
  }, [tasks, groupBy, groupValue]);

  const clearAllFilters = () => {
    setFilters({ q: '', priorities: [], assigneeIds: [], columnIds: [], sprintId: undefined, onlyActiveSprint: false, includeArchived: false });
    setPage(0);
    appliedFiltersRef.current = null;
    fetchTasks(null);
  };

  const toggleTaskSelection = (taskId: number) => {
    setSelectedTasks(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
  };

  const toggleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(t => t.id));
    }
  };

  const bulkAssign = async (assigneeId: string) => {
    if (selectedTasks.length === 0) return;
    try {
      await Promise.all(selectedTasks.map(taskId => handleAssignMember(taskId, assigneeId)));
      toast.success(t('TasksAssigned', { count: selectedTasks.length }), { autoClose: 2000 });
      setSelectedTasks([]);
    } catch {
      toast.error(t('FailedToAssignTasks'));
    }
  };

  const getTaskKey = (task: Task) => {
    const prefix = projectId?.substring(0, 4).toUpperCase() || 'PROJ';
    return `${prefix}-${task.id}`;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priorities.length) count += filters.priorities.length;
    if (filters.assigneeIds.length) count += filters.assigneeIds.length;
    if (filters.columnIds.length) count += filters.columnIds.length;
    if (typeof filters.sprintId !== 'undefined' || filters.onlyActiveSprint) count += 1;
    if (filters.includeArchived) count += 1;
    return count;
  };

  const exportToCSV = () => {
    const headers = [t('Key'), t('Task'), t('Status'), t('Priority'), t('Assignee'), t('DueDate'), t('Updated')];
    const rows = tasks.map(task => [
      getTaskKey(task),
      task.title,
      task.statusColumn?.name || t('NoStatus'),
      task.priority?.toUpperCase() === 'HIGH' ? t('PriorityHigh') :
      task.priority?.toUpperCase() === 'MEDIUM' ? t('PriorityMedium') :
      task.priority?.toUpperCase() === 'LOW' ? t('PriorityLow') :
      task.priority,
      getMemberInfo(task.assigneeId)?.displayName || t('Unassigned'),
      formatDate(task.dueDate),
      formatDate(task.updatedAt)
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${projectId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('ExportedSuccessfully'), { autoClose: 1500 });
  };

  return (
    <React.Fragment>
      <Row>
        <Col lg={12}>
          <Row className="align-items-center mb-3">
            <Col md={4}>
              <InputGroup>
                <InputGroupText>
                  <i className="ri-search-line"></i>
                </InputGroupText>
                <Input type="text" placeholder={t('SearchTasksPlaceholder')} value={filters.q} onChange={(e) => onChangeQ(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={8} className="text-end">
              <div className="d-flex align-items-center justify-content-end gap-2 flex-wrap">
                <UncontrolledDropdown>
                  <DropdownToggle caret color={filters.assigneeIds.length ? 'info' : 'light'} size="sm">Assignee</DropdownToggle>
                  <DropdownMenu end style={{ minWidth: '280px', maxHeight: '280px', overflowY: 'auto' }}>
                    <DropdownItem onClick={() => setFilters(prev => ({ ...prev, assigneeIds: [] }))} active={filters.assigneeIds.length === 0}>All</DropdownItem>
                    <DropdownItem divider />
                    {projectMembers.map(m => (
                      <DropdownItem key={m.userId} onClick={() => toggleAssignee(m.userId)} active={filters.assigneeIds.includes(m.userId)}>{m.displayName || m.email}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </UncontrolledDropdown>

                <UncontrolledDropdown>
                  <DropdownToggle caret color={filters.priorities.length ? 'info' : 'light'} size="sm">Priority</DropdownToggle>
                  <DropdownMenu end style={{ minWidth: '220px' }}>
                    <DropdownItem onClick={() => setFilters(prev => ({ ...prev, priorities: [] }))} active={filters.priorities.length === 0}>All</DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem onClick={() => togglePriority('HIGH')} active={filters.priorities.includes('HIGH')}>HIGH</DropdownItem>
                    <DropdownItem onClick={() => togglePriority('MEDIUM')} active={filters.priorities.includes('MEDIUM')}>MEDIUM</DropdownItem>
                    <DropdownItem onClick={() => togglePriority('LOW')} active={filters.priorities.includes('LOW')}>LOW</DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>

                <UncontrolledDropdown>
                  <DropdownToggle caret color={filters.columnIds.length ? 'info' : 'light'} size="sm">Status</DropdownToggle>
                  <DropdownMenu end style={{ minWidth: '260px', maxHeight: '280px', overflowY: 'auto' }}>
                    <DropdownItem onClick={() => setFilters(prev => ({ ...prev, columnIds: [] }))} active={filters.columnIds.length === 0}>All</DropdownItem>
                    <DropdownItem divider />
                    {columns.map(c => (
                      <DropdownItem key={c.id} onClick={() => toggleColumn(c.id)} active={filters.columnIds.includes(c.id)}>{c.name}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </UncontrolledDropdown>

                <UncontrolledDropdown>
                  <DropdownToggle caret color={(typeof filters.sprintId !== 'undefined' || filters.onlyActiveSprint) ? 'info' : 'light'} size="sm">Sprint</DropdownToggle>
                  <DropdownMenu end style={{ minWidth: '240px' }}>
                    <DropdownItem onClick={() => setSprint(undefined)} active={typeof filters.sprintId === 'undefined'}>None</DropdownItem>
                    <DropdownItem divider />
                    {sprints.map(s => (
                      <DropdownItem key={s.id} onClick={() => setSprint(s.id)} active={filters.sprintId === s.id}>{s.name}</DropdownItem>
                    ))}
                    <DropdownItem divider />
                    <DropdownItem onClick={toggleOnlyActiveSprint} active={filters.onlyActiveSprint}>Only Active Sprint</DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>

                <Button color={filters.includeArchived ? 'info' : 'light'} size="sm" onClick={toggleIncludeArchived}>Archived</Button>

                <UncontrolledDropdown>
                  <DropdownToggle caret color={groupBy !== 'none' && typeof groupValue !== 'undefined' ? 'info' : 'light'} size="sm">Group By</DropdownToggle>
                  <DropdownMenu end style={{ minWidth: '220px' }}>
                    <DropdownItem onClick={() => { setGroupBy('none'); setGroupValue(undefined); }} active={groupBy === 'none'}>None</DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem onClick={() => { setGroupBy('priority'); setGroupValue(undefined); }} active={groupBy === 'priority'}>Priority</DropdownItem>
                    <DropdownItem onClick={() => { setGroupBy('status'); setGroupValue(undefined); }} active={groupBy === 'status'}>Status</DropdownItem>
                    <DropdownItem onClick={() => { setGroupBy('assignee'); setGroupValue(undefined); }} active={groupBy === 'assignee'}>Assignee</DropdownItem>
                    <DropdownItem onClick={() => { setGroupBy('sprint'); setGroupValue(undefined); }} active={groupBy === 'sprint'}>Sprint</DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>

                {groupBy === 'priority' && (
                  <UncontrolledDropdown>
                    <DropdownToggle caret color={typeof groupValue !== 'undefined' ? 'info' : 'light'} size="sm">Group Value</DropdownToggle>
                    <DropdownMenu end style={{ minWidth: '220px' }}>
                      <DropdownItem onClick={() => setGroupValue(undefined)} active={typeof groupValue === 'undefined'}>None</DropdownItem>
                      <DropdownItem divider />
                      <DropdownItem onClick={() => setGroupValue('HIGH')} active={groupValue === 'HIGH'}>HIGH</DropdownItem>
                      <DropdownItem onClick={() => setGroupValue('MEDIUM')} active={groupValue === 'MEDIUM'}>MEDIUM</DropdownItem>
                      <DropdownItem onClick={() => setGroupValue('LOW')} active={groupValue === 'LOW'}>LOW</DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                )}

                {groupBy === 'status' && (
                  <UncontrolledDropdown>
                    <DropdownToggle caret color={typeof groupValue !== 'undefined' ? 'info' : 'light'} size="sm">Group Value</DropdownToggle>
                    <DropdownMenu end style={{ minWidth: '260px', maxHeight: '280px', overflowY: 'auto' }}>
                      <DropdownItem onClick={() => setGroupValue(undefined)} active={typeof groupValue === 'undefined'}>None</DropdownItem>
                      <DropdownItem divider />
                      {columns.map(c => (
                        <DropdownItem key={c.id} onClick={() => setGroupValue(c.id)} active={groupValue === c.id}>{c.name}</DropdownItem>
                      ))}
                    </DropdownMenu>
                  </UncontrolledDropdown>
                )}

                {groupBy === 'assignee' && (
                  <UncontrolledDropdown>
                    <DropdownToggle caret color={typeof groupValue !== 'undefined' ? 'info' : 'light'} size="sm">Group Value</DropdownToggle>
                    <DropdownMenu end style={{ minWidth: '280px', maxHeight: '280px', overflowY: 'auto' }}>
                      <DropdownItem onClick={() => setGroupValue(undefined)} active={typeof groupValue === 'undefined'}>None</DropdownItem>
                      <DropdownItem divider />
                      {projectMembers.map(m => (
                        <DropdownItem key={m.userId} onClick={() => setGroupValue(m.userId)} active={groupValue === m.userId}>{m.displayName || m.email}</DropdownItem>
                      ))}
                    </DropdownMenu>
                  </UncontrolledDropdown>
                )}

                {groupBy === 'sprint' && (
                  <UncontrolledDropdown>
                    <DropdownToggle caret color={typeof groupValue !== 'undefined' ? 'info' : 'light'} size="sm">Group Value</DropdownToggle>
                    <DropdownMenu end style={{ minWidth: '240px' }}>
                      <DropdownItem onClick={() => setGroupValue(undefined)} active={typeof groupValue === 'undefined'}>None</DropdownItem>
                      <DropdownItem divider />
                      {sprints.map(s => (
                        <DropdownItem key={s.id} onClick={() => setGroupValue(s.id)} active={groupValue === s.id}>{s.name}</DropdownItem>
                      ))}
                    </DropdownMenu>
                  </UncontrolledDropdown>
                )}

                <Button color="danger" size="sm" outline onClick={clearAllFilters}><i className="ri-close-line me-1"></i>Clear</Button>
                <Button color="light" size="sm" onClick={exportToCSV} title="Export to CSV">
                  <i className="ri-download-line"></i>
                </Button>

                <Button color="primary" size="sm" onClick={() => setShowCreateModal(true)}>
                  <i className="ri-add-line me-1"></i>
                  {t('CreateTask')}
                </Button>
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xl={3} md={6}>
              <Card className="card-animate">
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <p className="text-uppercase fw-medium text-muted mb-0">{t('TotalTasks')}</p>
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
                      <p className="text-uppercase fw-medium text-muted mb-0">{t('HighPriority')}</p>
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
                      <p className="text-uppercase fw-medium text-muted mb-0">{t('Assigned')}</p>
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
                      <p className="text-uppercase fw-medium text-muted mb-0">{t('Unassigned')}</p>
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

          {selectedTasks.length > 0 && (
            <Card className="bg-primary-subtle mb-3">
              <CardBody className="py-2">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <strong>{selectedTasks.length}</strong> {selectedTasks.length === 1 ? t('Task') : t('Tasks')} {t('Selected')}
                  </div>
                  <div className="d-flex gap-2">
                    <UncontrolledDropdown>
                      <DropdownToggle caret color="primary" size="sm">
                        <i className="ri-user-add-line me-1"></i>{t('Assign')}
                      </DropdownToggle>
                      <DropdownMenu end>
                        {projectMembers.map(m => (
                          <DropdownItem key={m.userId} onClick={() => bulkAssign(m.userId)}>
                            {m.displayName || m.email}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </UncontrolledDropdown>
                    <Button color="secondary" size="sm" outline onClick={() => setSelectedTasks([])}>
                      <i className="ri-close-line"></i> {t('Clear')}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <div className="mb-2">
                <span className="text-muted">{t('Total')} {totalElements}</span>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="primary" />
                  <div className="mt-2 text-muted">{t('LoadingTasks')}</div>
                </div>
              ) : error ? (
                <div className="text-center py-5">
                  <div className="text-danger">{error}</div>
                  <Button color="primary" size="sm" onClick={() => fetchTasks(appliedFiltersRef.current)}>{t('Retry')}</Button>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-5">
                  <div className="avatar-md mx-auto mb-3">
                    <div className="avatar-title bg-light text-muted rounded-circle fs-1">
                      <i className="ri-inbox-line"></i>
                    </div>
                  </div>
                  <h5 className="text-muted">{t('NoTasksFound')}</h5>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle table-nowrap mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '40px' }}>
                          <Input type="checkbox" checked={selectedTasks.length === tasks.length && tasks.length > 0} onChange={toggleSelectAll} />
                        </th>
                        <th style={{ width: '100px' }}>{t('Key')}</th>
                        <th className="cursor-pointer" onClick={() => handleSort('title')}>{t('Task')} {getSortIcon('title')}</th>
                        <th className="cursor-pointer" onClick={() => handleSort('statusColumn')}>{t('Status')} {getSortIcon('statusColumn')}</th>
                        <th className="cursor-pointer" onClick={() => handleSort('priority')}>{t('Priority')} {getSortIcon('priority')}</th>
                        <th>{t('Assignee')}</th>
                        <th className="cursor-pointer" onClick={() => handleSort('dueDate')}>{t('DueDate')} {getSortIcon('dueDate')}</th>
                        <th className="cursor-pointer" onClick={() => handleSort('updatedAt')}>{t('Updated')} {getSortIcon('updatedAt')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayTasks.map(task => {
                        const member = getMemberInfo(task.assigneeId);
                        const sprint = sprints.find(s => s.id === task.sprintId);
                        return (
                          <tr key={task.id} className={selectedTasks.includes(task.id) ? 'table-active' : ''}>
                            <td>
                              <Input type="checkbox" checked={selectedTasks.includes(task.id)} onChange={() => toggleTaskSelection(task.id)} />
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border">{getTaskKey(task)}</span>
                            </td>
                            <td>
                              <div className="cursor-pointer" onClick={() => { setSelectedTask(task); setShowDetailModal(true); }}>
                                <h6 className="mb-1 fw-semibold text-primary">{task.title}</h6>
                                {task.description && viewDensity === 'comfortable' && (
                                  <p className="text-muted mb-0 text-truncate" style={{ maxWidth: '300px' }}>{task.description}</p>
                                )}
                                {(task.tags || sprint) && viewDensity === 'comfortable' && (
                                  <div className="d-flex gap-1 mt-1 flex-wrap">
                                    {task.tags && task.tags.split(',').map((tag, i) => (
                                      <span key={i} className="badge bg-light text-dark border" style={{ fontSize: '10px' }}>
                                        <i className="ri-price-tag-3-line"></i> {tag.trim()}
                                      </span>
                                    ))}
                                    {sprint && (
                                      <span className="badge bg-info-subtle text-info border border-info" style={{ fontSize: '10px' }}>
                                        <i className="ri-sprint-line"></i> {sprint.name}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <Badge color={getStatusColor(task.statusColumn?.name)} className="fs-11">
                                {!task.statusColumn?.name ? t('NoStatus') :
                                 task.statusColumn.name.toUpperCase() === 'TO DO' ? t('StatusTodo') :
                                 task.statusColumn.name.toUpperCase() === 'IN PROGRESS' ? t('StatusInProgress') :
                                 task.statusColumn.name.toUpperCase() === 'IN REVIEW' ? t('StatusInReview') :
                                 task.statusColumn.name.toUpperCase() === 'DONE' ? t('StatusDone') :
                                 task.statusColumn.name}
                              </Badge>
                            </td>
                            <td>
                              <Badge color={getPriorityColor(task.priority as any)} className="fs-11">
                                {task.priority?.toUpperCase() === 'HIGH' ? t('PriorityHigh') :
                                 task.priority?.toUpperCase() === 'MEDIUM' ? t('PriorityMedium') :
                                 task.priority?.toUpperCase() === 'LOW' ? t('PriorityLow') :
                                 (task.priority || '').toString().toUpperCase()}
                              </Badge>
                            </td>
                            <td>
                              <Dropdown isOpen={openAssigneeDropdown === task.id} toggle={() => setOpenAssigneeDropdown(openAssigneeDropdown === task.id ? null : task.id)}>
                                <DropdownToggle className="btn btn-light btn-sm" caret>
                                  {member ? member.displayName : t('Unassigned')}
                                </DropdownToggle>
                                <DropdownMenu end>
                                  <DropdownItem onClick={() => handleAssignMember(task.id, '')}>{t('Unassigned')}</DropdownItem>
                                  <DropdownItem divider />
                                  {projectMembers.map(m => (
                                    <DropdownItem key={m.userId} onClick={() => handleAssignMember(task.id, m.userId)} active={m.userId === task.assigneeId}>{m.displayName || m.email}</DropdownItem>
                                  ))}
                                </DropdownMenu>
                              </Dropdown>
                            </td>
                            <td>
                              {task.dueDate ? (
                                <span className={new Date(task.dueDate) < new Date() ? 'text-danger fw-medium' : ''}>
                                  {formatDate(task.dueDate)}
                                  {new Date(task.dueDate) < new Date() && (<i className="ri-error-warning-line ms-1"></i>)}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="text-muted">{formatDate(task.updatedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}

              <div className="d-flex align-items-center justify-content-between mt-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted">{t('Page')} {page + 1} / {Math.max(totalPages, 1)}</span>
                  <Button color="light" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(p - 1, 0))}>{t('Prev')}</Button>
                  <Button color="light" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>{t('Next')}</Button>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted">{t('Size')}</span>
                  <UncontrolledDropdown>
                    <DropdownToggle caret color="light" size="sm">{size}</DropdownToggle>
                    <DropdownMenu end>
                      {[10, 20, 50].map(s => (<DropdownItem key={s} onClick={() => { setSize(s); setPage(0); }}>{s}</DropdownItem>))}
                    </DropdownMenu>
                  </UncontrolledDropdown>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {showCreateModal && (
        <CreateTaskModal show={showCreateModal} onHide={() => setShowCreateModal(false)} projectId={projectId!} sprintId={null} onSuccess={() => { appliedFiltersRef.current = { ...filters }; fetchTasks(appliedFiltersRef.current); setShowCreateModal(false); }} />
      )}
      {showDetailModal && selectedTask && (
        <TaskDetailModal show={showDetailModal} onHide={() => { setShowDetailModal(false); setSelectedTask(null); }} task={selectedTask} projectId={projectId!} onUpdate={() => { appliedFiltersRef.current = { ...filters }; fetchTasks(appliedFiltersRef.current); }} />
      )}

      <Modal isOpen={showFiltersModal} toggle={() => setShowFiltersModal(false)} size="lg">
        <ModalHeader toggle={() => setShowFiltersModal(false)}>
          <i className="ri-filter-3-line me-2"></i>
          {t('Filters')}
        </ModalHeader>
        <ModalBody>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label className="fw-semibold">{t('Priority')}</Label>
                <div className="d-flex flex-column gap-2">
                  {['HIGH', 'MEDIUM', 'LOW'].map(p => (
                    <div key={p} className="form-check">
                      <Input
                        type="checkbox"
                        id={`priority-${p}`}
                        checked={filters.priorities.includes(p)}
                        onChange={() => togglePriority(p as any)}
                      />
                      <Label check htmlFor={`priority-${p}`}>
                        <Badge color={getPriorityColor(p)} className="me-2">{p}</Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </FormGroup>

              <FormGroup className="mt-3">
                <Label className="fw-semibold">{t('Status')}</Label>
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {columns.map(c => (
                    <div key={c.id} className="form-check">
                      <Input
                        type="checkbox"
                        id={`status-${c.id}`}
                        checked={filters.columnIds.includes(c.id)}
                        onChange={() => toggleColumn(c.id)}
                      />
                      <Label check htmlFor={`status-${c.id}`}>{c.name}</Label>
                    </div>
                  ))}
                </div>
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label className="fw-semibold">{t('Assignee')}</Label>
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {projectMembers.map(m => (
                    <div key={m.userId} className="form-check">
                      <Input
                        type="checkbox"
                        id={`assignee-${m.userId}`}
                        checked={filters.assigneeIds.includes(m.userId)}
                        onChange={() => toggleAssignee(m.userId)}
                      />
                      <Label check htmlFor={`assignee-${m.userId}`}>{m.displayName || m.email}</Label>
                    </div>
                  ))}
                </div>
              </FormGroup>

              <FormGroup className="mt-3">
                <Label className="fw-semibold">{t('Sprint')}</Label>
                <Input type="select" value={filters.sprintId || ''} onChange={(e) => setSprint(e.target.value ? parseInt(e.target.value) : undefined)}>
                  <option value="">{t('NoSpecificSprint')}</option>
                  {sprints.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Input>
                <div className="form-check mt-2">
                  <Input
                    type="checkbox"
                    id="only-active-sprint"
                    checked={filters.onlyActiveSprint}
                    onChange={toggleOnlyActiveSprint}
                  />
                  <Label check htmlFor="only-active-sprint">{t('OnlyActiveSprint')}</Label>
                </div>
              </FormGroup>

              <FormGroup className="mt-3">
                <div className="form-check">
                  <Input
                    type="checkbox"
                    id="include-archived"
                    checked={filters.includeArchived}
                    onChange={toggleIncludeArchived}
                  />
                  <Label check htmlFor="include-archived">{t('IncludeArchivedTasks')}</Label>
                </div>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" outline onClick={clearAllFilters}>
            <i className="ri-close-line me-1"></i>
            {t('ClearAll')}
          </Button>
          <Button color="primary" onClick={() => setShowFiltersModal(false)}>
            <i className="ri-check-line me-1"></i>
            {t('Apply')}
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default TaskListView;
