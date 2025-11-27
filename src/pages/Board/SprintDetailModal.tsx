import React from "react";
import { Modal, Button, Badge, Row, Col } from "reactstrap";
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Sprint {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  status: "planned" | "active" | "completed" | "cancelled" | "paused";
}

interface SprintDetailModalProps {
  isOpen: boolean;
  toggle: () => void;
  sprint: Sprint | null;
  totalTasks: number;
  completedTasks: number;
}

const SprintDetailModal: React.FC<SprintDetailModalProps> = ({
  isOpen,
  toggle,
  sprint,
  totalTasks,
  completedTasks,
}) => {
  const { t } = useTranslation();
  if (!sprint) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "primary";
      case "planned":
        return "warning";
      case "cancelled":
        return "danger";
      case "paused":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle size={16} />;
      case "completed":
        return <CheckCircle size={16} />;
      case "planned":
        return <Clock size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const calculateProgress = () => {
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const calculateDaysRemaining = () => {
    if (!sprint.endDate) return null;
    const today = new Date();
    const end = new Date(sprint.endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateDuration = () => {
    if (!sprint.startDate || !sprint.endDate) return null;
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const progress = calculateProgress();
  const daysRemaining = calculateDaysRemaining();
  const duration = calculateDuration();

  return (
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
            <h4 className="mb-0">{sprint.name}</h4>
            <Badge
              color={getStatusColor(sprint.status)}
              className="d-flex align-items-center gap-1"
            >
              {getStatusIcon(sprint.status)}
              {sprint.status === 'active' ? t('StatusActive') :
               sprint.status === 'planned' ? t('StatusPlanned') :
               sprint.status === 'completed' ? t('StatusCompleted') :
               sprint.status === 'paused' ? t('StatusPaused') :
               sprint.status === 'cancelled' ? t('StatusCancelled') :
               String(sprint.status).toUpperCase()}
            </Badge>
          </div>
          {sprint.description && (
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
              {sprint.startDate ? (
                <p className="mb-0 ms-4">
                  {new Date(sprint.startDate).toLocaleDateString("en-US", {
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
              {sprint.endDate ? (
                <p className="mb-0 ms-4">
                  {new Date(sprint.endDate).toLocaleDateString("en-US", {
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
            {sprint.status === "active" && daysRemaining !== null && (
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
  );
};

export default SprintDetailModal;
