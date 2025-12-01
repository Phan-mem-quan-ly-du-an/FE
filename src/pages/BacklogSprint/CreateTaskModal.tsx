import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { taskAPI } from '../../apiCaller/backlogSprint';
import { getEpicsByProject, EpicDto } from '../../apiCaller/epics';

interface CreateTaskModalProps {
  show: boolean;
  onHide: () => void;
  projectId: string;
  sprintId?: number | null;
  onSuccess: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  show,
  onHide,
  projectId,
  sprintId,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    estimatedHours: '',
    dueDate: '',
    tags: '',
    epicId: '' as string
  });
  const [loading, setLoading] = useState(false);
  const [epics, setEpics] = useState<EpicDto[]>([]);

  useEffect(() => {
    if (show && projectId) {
      loadEpics();
    }
  }, [show, projectId]);

  const loadEpics = async () => {
    try {
      const response = await getEpicsByProject(projectId);
      setEpics(response.content || []);
    } catch (error) {
      console.error('Error loading epics:', error);
      setEpics([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error(t('TaskTitleRequired'));
      return;
    }

    try {
      setLoading(true);
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        projectId: projectId,
        sprintId: sprintId || null,
        priority: formData.priority,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
        dueDate: formData.dueDate || undefined,
        tags: formData.tags.trim() || undefined,
        epicId: formData.epicId ? parseInt(formData.epicId) : undefined,
        orderIndex: 0
      };
      console.log('📝 Creating task:', taskData);
      
      const createdTask = await taskAPI.create(projectId, taskData);
      console.log('✅ Task created:', createdTask);
      
      toast.success(t('TaskCreatedSuccessfully'));
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('❌ Error creating task:', error);
      toast.error(error.response?.data?.message || t('FailedToCreateTask'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      estimatedHours: '',
      dueDate: '',
      tags: '',
      epicId: ''
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {t('CreateNewTask')} {sprintId && <Badge bg="info" className="ms-2">{t('Sprint')} #{sprintId}</Badge>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>{t('TaskTitle')} *</Form.Label>
            <Form.Control
              type="text"
              placeholder={t('TaskTitlePlaceholder')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('Description')}</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder={t('TaskDescriptionPlaceholder')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Form.Group>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>{t('Priority')}</Form.Label>
                <Form.Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    priority: e.target.value as any 
                  })}
                >
                  <option value="LOW">{t('PriorityLowLabel')}</option>
                  <option value="MEDIUM">{t('PriorityMediumLabel')}</option>
                  <option value="HIGH">{t('PriorityHighLabel')}</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>{t('EstimatedHours')}</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  placeholder={t('EstimatedHoursPlaceholder')}
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                />
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>{t('DueDate')}</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>{t('Epic')}</Form.Label>
                <Form.Select
                  value={formData.epicId}
                  onChange={(e) => setFormData({ ...formData, epicId: e.target.value })}
                >
                  <option value="">{t('Epic') || 'Select Epic (Optional)'}</option>
                  {epics.map((epic) => (
                    <option key={epic.id} value={epic.id}>
                      {epic.title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>{t('Tags')}</Form.Label>
            <Form.Control
              type="text"
              placeholder={t('TagsPlaceholder')}
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
            <Form.Text className="text-muted">
              {t('SeparateMultipleTags')}
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
          {loading ? t('Creating') : t('CreateTask')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateTaskModal;
