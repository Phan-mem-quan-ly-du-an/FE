import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
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
      toast.error('Sprint name is required');
      return;
    }

    // Validation 2: If one date is provided, both must be provided
    if ((formData.startDate && !formData.endDate) || (!formData.startDate && formData.endDate)) {
      toast.error('Both start date and end date are required');
      return;
    }

    // Validation 3: Date validation if provided
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate <= startDate) {
        toast.error('End date must be after start date');
        return;
      }

      // Check duration
      const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (durationInDays < 1) {
        toast.error('Sprint duration must be at least 1 day');
        return;
      }
      if (durationInDays > 90) {
        toast.error('Sprint duration cannot exceed 90 days');
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
          toast.success('Sprint dates set and sprint started successfully!');
        } catch (startError) {
          console.error('Error starting sprint after setting dates:', startError);
          toast.warning('Dates updated but failed to start sprint. Please try starting manually.');
        }
      } else {
        toast.success('Sprint updated successfully');
      }
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error updating sprint:', error);
      toast.error(error.response?.data?.message || 'Failed to update sprint');
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
          {focusOnDates ? 'Set Sprint Dates' : 'Edit Sprint'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {focusOnDates && (
          <div className="alert alert-warning mb-3">
            <i className="ri-calendar-line me-2"></i>
            <strong>Sprint dates required!</strong> Please set start and end dates before starting this sprint.
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <Form.Label>Sprint Name *</Form.Label>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => {
                  const sprintNumber = sprint?.name.match(/\d+/)?.[0] || '1';
                  setFormData({ ...formData, name: `Sprint ${sprintNumber}` });
                }}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                Generate
              </Button>
            </div>
            <Form.Control
              type="text"
              placeholder="e.g., Sprint 1, Q1 Sprint, Feature Development Sprint"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
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
                <Form.Label>
                  Start Date
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
                  Optional for planning. Required for active sprints.
                </Form.Text>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>
                  End Date
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
                  Optional for planning. Required for active sprints.
                </Form.Text>
              </Form.Group>
            </div>
          </div>

          {(!formData.startDate || !formData.endDate) && (
            <div className="alert alert-info mb-3 py-2">
              <i className="ri-lightbulb-line me-2"></i>
              <strong>💡 Tip:</strong> You can create a sprint without dates for planning purposes. Set the dates later when you're ready to start the sprint.
              <br />
              <Button 
                variant="link" 
                size="sm" 
                onClick={generateDefaultDates}
                className="p-0 mt-1"
              >
                <i className="ri-calendar-check-line me-1"></i>
                Set 2-week sprint (default)
              </Button>
            </div>
          )}

          {sprintDuration !== null && (
            <div className="alert alert-info mb-3 py-2" style={{ fontSize: '13px' }}>
              <strong>Sprint Duration:</strong> {sprintDuration} day(s)
              {sprintDuration < 7 && <span className="text-warning"> (⚠️ Shorter than typical sprint)</span>}
              {sprintDuration > 30 && <span className="text-warning"> (⚠️ Longer than typical sprint)</span>}
              {sprintDuration >= 7 && sprintDuration <= 30 && <span className="text-success"> ✓</span>}
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Initial Status</Form.Label>
            <Form.Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="planned">Planned (for future planning)</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
            <Form.Text className="text-muted">
              Perfect for planning sprints. You can set dates later when ready to start.
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
          {loading ? 'Saving...' : 'Update Sprint'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditSprintModal;
