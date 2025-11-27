import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { sprintAPI } from '../../apiCaller/backlogSprint';

interface CreateSprintModalProps {
  show: boolean;
  onHide: () => void;
  projectId: string;
  onSuccess: () => void;
}

const CreateSprintModal: React.FC<CreateSprintModalProps> = ({
  show,
  onHide,
  projectId,
  onSuccess
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation 1: Sprint name is required
    if (!formData.name.trim()) {
      toast.error(t('SprintNameRequired'));
      return;
    }

    // Validation 2: Sprint name length (3-100 characters)
    if (formData.name.trim().length < 3) {
      toast.error(t('SprintNameMinLength'));
      return;
    }
    if (formData.name.trim().length > 100) {
      toast.error(t('SprintNameMaxLength'));
      return;
    }

    // Validation 3: If dates are provided, validate them
    if (formData.startDate || formData.endDate) {
      // If one date is provided, the other must be provided too
      if (!formData.startDate || !formData.endDate) {
        toast.error(t('BothDatesRequired'));
        return;
      }

      // Validation 4: Start date cannot be in the past (except if creating an active sprint)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare dates only
      const startDate = new Date(formData.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        toast.error(t('StartDateCannotBePast'));
        return;
      }

      // Validation 5: End date must be after start date
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        toast.error(t('EndDateMustBeAfterStart'));
        return;
      }

      // Validation 6: Sprint duration validation (minimum 1 day, maximum 90 days)
      const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (durationInDays < 1) {
        toast.error(t('SprintDurationMin'));
        return;
      }
      if (durationInDays > 90) {
        toast.error(t('SprintDurationMax'));
        return;
      }

      // Validation 7: Warn if sprint duration is unusual
      if (durationInDays < 7 || durationInDays > 30) {
        const proceed = window.confirm(
          t('SprintDurationWarning', { days: durationInDays })
        );
        if (!proceed) return;
      }

      // Validation 8: If status is 'active', start date should be today
      if (formData.status === 'active' && startDate.getTime() !== today.getTime()) {
        toast.warning(t('ActiveSprintsShouldStartToday'));
        setFormData(prev => ({
          ...prev,
          startDate: today.toISOString().split('T')[0]
        }));
        return;
      }
    }

    // Validation 9: If status is 'active', dates must be provided
    if (formData.status === 'active' && (!formData.startDate || !formData.endDate)) {
      toast.error(t('ActiveSprintsMustHaveDates'));
      return;
    }

    try {
      setLoading(true);
      const sprintData: any = {
        name: formData.name.trim(),
        status: formData.status,
        description: formData.description.trim(),
        isBacklog: false
      };

      // Only include dates if they are provided
      if (formData.startDate && formData.endDate) {
        sprintData.startDate = formData.startDate;
        sprintData.endDate = formData.endDate;
      }

      await sprintAPI.create(projectId, sprintData);
      toast.success(t('SprintCreatedSuccessfully'));
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating sprint:', error);
      toast.error(error.response?.data?.message || t('FailedToCreateSprint'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      description: '',
      status: 'planned'
    });
    onHide();
  };

  // Generate default sprint name
  const generateSprintName = () => {
    const sprintNumber = new Date().getTime() % 1000;
    setFormData(prev => ({
      ...prev,
      name: `Sprint ${sprintNumber}`
    }));
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

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{t('CreateNewSprint')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>{t('SprintName')} *</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder={t('SprintNamePlaceholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Button variant="outline-secondary" onClick={generateSprintName}>
                {t('Generate')}
              </Button>
            </div>
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
                <Form.Label>{t('StartDate')} {formData.status === 'active' && '*'}</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={getTodayDate()}
                />
                <Form.Text className="text-muted">
                  {t('OptionalForPlanning')}
                </Form.Text>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>{t('EndDate')} {formData.status === 'active' && '*'}</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || getTodayDate()}
                />
                <Form.Text className="text-muted">
                  {t('OptionalForPlanning')}
                </Form.Text>
              </Form.Group>
            </div>
          </div>

          {sprintDuration !== null && (
            <div className="alert alert-info mb-3 py-2" style={{ fontSize: '13px' }}>
              <strong>{t('SprintDuration')}:</strong> {sprintDuration} {t('Days')}
              {sprintDuration < 7 && <span className="text-warning">{t('ShorterThanTypical')}</span>}
              {sprintDuration > 30 && <span className="text-warning">{t('LongerThanTypical')}</span>}
              {sprintDuration >= 7 && sprintDuration <= 30 && <span className="text-success"> ✓</span>}
            </div>
          )}

          {!formData.startDate && !formData.endDate && (
            <div className="alert alert-info mb-3 py-2" style={{ fontSize: '13px' }}>
              💡 <strong>{t('Tip')}:</strong> {t('TipCreateSprintWithoutDates')}
            </div>
          )}

          <Button 
            variant="link" 
            size="sm" 
            onClick={generateDefaultDates}
            className="mb-3"
          >
            {t('Set2WeekSprint')}
          </Button>

          <Form.Group className="mb-3">
            <Form.Label>{t('InitialStatus')}</Form.Label>
            <Form.Select
              value={formData.status}
              onChange={(e) => setFormData({ 
                ...formData, 
                status: e.target.value as any 
              })}
            >
              <option value="planned">{t('PlannedForFuturePlanning')}</option>
              <option value="active">{t('ActiveRequiresDates')}</option>
            </Form.Select>
            <Form.Text className="text-muted">
              {formData.status === 'planned' 
                ? t('PerfectForPlanningSprints')
                : t('ActiveSprintsRequireDates')}
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
          {loading ? t('Creating') : t('CreateSprint')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateSprintModal;
