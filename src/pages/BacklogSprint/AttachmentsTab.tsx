import React, { useState, useEffect } from 'react';
import { Button, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { Upload, FileText, Image, Film, Music, Archive, X, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { taskAttachmentAPI, TaskAttachment } from '../../apiCaller/taskAttachments';

interface AttachmentsTabProps {
  projectId: string;
  taskId: number;
}

const AttachmentsTab: React.FC<AttachmentsTabProps> = ({ projectId, taskId }) => {
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Get API base URL
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8088';
  
  // Build absolute URL from relative path
  const getAbsoluteUrl = (relativeUrl: string): string => {
    if (relativeUrl.startsWith('http')) return relativeUrl;
    return `${apiBaseUrl}${relativeUrl}`;
  };

  useEffect(() => {
    loadAttachments();
  }, [projectId, taskId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await taskAttachmentAPI.list(projectId, taskId);
      setAttachments(data);
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast.error(t('FailedToLoadAttachments'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('FileSizeMustBeLessThan5MB'));
      return;
    }

    try {
      setUploading(true);
      const uploaded = await taskAttachmentAPI.upload(projectId, taskId, file);
      setAttachments(prev => [uploaded, ...prev]);
      toast.success(t('FileUploadedSuccessfully'));
      e.target.value = ''; // Reset input
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.message || t('FailedToUploadFile'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!window.confirm(t('DeleteFileConfirm'))) {
      return;
    }

    try {
      await taskAttachmentAPI.delete(projectId, taskId, attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      toast.success(t('FileDeletedSuccessfully'));
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(t('FailedToDeleteFile'));
    }
  };

  const handleDownload = async (attachment: TaskAttachment) => {
    try {
      const url = getAbsoluteUrl(attachment.fileUrl);
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.originalFilename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success(t('FileDownloadedSuccessfully'));
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(t('FailedToDownloadFile'));
    }
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image size={20} className="text-primary" />;
    if (contentType.startsWith('video/')) return <Film size={20} className="text-danger" />;
    if (contentType.startsWith('audio/')) return <Music size={20} className="text-success" />;
    if (contentType.includes('zip') || contentType.includes('rar')) return <Archive size={20} className="text-warning" />;
    return <FileText size={20} className="text-secondary" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return `0 ${t('Bytes')}`;
    const k = 1024;
    const sizes = [t('Bytes'), t('KB'), t('MB'), t('GB')];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">{t('LoadingAttachments')}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Upload Button */}
      <div className="mb-3">
        <label htmlFor="file-upload" className="btn btn-primary">
          <Upload size={18} className="me-2" />
          {uploading ? t('Uploading') : t('UploadFile')}
        </label>
        <input
          id="file-upload"
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <small className="d-block text-muted mt-2">
          {t('MaximumFileSize')}: 5MB
        </small>
      </div>

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <div className="text-center py-4 text-muted">
          <FileText size={48} className="mb-3 opacity-50" />
          <p>{t('NoAttachmentsYet')}</p>
        </div>
      ) : (
        <ListGroup>
          {attachments.map(attachment => (
            <ListGroup.Item key={attachment.id} className="d-flex align-items-center">
              <div className="me-3">
                {getFileIcon(attachment.contentType)}
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center">
                  <a 
                    href={getAbsoluteUrl(attachment.fileUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-decoration-none me-2"
                    style={{ cursor: 'pointer' }}
                  >
                    <strong>{attachment.originalFilename}</strong>
                  </a>
                  <Badge bg="secondary" className="ms-2">
                    {formatFileSize(attachment.fileSize)}
                  </Badge>
                </div>
                <small className="text-muted">
                  {t('Uploaded')} {formatDate(attachment.uploadedAt)}
                </small>
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(attachment);
                  }}
                  title={t('DownloadFile')}
                >
                  <Download size={16} />
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(attachment.id)}
                  title={t('Delete')}
                >
                  <X size={16} />
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
};

export default AttachmentsTab;
