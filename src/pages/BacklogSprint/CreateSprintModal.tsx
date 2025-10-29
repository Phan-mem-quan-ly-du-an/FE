import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
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
      toast.error('Sprint name is required');
      return;
    }

    // Validation 2: Sprint name length (3-100 characters)
    if (formData.name.trim().length < 3) {
      toast.error('Sprint name must be at least 3 characters');
      return;
    }
    if (formData.name.trim().length > 100) {
      toast.error('Sprint name must not exceed 100 characters');
      return;
    }

    // Validation 3: If dates are provided, validate them
    if (formData.startDate || formData.endDate) {
      // If one date is provided, the other must be provided too
      if (!formData.startDate || !formData.endDate) {
        toast.error('If you provide a date, both start date and end date are required');
        return;
      }

      // Validation 4: Start date cannot be in the past (except if creating an active sprint)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare dates only
      const startDate = new Date(formData.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        toast.error('Start date cannot be in the past. Please select today or a future date.');
        return;
      }

      // Validation 5: End date must be after start date
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        toast.error('End date must be after start date');
        return;
      }

      // Validation 6: Sprint duration validation (minimum 1 day, maximum 90 days)
      const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (durationInDays < 1) {
        toast.error('Sprint duration must be at least 1 day');
        return;
      }
      if (durationInDays > 90) {
        toast.error('Sprint duration cannot exceed 90 days (3 months)');
        return;
      }

      // Validation 7: Warn if sprint duration is unusual
      if (durationInDays < 7 || durationInDays > 30) {
        const proceed = window.confirm(
          `Sprint duration is ${durationInDays} days. Typical sprints are 1-4 weeks (7-30 days). Do you want to continue?`
        );
        if (!proceed) return;
      }

      // Validation 8: If status is 'active', start date should be today
      if (formData.status === 'active' && startDate.getTime() !== today.getTime()) {
        toast.warning('Active sprints should start today. Adjusting start date to today.');
        setFormData(prev => ({
          ...prev,
          startDate: today.toISOString().split('T')[0]
        }));
        return;
      }
    }

    // Validation 9: If status is 'active', dates must be provided
    if (formData.status === 'active' && (!formData.startDate || !formData.endDate)) {
      toast.error('Active sprints must have start and end dates. Please provide dates or set status to "Planned".');
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
      toast.success('Sprint created successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating sprint:', error);
      toast.error(error.response?.data?.message || 'Failed to create sprint');
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
        <Modal.Title>Create New Sprint</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Sprint Name *</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="e.g., Sprint 1, Q1 Sprint, Feature Development Sprint"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Button variant="outline-secondary" onClick={generateSprintName}>
                Generate
              </Button>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Describe the sprint goals and objectives..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Form.Group>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Start Date {formData.status === 'active' && '*'}</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={getTodayDate()}
                />
                <Form.Text className="text-muted">
                  Optional for planning. Required for active sprints.
                </Form.Text>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>End Date {formData.status === 'active' && '*'}</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || getTodayDate()}
                />
                <Form.Text className="text-muted">
                  Optional for planning. Required for active sprints.
                </Form.Text>
              </Form.Group>
            </div>
          </div>

          {sprintDuration !== null && (
            <div className="alert alert-info mb-3 py-2" style={{ fontSize: '13px' }}>
              <strong>Sprint Duration:</strong> {sprintDuration} day(s)
              {sprintDuration < 7 && <span className="text-warning"> (⚠️ Shorter than typical 1-2 week sprint)</span>}
              {sprintDuration > 30 && <span className="text-warning"> (⚠️ Longer than typical 4-week sprint)</span>}
              {sprintDuration >= 7 && sprintDuration <= 30 && <span className="text-success"> ✓</span>}
            </div>
          )}

          {!formData.startDate && !formData.endDate && (
            <div className="alert alert-info mb-3 py-2" style={{ fontSize: '13px' }}>
              💡 <strong>Tip:</strong> You can create a sprint without dates for planning purposes. 
              Set the dates later when you're ready to start the sprint.
            </div>
          )}

          <Button 
            variant="link" 
            size="sm" 
            onClick={generateDefaultDates}
            className="mb-3"
          >
            Set 2-week sprint (default)
          </Button>

          <Form.Group className="mb-3">
            <Form.Label>Initial Status</Form.Label>
            <Form.Select
              value={formData.status}
              onChange={(e) => setFormData({ 
                ...formData, 
                status: e.target.value as any 
              })}
            >
              <option value="planned">Planned (for future planning)</option>
              <option value="active">Active (requires dates)</option>
            </Form.Select>
            <Form.Text className="text-muted">
              {formData.status === 'planned' 
                ? 'Perfect for planning sprints. You can set dates later when ready to start.' 
                : 'Active sprints require start and end dates.'}
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Sprint'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateSprintModal;
