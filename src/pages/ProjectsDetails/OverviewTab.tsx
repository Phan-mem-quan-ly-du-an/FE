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
    assigneeId?: string | null; // Backend might return assigneeId
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

    // Fetch my tasks using the new API endpoint
    // This is more efficient as it only returns tasks assigned to current user
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

    // Debug: Log raw response
    React.useEffect(() => {
        if (tasksResponse) {
            console.log('📥 Raw Tasks Response:', JSON.stringify(tasksResponse, null, 2));
            console.log('📥 Tasks Response Structure:', {
                hasContent: 'content' in tasksResponse,
                hasData: 'data' in tasksResponse,
                keys: Object.keys(tasksResponse),
                contentType: typeof tasksResponse.content,
                isArray: Array.isArray(tasksResponse.content),
                contentLength: Array.isArray(tasksResponse.content) 
                    ? tasksResponse.content.length 
                    : (tasksResponse.content && typeof tasksResponse.content === 'object' && 'length' in tasksResponse.content)
                        ? (tasksResponse.content as any).length || 0
                        : 0
            });
        }
        if (tasksError) {
            console.error('❌ Tasks Error:', tasksError);
        }
    }, [tasksResponse, tasksError]);

    // Debug: Log session and board
    React.useEffect(() => {
        console.log('👤 Session:', {
            session,
            sessionId: session?.id,
            sessionType: typeof session?.id
        });
        console.log('📊 Board:', {
            board,
            activeSprintId: board?.activeSprintId,
            activeSprintIdType: typeof board?.activeSprintId
        });
    }, [session, board]);

    // Normalize task: Backend returns assigneeId, normalize to assignedTo
    const normalizeTask = (task: any): Task => {
        return {
            ...task,
            // Normalize assigneeId to assignedTo for frontend consistency
            assignedTo: task.assignedTo || task.assigneeId || undefined,
            assigneeId: task.assigneeId || task.assignedTo || null,
            // Ensure sprintId is number
            sprintId: typeof task.sprintId === 'string' 
                ? parseInt(task.sprintId) 
                : (task.sprintId ?? null)
        };
    };

    // Process my tasks from API response
    // Note: The API already filters by assignee and sprintId, but we still normalize the data
    const myTasks = useMemo(() => {
        console.log('🔍 Process My Tasks - Initial State:', {
            hasTasksResponse: !!tasksResponse,
            hasContent: !!tasksResponse?.content,
            contentLength: tasksResponse?.content?.length || 0,
            sessionId: session?.id,
            hasBoard: !!board,
            activeSprintId: board?.activeSprintId,
            rawTasksResponse: tasksResponse
        });

        // Early return if dependencies not ready
        if (!tasksResponse?.content || !board?.activeSprintId) {
            console.warn('⚠️ Missing dependencies:', {
                hasTasksResponseContent: !!tasksResponse?.content,
                hasActiveSprintId: !!board?.activeSprintId,
                tasksResponseContent: tasksResponse?.content,
                activeSprintId: board?.activeSprintId
            });
            return [];
        }

        // Extract task list from response - handle different response structures
        let rawTaskList: any[] = [];
        if (Array.isArray(tasksResponse.content)) {
            rawTaskList = tasksResponse.content;
        } else if (tasksResponse.content && typeof tasksResponse.content === 'object') {
            // Check if it's a nested structure
            if ('content' in tasksResponse.content && Array.isArray((tasksResponse.content as any).content)) {
                rawTaskList = (tasksResponse.content as any).content;
            } else if (Array.isArray(tasksResponse.content)) {
                rawTaskList = tasksResponse.content;
            }
        }

        console.log('📦 Raw Task List from API:', {
            count: rawTaskList.length,
            tasks: rawTaskList.map((t: any) => ({
                id: t.id,
                title: t.title,
                assigneeId: t.assigneeId,
                assignedTo: t.assignedTo,
                sprintId: t.sprintId,
                sprintIdType: typeof t.sprintId,
                projectId: t.projectId
            }))
        });

        // Normalize all tasks first
        const normalizedTasks = rawTaskList.map(normalizeTask);

        console.log('🔄 Normalized Tasks:', {
            count: normalizedTasks.length,
            tasks: normalizedTasks.map((t: Task) => ({
                id: t.id,
                title: t.title,
                assignedTo: t.assignedTo,
                assigneeId: t.assigneeId,
                sprintId: t.sprintId,
                projectId: t.projectId
            }))
        });

        // Additional filter: ensure tasks belong to the correct project and sprint
        // (API should already filter, but this is a safety check)
        const filtered = normalizedTasks.filter((task: Task) => {
            // Verify projectId matches
            const projectMatch = task.projectId === projectId;
            
            // Verify sprintId matches
            const taskSprintId = task.sprintId;
            const sprintMatch = taskSprintId === board.activeSprintId;
            
            console.log(`📋 Task #${task.id} "${task.title}":`, {
                projectId: task.projectId,
                expectedProjectId: projectId,
                projectMatch,
                taskSprintId,
                activeSprintId: board.activeSprintId,
                sprintMatch,
                willInclude: projectMatch && sprintMatch
            });
            
            return projectMatch && sprintMatch;
        });

        console.log('🎯 My Tasks Final Result:', {
            totalTasksFromAPI: normalizedTasks.length,
            myTasksCount: filtered.length,
            activeSprintId: board.activeSprintId,
            projectId: projectId,
            filteredTasks: filtered.map(t => ({ 
                id: t.id, 
                title: t.title, 
                assignedTo: t.assignedTo, 
                assigneeId: t.assigneeId,
                sprintId: t.sprintId,
                projectId: t.projectId
            }))
        });

        return filtered;
    }, [tasksResponse, board, projectId, session?.id]);

    const isLoading = isLoadingProject || isLoadingSession || isLoadingBoard || isLoadingTasks;

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

    return (
        <div className="px-4 py-4">
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
                </Col>

                {/* Right Column: My Tasks */}
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
