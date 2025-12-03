import React, { useState } from "react";
import { Modal, Button, Badge, Row, Col } from "reactstrap";
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

function SprintDetailModal({ 
  isOpen, 
  toggle, 
  sprint,
  totalTasks: propTotalTasks,
  completedTasks: propCompletedTasks
}: { 
  isOpen: boolean; 
  toggle: () => void; 
  sprint: any;
  totalTasks?: number;
  completedTasks?: number;
}) {
  const { t, i18n } = useTranslation();
  const [showNotification, setShowNotification] = useState(true);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "planned": return "info";
      case "completed": return "primary";
      case "paused": return "warning";
      case "cancelled": return "danger";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle size={16} className="text-success" />;
      case "planned": return <Calendar size={16} className="text-info" />;
      case "completed": return <CheckCircle size={16} className="text-primary" />;
      case "paused": return <AlertCircle size={16} className="text-warning" />;
      case "cancelled": return <AlertCircle size={16} className="text-danger" />;
      default: return null;
    }
  };

  // Calculate metrics - use prop values if provided, otherwise calculate from sprint
  const completedTasks = propCompletedTasks ?? (sprint?.tasks?.filter((t: any) => t.status === "done").length ?? 0);
  const totalTasks = propTotalTasks ?? (sprint?.tasks?.length ?? 0);
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const duration = sprint?.startDate && sprint?.endDate 
    ? Math.ceil((new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24)) 
    : null;
  const daysRemaining = sprint?.endDate 
    ? Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) 
    : null;

  return (
    <>
      {showNotification && (
        <div
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, minWidth: 300 }}
          className="shadow-sm"
        >
          <div className="alert alert-info d-flex align-items-center justify-content-between mb-0">
            <div>
              <strong>{t('NotificationTitle')}</strong>
              <div className="mt-1">{t('NotificationMessage')}</div>
            </div>
            <div className="d-flex align-items-center gap-2 ms-3">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => i18n.changeLanguage('en')}
              >
                English
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => i18n.changeLanguage('vn')}
              >
                Tiếng Việt
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={() => setShowNotification(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {sprint && (
        <Modal isOpen={isOpen} toggle={toggle} size="lg">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <Calendar size={20} />
              {t('SprintDetails')}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={toggle}
            ></button>
          </div>
          <div className="modal-body">
            {/* Sprint Name & Status */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h4 className="mb-0">{sprint?.name}</h4>
                <Badge
                  color={sprint ? getStatusColor(sprint.status) : 'secondary'}
                  className="d-flex align-items-center gap-1"
                >
                  {sprint ? getStatusIcon(sprint.status) : null}
                  {sprint?.status === 'active' ? t('StatusActive') :
                   sprint?.status === 'planned' ? t('StatusPlanned') :
                   sprint?.status === 'completed' ? t('StatusCompleted') :
                   sprint?.status === 'paused' ? t('StatusPaused') :
                   sprint?.status === 'cancelled' ? t('StatusCancelled') :
                   sprint?.status ? String(sprint.status).toUpperCase() : ''}
                </Badge>
              </div>
              {sprint?.description && (
                <p className="text-muted mb-0">{sprint.description}</p>
              )}
            </div>
            {/* Date Information */}
            <Row className="mb-4">
              <Col md={6}>
                <div className="border rounded p-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Calendar size={18} className="text-primary" />
                    <strong>{t('StartDate')}</strong>
                  </div>
                  {sprint?.startDate ? (
                    <p className="mb-0 ms-4">
                      {new Date(sprint.startDate ?? '').toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  ) : (
                    <p className="mb-0 ms-4 text-muted fst-italic">{t('NotSet')}</p>
                  )}
                </div>
              </Col>
              <Col md={6}>
                <div className="border rounded p-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Calendar size={18} className="text-danger" />
                    <strong>{t('EndDate')}</strong>
                  </div>
                  {sprint?.endDate ? (
                    <p className="mb-0 ms-4">
                      {new Date(sprint.endDate ?? '').toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  ) : (
                    <p className="mb-0 ms-4 text-muted fst-italic">{t('NotSet')}</p>
                  )}
                </div>
              </Col>
            </Row>
            {/* Duration & Days Remaining */}
            {duration !== null && (
              <Row className="mb-4">
                <Col md={6}>
                  <div className="border rounded p-3 bg-light">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Clock size={18} className="text-info" />
                      <strong>{t('SprintDuration')}</strong>
                    </div>
                    <p className="mb-0 ms-4 fs-5">
                      {duration} {duration === 1 ? t('Day') : t('Days')}
                    </p>
                  </div>
                </Col>
                {sprint?.status === "active" && typeof daysRemaining === 'number' && (
                  <Col md={6}>
                    <div className="border rounded p-3 bg-light">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <AlertCircle
                          size={18}
                          className={
                            daysRemaining < 0 ? "text-danger" : "text-warning"
                          }
                        />
                        <strong>{t('DaysRemaining')}</strong>
                      </div>
                      <p
                        className={`mb-0 ms-4 fs-5 ${
                          daysRemaining < 0 ? "text-danger" : ""
                        }`}
                      >
                        {daysRemaining < 0
                          ? `${t('OverdueBy')} ${Math.abs(daysRemaining)} ${
                              Math.abs(daysRemaining) === 1 ? t('Day') : t('Days')
                            }`
                          : `${daysRemaining} ${
                              daysRemaining === 1 ? t('Day') : t('Days')
                            }`}
                      </p>
                    </div>
                  </Col>
                )}
              </Row>
            )}
            {/* Task Progress */}
            <div className="border rounded p-3 mb-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle size={18} className="text-success" />
                  <strong>{t('TaskProgress')}</strong>
                </div>
                <div className="text-end">
                  <span className="fs-5 fw-bold text-primary">{progress}%</span>
                  <div className="text-muted small">
                    {t('TasksCompleted', { completed: completedTasks, total: totalTasks })}
                  </div>
                </div>
              </div>
              <div className="progress" style={{ height: "20px" }}>
                <div
                  className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: `${progress}%` }}
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {progress > 10 && `${progress}%`}
                </div>
              </div>
            </div>
            {/* Task Breakdown */}
            <Row>
              <Col md={4}>
                <div className="text-center border rounded p-3">
                  <div className="fs-2 fw-bold text-primary">{totalTasks}</div>
                  <div className="text-muted small">{t('TotalTasks')}</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-center border rounded p-3">
                  <div className="fs-2 fw-bold text-success">{completedTasks}</div>
                  <div className="text-muted small">{t('Completed')}</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-center border rounded p-3">
                  <div className="fs-2 fw-bold text-warning">
                    {totalTasks - completedTasks}
                  </div>
                  <div className="text-muted small">{t('Remaining')}</div>
                </div>
              </Col>
            </Row>
          </div>
          <div className="modal-footer">
            <Button color="secondary" onClick={toggle}>
              {t('Close')}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

export default SprintDetailModal;
