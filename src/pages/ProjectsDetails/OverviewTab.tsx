import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Spinner, Card, CardBody, Badge } from "reactstrap";
import { useQuery } from "@tanstack/react-query";
import { getProjectById, Project } from "../../apiCaller/projects";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { getSession, SessionInfo } from "../../apiCaller/session";
import { getBoardByProjectId, BoardResponse } from "../../apiCaller/boards";
import { taskAPI } from "../../apiCaller/backlogSprint";

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
            onError: () => toast.error(t("FailedToLoadTasks") || "Failed to load tasks"),
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
                : (task.sprintId ?? null)
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
                        <div className="small mt-2">No data</div>
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

                {entries.map(([name, value], i) => {
                    if (value === 0) return null;

                    const length = (value / total) * circumference;
                    const color = dynamicColors[i % dynamicColors.length];

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
                            <div className="text-muted">Completed (7d)</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <div className="text-center border rounded p-3">
                            <div className="fs-3 fw-bold text-primary">{metrics?.updated ?? 0}</div>
                            <div className="text-muted">Updated (7d)</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <div className="text-center border rounded p-3">
                            <div className="fs-3 fw-bold text-info">{metrics?.created ?? 0}</div>
                            <div className="text-muted">Created (7d)</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <div className="text-center border rounded p-3">
                            <div className="fs-3 fw-bold text-warning">{(metrics?.dueSoon ?? (metrics as any)?.due_soon) ?? 0}</div>
                            <div className="text-muted">Due Soon (7d)</div>
                        </div>
                    </Col>
                </Row>
            </Card>
            <Row>
                {/* Left Column: Summary */}
                <Col md={6}>
                    <Card>
                        <CardBody>
                            <h5 className="fw-bold text-uppercase mb-3">{t("Summary")}</h5>
                            <p className="text-muted">
                                {project.description || t("NoDescriptionProvided")}
                            </p>

                            <ul className="ps-4 vstack gap-2 mb-0">
                                <li>
                                    <strong>{t("ProjectID")}:</strong> {project.id}
                                </li>
                                <li>
                                    <strong>{t("WorkspaceID")}:</strong> {project.workspaceId}
                                </li>
                                <li>
                                    <strong>{t("ColorTheme")}:</strong>{" "}
                                    <span style={{ color: project.color }}>{project.color}</span>
                                </li>
                            </ul>
                        </CardBody>
                    </Card>
                    <Card className="mt-3">
                        <CardBody>
                            <h6 className="fw-bold text-uppercase mb-3">Status Distribution</h6>
                            <div className="d-flex align-items-center justify-content-between gap-3">
                                {/* Legend */}
                                <div className="vstack gap-3" style={{ minWidth: "180px" }}>
                                    {Object.entries(statusDist || {}).map(([name, value], idx) => (
                                        <div key={name} className="d-flex align-items-center gap-2">
                                            <span
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    backgroundColor: dynamicColors[idx % dynamicColors.length],
                                                    borderRadius: "50%"
                                                }}
                                            ></span>

                                            <span className="text-muted flex-grow-1">{name}</span>
                                            <span className="fw-bold">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Pie Chart */}
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
                </Col>

                <Col md={6}>
                    <Card>
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
                </Col>
            </Row>
        </div>
    );
};

export default OverviewTab;