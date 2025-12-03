import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Spinner, Card, CardBody, Badge, Progress } from "reactstrap";
import { useQuery } from "@tanstack/react-query";
import { getProjectById, Project } from "../../apiCaller/projects";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { getSession, SessionInfo } from "../../apiCaller/session";
import { getBoardByProjectId, BoardResponse } from "../../apiCaller/boards";
import { taskAPI } from "../../apiCaller/backlogSprint";
import { getEpicsByProject, EpicDto } from "../../apiCaller/epics";
import { getProjectMembers, ProjectMember } from "../../apiCaller/projectMembers";

interface Task {
    id: number;
    title: string;
    description?: string;
    projectId: string;
    sprintId?: number | null;
    assignedTo?: string;
    assigneeId?: string | null;
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
    epicId?: number | null;
    epicTitle?: string | null;
}

const OverviewTab = () => {
    const { t } = useTranslation();
    const { projectId } = useParams<{ projectId: string }>();

    // Fetch project
    const {
        data: project,
        isLoading: isLoadingProject,
        error: projectError,
    } = useQuery<Project>({
        queryKey: ["project", projectId],
        queryFn: () => getProjectById(projectId!),
        enabled: !!projectId,
        retry: 1,
        meta: {
            onError: () => toast.error(t("FailedToLoadProjectDetails")),
        },
    });

    // Fetch session (current user)
    const {
        data: session,
        isLoading: isLoadingSession,
    } = useQuery<SessionInfo>({
        queryKey: ["session"],
        queryFn: () => getSession(),
        retry: 1,
    });

    // Fetch board to get activeSprintId
    const {
        data: board,
        isLoading: isLoadingBoard,
    } = useQuery<BoardResponse>({
        queryKey: ["board", projectId],
        queryFn: () => getBoardByProjectId(projectId!),
        enabled: !!projectId,
        retry: 1,
    });

    // Fetch my tasks
    const {
        data: tasksResponse,
        isLoading: isLoadingTasks,
        error: tasksError,
    } = useQuery<any>({
        queryKey: ["myTasks", projectId, board?.activeSprintId],
        queryFn: () => taskAPI.listMyTasks(projectId!, board?.activeSprintId || undefined),
        enabled: !!projectId && !!board?.activeSprintId,
        retry: 1,
        meta: {
            onError: () => toast.error(t("FailedToLoadTasks")),
        },
    });

    const {
        data: metrics,
        isLoading: isLoadingMetrics,
    } = useQuery<Record<string, number>>({
        queryKey: ["metrics7d", projectId],
        queryFn: () => taskAPI.getMetricsLast7Days(projectId!),
        enabled: !!projectId,
        retry: 1,
    });

    const { data: statusDist } = useQuery<Record<string, number>>({
        queryKey: ["statusDistribution", projectId],
        queryFn: () => taskAPI.getStatusDistribution(projectId!),
        enabled: !!projectId,
        retry: 1,
    });

    // Fetch all tasks by project (for Epic Progress)
    const { data: allTasksResp } = useQuery<any>({
        queryKey: ["tasksByProject", projectId],
        queryFn: () => taskAPI.listByProject(projectId!, true),
        enabled: !!projectId,
        retry: 1,
    });

    const { data: priorityDist } = useQuery<Record<string, number>>({
        queryKey: ["priorityDistribution", projectId],
        queryFn: () => taskAPI.getPriorityDistribution(projectId!),
        enabled: !!projectId,
        retry: 1,
    });

    const { data: workloadDist } = useQuery<Record<string, number>>({
        queryKey: ["workloadDistribution", projectId],
        queryFn: () => taskAPI.getWorkloadDistribution(projectId!),
        enabled: !!projectId,
        retry: 1,
    });

    const { data: members } = useQuery<ProjectMember[]>({
        queryKey: ["projectMembers", projectId],
        queryFn: () => getProjectMembers(projectId!),
        enabled: !!projectId,
        retry: 1,
    });

    const { data: recentLogs } = useQuery<any[]>({
        queryKey: ["recentLogs", projectId],
        queryFn: () => taskAPI.getRecentLogs(projectId!),
        enabled: !!projectId,
        retry: 1,
    });

    // Fetch epics for accurate epic names
    const { data: epicsPage } = useQuery<any>({
        queryKey: ["epics", projectId],
        queryFn: () => getEpicsByProject(projectId!),
        enabled: !!projectId,
        retry: 1,
    });

    // Debug logs
    React.useEffect(() => {
        console.log('📊 Status Distribution:', statusDist);
    }, [statusDist]);

    // Normalize task
    const normalizeTask = (task: any): Task => {
        return {
            ...task,
            assignedTo: task.assignedTo || task.assigneeId || undefined,
            assigneeId: task.assigneeId || task.assignedTo || null,
            sprintId: typeof task.sprintId === 'string'
                ? parseInt(task.sprintId)
                : (task.sprintId ?? null),
            epicId: typeof task.epicId === 'string' ? parseInt(task.epicId) : (task.epicId ?? null),
            epicTitle: task.epicTitle || null,
        };
    };

    const dynamicColors = [
        "#0d6efd", // blue
        "#6c757d", // gray
        "#198754", // green
        "#ffc107", // yellow
        "#dc3545", // red
        "#20c997", // teal
        "#6610f2", // purple
        "#fd7e14", // orange
    ];

    const statusColorMap = useMemo(() => {
        const m = new Map<string, string>();
        const cols = board?.columns || [];
        cols.forEach(c => {
            const key = (c.name || '').toLowerCase();
            const val = (c.color || '').trim();
            if (key) m.set(key, val || m.get(key) || '');
        });
        return m;
    }, [board]);

    const getStatusColor = (name: string) => {
        const key = (name || '').toLowerCase();
        const fromDb = statusColorMap.get(key);
        if (fromDb && fromDb.length >= 4) return fromDb;
        if (key.includes('to do') || key === 'todo') return '#6c757d';
        if (key.includes('in progress') || key.includes('progress')) return '#0d6efd';
        if (key.includes('done') || key.includes('completed')) return '#198754';
        return '#0d6efd';
    };

    const epicTitleMap = useMemo(() => {
        const map = new Map<number, string>();
        const list: EpicDto[] = (epicsPage?.content || epicsPage?.data?.content || []);
        list.forEach(e => map.set(e.id, e.title));
        return map;
    }, [epicsPage]);

    const resolvePriorityColor = (name: string) => {
        const n = (name || '').toLowerCase();
        if (n.includes('highest')) return '#dc3545';
        if (n.includes('high')) return '#fd7e14';
        if (n.includes('medium')) return '#ffc107';
        if (n.includes('low')) return '#20c997';
        return '#0d6efd';
    };

    const renderPriorityBarChart = (dist: Record<string, number>) => {
        const order = ["Low", "Medium", "High", "Highest"];
        const values = order.map(k => dist[k] || 0);
        const maxValRaw = Math.max(0, ...values);
        const maxGrid = Math.max(10, Math.ceil(maxValRaw / 10) * 10);
        const gridStep = 10;
        const chartWidth = 480;
        const chartHeight = 240;
        const margin = { top: 10, right: 16, bottom: 28, left: 28 };
        const innerW = chartWidth - margin.left - margin.right;
        const innerH = chartHeight - margin.top - margin.bottom;
        const barGap = 16;
        const axisGapX = 12;
        const barW = Math.floor((innerW - axisGapX - barGap * (order.length - 1)) / order.length);

        const yScale = (v: number) => (v / maxGrid) * innerH;
        const yTicks: number[] = [];
        for (let t = 0; t <= maxGrid; t += gridStep) yTicks.push(t);

        return (
            <svg
                width={chartWidth}
                height={chartHeight}
                style={{ minWidth: chartWidth, minHeight: chartHeight }}
            >

                <g transform={`translate(${margin.left},${margin.top})`}>
                    <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#adb5bd" strokeWidth={1} />
                    <line x1={0} y1={0} x2={0} y2={innerH} stroke="#adb5bd" strokeWidth={1} />

                    {yTicks.map((t) => {
                        const y = innerH - yScale(t);
                        return (
                            <g key={`grid-${t}`}>
                                <line x1={0} y1={y} x2={innerW} y2={y} stroke="#e9ecef" strokeDasharray="3 3" />
                                <text x={-6} y={y} textAnchor="end" dominantBaseline="middle" fill="#6c757d" fontSize={11}>{t}</text>
                            </g>
                        );
                    })}

                    {order.map((label, i) => {
                        const val = dist[label] || 0;
                        const h = yScale(val);
                        const x = axisGapX + i * (barW + barGap);
                        const y = innerH - h;
                        const color = resolvePriorityColor(label);
                        return (
                            <g key={`bar-${label}`} transform={`translate(${x},${y})`}>
                                <rect width={barW} height={h} fill={color} rx={4} ry={4} />
                                <text
                                    x={barW / 2}
                                    y={h > 22 ? h / 2 : -8}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={h > 22 ? '#fff' : '#212529'}
                                    fontSize={13}
                                    fontWeight={600}
                                >
                                    {val}
                                </text>
                                <text x={barW / 2} y={h + 20} textAnchor="middle" fill="#495057" fontSize={12}>{label}</text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        );
    };

    const myTasks = useMemo(() => {
        if (!tasksResponse?.content || !board?.activeSprintId) {
            return [];
        }

        let rawTaskList: any[] = [];
        if (Array.isArray(tasksResponse.content)) {
            rawTaskList = tasksResponse.content;
        } else if (tasksResponse.content && typeof tasksResponse.content === 'object') {
            if ('content' in tasksResponse.content && Array.isArray((tasksResponse.content as any).content)) {
                rawTaskList = (tasksResponse.content as any).content;
            }
        }

        const normalizedTasks = rawTaskList.map(normalizeTask);

        const filtered = normalizedTasks.filter((task: Task) => {
            const projectMatch = task.projectId === projectId;
            const sprintMatch = task.sprintId === board.activeSprintId;
            return projectMatch && sprintMatch;
        });

        return filtered;
    }, [tasksResponse, board, projectId]);

    const isLoading = isLoadingProject || isLoadingSession || isLoadingBoard || isLoadingTasks || isLoadingMetrics;

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2 text-muted">{t("LoadingProjectDetails")}</p>
            </div>
        );
    }

    if (projectError || !project) {
        return (
            <div className="alert alert-danger text-center my-4">
                <i className="ri-error-warning-line me-2"></i>
                {t("ProjectNotFound")}
            </div>
        );
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return 'danger';
            case 'MEDIUM':
                return 'warning';
            case 'LOW':
                return 'info';
            default:
                return 'secondary';
        }
    };

    const resolveCount = (keys: string[]) => {
        for (const k of keys) {
            const v = (statusDist as any)?.[k];
            if (typeof v === 'number') return v as number;
        }
        return 0;
    };

    // FIXED: Proper pie chart rendering - Even Larger
    const renderDynamicPie = (dist: Record<string, number>) => {
        if (!dist || Object.keys(dist).length === 0) {
            return (
                <div className="d-flex align-items-center justify-content-center" style={{ width: 300, height: 300 }}>
                    <div className="text-center text-muted">
                        <i className="ri-pie-chart-line fs-1"></i>
                        <div className="small mt-2">{t("NoData")}</div>
                    </div>
                </div>
            );
        }

        const entries = Object.entries(dist);
        const total = entries.reduce((sum, [, val]) => sum + val, 0);
        const size = 300;
        const strokeWidth = 55;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;

        let offset = 0;

        return (
            <svg  viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", maxWidth: "200px", maxHeight: "200px" }}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e9ecef"
                    strokeWidth={strokeWidth}
                />

                {entries.map(([name, value]) => {
                    if (value === 0) return null;

                    const length = (value / total) * circumference;
                    const color = getStatusColor(name);

                    const circle = (
                        <circle
                            key={name}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${length} ${circumference}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="butt"
                        />
                    );

                    offset += length;
                    return circle;
                })}

                {/* TOTAL NUMBER */}
                <text
                    x={size / 2}
                    y={size / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                        fontSize: '54px',
                        fontWeight: 'bold',
                        fill: '#212529',
                        transform: 'rotate(90deg)',
                        transformOrigin: 'center'
                    }}
                >
                    {total}
                </text>
            </svg>
        );
    };

    return (
        <div className="px-4 py-4">
            <Card className="mb-3">
                <Row className="g-3">
                    <Col xs={12} sm={6} md={3}>
                        <div className="text-center border rounded p-3">
                            <div className="fs-3 fw-bold text-success">{metrics?.completed ?? 0}</div>
                            <div className="text-muted">{t("Completed7d")}</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <div className="text-center border rounded p-3">
                            <div className="fs-3 fw-bold text-primary">{metrics?.updated ?? 0}</div>
                            <div className="text-muted">{t("Updated7d")}</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <div className="text-center border rounded p-3">
                            <div className="fs-3 fw-bold text-info">{metrics?.created ?? 0}</div>
                            <div className="text-muted">{t("Created7d")}</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <div className="text-center border rounded p-3">
                            <div className="fs-3 fw-bold text-warning">{(metrics?.dueSoon ?? (metrics as any)?.due_soon) ?? 0}</div>
                            <div className="text-muted">{t("DueSoon7d")}</div>
                        </div>
                    </Col>
                </Row>
            </Card>
            <Row>
                {/* Left Column: StatusDistribution first, then Epic Progress */}
                <Col md={6}>
                    <Card>
                        <CardBody>
                            <h6 className="fw-bold text-uppercase mb-3">{t("StatusDistribution")}</h6>
                            <div className="d-flex align-items-center justify-content-between gap-3">
                                <div className="vstack gap-3" style={{ minWidth: "180px" }}>
                                    {Object.entries(statusDist || {}).map(([name, value]) => (
                                        <div key={name} className="d-flex align-items-center gap-2">
                                            <span
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    backgroundColor: getStatusColor(name),
                                                    borderRadius: "50%"
                                                }}
                                            ></span>
                                            <span className="text-muted flex-grow-1">{name}</span>
                                            <span className="fw-bold">{value}</span>
                                        </div>
                                    ))}
                                </div>
                                {(() => {
                                    return (
                                        <div className="flex-grow-1 d-flex justify-content-end">
                                            {renderDynamicPie(statusDist || {})}
                                        </div>
                                    );
                                })()}
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="mt-3" style={{ maxHeight: 340 }}>
                        <CardBody>
                            <h5 className="fw-bold text-uppercase mb-1">{t("EpicProgress")}</h5>
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-success">{t('Done')}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-primary">{t('InProgress')}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-secondary">{t('ToDo')}</span>
                                </div>
                            </div>

                            {(() => {
                                const raw = (allTasksResp?.content || (allTasksResp?.data?.content)) || [];
                                const tasks: Task[] = raw.map(normalizeTask);

                                const byEpic = new Map<number, { title: string; done: number; todo: number; other: number; total: number }>();
                                tasks.forEach(taskItem => {
                                    const epicId = (taskItem.epicId ?? -1) as number;
                                    const epicTitle = epicId === -1
                                        ? t('NoEpic')
                                        : (epicTitleMap.get(epicId) || taskItem.epicTitle || `Epic #${epicId}`);
                                    const status = (taskItem.statusColumn?.name || '').toLowerCase();
                                    const rec = byEpic.get(epicId) || { title: epicTitle, done: 0, todo: 0, other: 0, total: 0 };
                                    rec.total += 1;
                                    if (status.includes('done') || status.includes('completed')) rec.done += 1;
                                    else if (status.includes('to do') || status === 'todo') rec.todo += 1;
                                    else rec.other += 1;
                                    rec.title = epicTitle;
                                    byEpic.set(epicId, rec);
                                });

                                const items = Array.from(byEpic.entries()).filter(([id]) => id !== -1);
                                if (items.length === 0) {
                                    return <p className="text-muted mb-0">{t('NoEpics')}</p>;
                                }

                                return (
                                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                                        {items.map(([id, rec]) => {
                                            const donePct = rec.total ? Math.round((rec.done / rec.total) * 100) : 0;
                                            const otherPct = rec.total ? Math.round((rec.other / rec.total) * 100) : 0;
                                            const todoPct = Math.max(0, 100 - donePct - otherPct);
                                            return (
                                                <div key={id} className="mb-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <span className="fw-semibold">{rec.title}</span>
                                                        <span className="text-muted small">{rec.total} {t('Tasks')}</span>
                                                    </div>
                                                    <Progress multi style={{ height: 18 }}>
                                                        {donePct > 0 && (
                                                            <Progress bar color="success" value={donePct}>{donePct}%</Progress>
                                                        )}
                                                        {otherPct > 0 && (
                                                            <Progress bar color="primary" value={otherPct}>{otherPct}%</Progress>
                                                        )}
                                                        {todoPct > 0 && (
                                                            <Progress bar color="secondary" value={todoPct}>{todoPct}%</Progress>
                                                        )}
                                                    </Progress>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </CardBody>
                    </Card>
                    <Card className="mt-3" style={{ maxHeight: 340 }}>
                        <CardBody>
            <h6 className="fw-bold text-uppercase mb-3">{t("PriorityDistribution")}</h6>

            <div className="d-flex align-items-center justify-content-center" style={{ height: 260, minHeight: 260 }}>
                {(() => {
                    const src = priorityDist || {};
                    const dist: Record<string, number> = {
                        Low: Number(src['Low'] ?? src['low'] ?? src['LOW'] ?? 0),
                        Medium: Number(src['Medium'] ?? src['medium'] ?? src['MEDIUM'] ?? 0),
                        High: Number(src['High'] ?? src['high'] ?? src['HIGH'] ?? 0),
                        Highest: Number(src['Highest'] ?? src['highest'] ?? src['HIGHEST'] ?? 0),
                    };
                    return renderPriorityBarChart(dist);
                })()}
            </div>
                        </CardBody>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card>
                        <CardBody>
                            <h5 className="fw-bold text-uppercase mb-3">{t("RecentLogs")}</h5>
                            {(() => {
                                const list = Array.isArray(recentLogs) ? recentLogs.slice() : [];
                                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                                if (list.length === 0) return <p className="text-muted mb-0">{t("NoData")}</p>;
                                return (
                                    <div className="vstack gap-3">
                                        {list.map((log: any) => (
                                            <div key={log.logId} className="d-flex flex-column">
                                                <div className="fw-semibold">{String(log.description || '')}</div>
                                                <div className="text-muted small">{new Date(log.createdAt).toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </CardBody>
                    </Card>
                    <Card className="mt-3">
                        <CardBody>
                            <h5 className="fw-bold text-uppercase mb-3">{t("MyTasks")}</h5>

                            {!board?.activeSprintId ? (
                                <p className="text-muted mb-0">
                                    {t("NoActiveSprint")}
                                </p>
                            ) : myTasks.length === 0 ? (
                                <p className="text-muted mb-0">
                                    {t("NoTasksAssigned")}
                                </p>
                            ) : (
                                <div className="vstack gap-2">
                                    {myTasks.map((task: Task) => (
                                        <Card key={task.id} className="border">
                                            <CardBody className="p-3">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 className="mb-0">{task.title}</h6>
                                                    <Badge color={getPriorityColor(task.priority)} className="ms-2">
                                                        {task.priority}
                                                    </Badge>
                                                </div>
                                                {task.description && (
                                                    <p className="text-muted small mb-2">{task.description}</p>
                                                )}
                                                {task.statusColumn && (
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Badge color="light" className="text-dark">
                                                            {task.statusColumn.name}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                    <Card className="mt-3">
                        <CardBody>
                            <h5 className="fw-bold text-uppercase mb-3">{t("TeamWorkload")}</h5>
                            {(() => {
                                const dist = workloadDist || {};
                                const entries = Object.entries(dist);
                                const total = entries.reduce((s, [, v]) => s + Number(v || 0), 0);
                                if (total === 0) {
                                    return <p className="text-muted mb-0">{t("NoData")}</p>;
                                }
                                const nameOf = (uid: string) => {
                                    const m = (members || []).find(mm => mm.userId === uid);
                                    return m?.displayName || uid;
                                };
                                const items = entries
                                    .map(([uid, v]) => ({ uid, count: Number(v || 0), name: nameOf(uid) }))
                                    .sort((a, b) => {
                                        if (a.uid === 'unassigned' && b.uid !== 'unassigned') return -1;
                                        if (b.uid === 'unassigned' && a.uid !== 'unassigned') return 1;
                                        return b.count - a.count;
                                    });
                                return (
                                    <div className="vstack gap-3">
                                        <div className="d-flex align-items-center gap-3 mb-1">
                                            <div className="flex-shrink-0 text-muted small" style={{ minWidth: 160 }}>{t('Assignee') || 'Assignee'}</div>
                                            <div className="flex-grow-1 text-muted small">{t('WorkDistribution') || 'Work Distribution'}</div>
                                        </div>
                                        {items.map(item => {
                                            const pct = Math.round((item.count / total) * 100);
                                            return (
                                                <div key={item.uid} className="d-flex align-items-center gap-3">
                                                    <div className="flex-shrink-0" style={{ minWidth: 160 }}>
                                                        <span className="fw-semibold">{item.name}</span>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="progress" style={{ height: 22 }}>
                                                            <div className="progress-bar bg-primary px-2" role="progressbar" style={{ width: `${pct}%` }} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                                                                {pct}% ({item.count})
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default OverviewTab;
