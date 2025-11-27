import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { sprintAPI } from '../../apiCaller/backlogSprint';

interface Sprint {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled' | 'paused';
}

interface EditSprintModalProps {
  show: boolean;
  onHide: () => void;
  projectId: string;
  sprint: Sprint | null;
  onSuccess: () => void;
  focusOnDates?: boolean; // If true, emphasize date inputs
  autoStartAfterSave?: boolean; // If true, start sprint after saving dates
}

const EditSprintModal: React.FC<EditSprintModalProps> = ({
  show,
  onHide,
  projectId,
  sprint,
  onSuccess,
  focusOnDates = false,
  autoStartAfterSave = false
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    status: 'planned' as 'planned' | 'active' | 'completed' | 'cancelled' | 'paused'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sprint) {
      setFormData({
        name: sprint.name,
        startDate: sprint.startDate || '',
        endDate: sprint.endDate || '',
        description: sprint.description || '',
        status: sprint.status
      });
    }
  }, [sprint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sprint) return;

    // Validation 1: Sprint name is required
    if (!formData.name.trim()) {
      toast.error(t('SprintNameRequired'));
      return;
    }

    // Validation 2: If one date is provided, both must be provided
    if ((formData.startDate && !formData.endDate) || (!formData.startDate && formData.endDate)) {
      toast.error(t('BothDatesRequired'));
      return;
    }

    // Validation 3: Date validation if provided
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate <= startDate) {
        toast.error(t('EndDateMustBeAfterStart'));
        return;
      }

      // Check duration
      const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (durationInDays < 1) {
        toast.error(t('SprintDurationMin'));
        return;
      }
      if (durationInDays > 90) {
        toast.error(t('SprintDurationMax'));
        return;
      }
    }

    try {
      setLoading(true);
      const updateData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status
      };

      // Only include dates if they are provided
      if (formData.startDate && formData.endDate) {
        updateData.startDate = formData.startDate;
        updateData.endDate = formData.endDate;
      }

      await sprintAPI.update(projectId, sprint.id, updateData);
      
      // If autoStartAfterSave is true and we just set dates, start the sprint
      if (autoStartAfterSave && formData.startDate && formData.endDate && sprint.status === 'planned') {
        try {
          await sprintAPI.update(projectId, sprint.id, { status: 'active' });
          toast.success(t('SprintDatesSetAndStarted'));
        } catch (startError) {
          console.error('Error starting sprint after setting dates:', startError);
          toast.warning(t('DatesUpdatedButFailedToStart'));
        }
      } else {
        toast.success(t('SprintUpdatedSuccessfully'));
      }
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error updating sprint:', error);
      toast.error(error.response?.data?.message || t('FailedToUpdateSprint'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onHide();
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Generate default dates (2 weeks sprint)
  const generateDefaultDates = () => {
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    
    setFormData(prev => ({
      ...prev,
      startDate: today.toISOString().split('T')[0],
      endDate: twoWeeksLater.toISOString().split('T')[0]
    }));
  };

  // Calculate sprint duration
  const getSprintDuration = () => {
    if (!formData.startDate || !formData.endDate) return null;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const durationInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return durationInDays;
  };

  const sprintDuration = getSprintDuration();

  if (!sprint) return null;

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {focusOnDates ? t('SetSprintDates') : t('EditSprint')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {focusOnDates && (
          <div className="alert alert-warning mb-3">
            <i className="ri-calendar-line me-2"></i>
            <strong>{t('SprintDatesRequired')}</strong> {t('SprintDatesRequiredMessage')}
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <Form.Label>{t('SprintName')} *</Form.Label>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => {
                  const sprintNumber = sprint?.name.match(/\d+/)?.[0] || '1';
                  setFormData({ ...formData, name: `Sprint ${sprintNumber}` });
                }}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                {t('Generate')}
              </Button>
            </div>
            <Form.Control
              type="text"
              placeholder={t('SprintNamePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('Description')}</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder={t('SprintDescriptionPlaceholder')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Form.Group>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>
                  {t('StartDate')}
                  {focusOnDates && <span className="text-danger"> *</span>}
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={focusOnDates && !formData.startDate ? 'border-warning' : ''}
                  placeholder="dd/mm/yyyy"
                />
                <Form.Text className="text-muted">
                  {t('OptionalForPlanning')}
                </Form.Text>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>
                  {t('EndDate')}
                  {focusOnDates && <span className="text-danger"> *</span>}
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || getTodayDate()}
                  className={focusOnDates && !formData.endDate ? 'border-warning' : ''}
                  placeholder="dd/mm/yyyy"
                />
                <Form.Text className="text-muted">
                  {t('OptionalForPlanning')}
                </Form.Text>
              </Form.Group>
            </div>
          </div>

          {(!formData.startDate || !formData.endDate) && (
            <div className="alert alert-info mb-3 py-2">
              <i className="ri-lightbulb-line me-2"></i>
              <strong>💡 {t('Tip')}:</strong> {t('TipCreateSprintWithoutDates')}
              <br />
              <Button 
                variant="link" 
                size="sm" 
                onClick={generateDefaultDates}
                className="p-0 mt-1"
              >
                <i className="ri-calendar-check-line me-1"></i>
                {t('Set2WeekSprint')}
              </Button>
            </div>
          )}

          {sprintDuration !== null && (
            <div className="alert alert-info mb-3 py-2" style={{ fontSize: '13px' }}>
              <strong>{t('SprintDuration')}:</strong> {sprintDuration} {t('Days')}
              {sprintDuration < 7 && <span className="text-warning">{t('ShorterThanTypicalSprint')}</span>}
              {sprintDuration > 30 && <span className="text-warning">{t('LongerThanTypicalSprint')}</span>}
              {sprintDuration >= 7 && sprintDuration <= 30 && <span className="text-success"> ✓</span>}
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>{t('InitialStatus')}</Form.Label>
            <Form.Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="planned">{t('PlannedForFuturePlanning')}</option>
              <option value="active">{t('StatusActive')}</option>
              <option value="paused">{t('StatusPausedLabel')}</option>
              <option value="completed">{t('StatusCompletedLabel')}</option>
              <option value="cancelled">{t('StatusCancelledLabel')}</option>
            </Form.Select>
            <Form.Text className="text-muted">
              {t('PerfectForPlanningSprints')}
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          {t('Cancel')}
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? t('Saving') : t('UpdateSprint')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditSprintModal;
