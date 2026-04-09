import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner, Card, CardBody, CardHeader, Button, Table } from 'reactstrap';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { AddProjectMemberModal } from './AddProjectMemberModal';
import { getProjectById } from '../../apiCaller/projects';
import { getProjectMembers, ProjectMember, transferProjectOwnership, removeProjectMember } from '../../apiCaller/projectMembers';
import { getProjectRoles, ProjectRole } from '../../apiCaller/projectRoles';
import { getUsersByIds, UserBrief } from '../../apiCaller/users';
import { getWorkspaceById } from '../../apiCaller/workspaces';
import AssignProjectRoleModal from './AssignProjectRoleModal';
import TransferProjectOwnershipModal from './TransferProjectOwnershipModal';
import { toast } from 'react-toastify';
import { isForbiddenError } from '../../helpers/permissions';

const TeamTab: React.FC = () => {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [assignRoleModal, setAssignRoleModal] = useState(false);
  const [transferOwnershipModal, setTransferOwnershipModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
  const [selectedDowngradeRoleId, setSelectedDowngradeRoleId] = useState<number | '' > ('');

  const toggleDropdown = useCallback((userId: string) => {
    setOpenDropdownId(prev => (prev === userId ? null : userId));
  }, []);

  const {
    data: members,
    isLoading,
    error,
    refetch: refetchMembers,
  } = useQuery<ProjectMember[]>({ queryKey: ['project-members', projectId], queryFn: () => getProjectMembers(projectId!), enabled: !!projectId });

  const { data: roles } = useQuery<ProjectRole[]>({ queryKey: ['project-roles', projectId], queryFn: () => getProjectRoles(projectId!), enabled: !!projectId });

    const { mutate: transferOwnership, isPending: isTransferring } = useMutation({
    mutationFn: transferProjectOwnership,
    onSuccess: () => {
      refetchMembers();
      toast.success(t('OwnershipTransferredSuccessfully'));
      setTransferOwnershipModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t('FailedToTransferOwnership'));
    },
  });

  const { mutate: removeMember, isPending: isRemoving } = useMutation({
    mutationFn: ({ projectId, memberUserId }: { projectId: string; memberUserId: string }) =>
      removeProjectMember(projectId, memberUserId),
    onSuccess: () => {
      refetchMembers();
      toast.success(t('MemberRemovedSuccessfully'));
    },
    onError: (error: any) => {
      toast.error(error.message || t('FailedToRemoveMember'));
    },
  });

  useEffect(() => {
    if (projectId) {
      getProjectById(projectId).then(data => {
        setProject(data);
        if (data?.workspaceId) {
          getWorkspaceById(data.workspaceId).then(setWorkspace);
        }
      });
    }
  }, [projectId]);

  const userIds = useMemo(() => {
    return members?.map((e: ProjectMember) => e.userId) || [];
  }, [members]);

  const { data: usersBrief } = useQuery<UserBrief[]>({ queryKey: ['users-brief', userIds], queryFn: () => getUsersByIds(userIds), enabled: userIds.length > 0 });
  const idToEmail = useMemo(() => {
    if (!usersBrief) return {};
    return usersBrief.reduce((acc: { [key: string]: string }, user: UserBrief) => {
      acc[user.id] = user.email;
      return acc;
    }, {});
  }, [usersBrief]);

  useEffect(() => {
    if (error && isForbiddenError(error)) {
      toast.warning(t('ProjectPermissions.ViewMembersDenied') || 'Bạn không có quyền xem thành viên của dự án này.');
    }
  }, [error, t]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <Spinner color="primary" />
        <span className="ms-2">{t('LoadingMembers')}</span>
      </div>
    );
  }

  if (error) {
    const forbidden = isForbiddenError(error);
    return (
      <div className={`alert ${forbidden ? 'alert-warning' : 'alert-danger'} text-center`}>
        <i className="ri-error-warning-line me-2"></i>
        {forbidden ? (t('ProjectPermissions.ViewMembersDenied') || 'Bạn không có quyền xem thành viên của dự án này.') : (t('FailedToLoadMembers') || 'Failed to load members')}
      </div>
    );
  }

  const handleTransferOwnership = () => {
    if (!selectedMember || !selectedDowngradeRoleId) {
      toast.error(t('PleaseSelectMemberAndDowngradeRole'));
      return;
    }
    transferOwnership({ projectId: projectId!, targetUserId: selectedMember.userId, ownerDowngradeRoleId: selectedDowngradeRoleId });
  };

  const handleRemoveMember = (member: ProjectMember) => {
    if (!projectId || !member?.userId) return;
    const confirmed = window.confirm(t('AreYouSureRemoveMember'));
    if (!confirmed) return;
    removeMember({ projectId: projectId!, memberUserId: member.userId });
  };

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between">
        <h5 className="card-title mb-0">{t('TeamMembers')}</h5>
        <Button color="primary" onClick={() => setAddMemberModal(true)}>
          <i className="ri-add-line align-middle me-1" /> {t('AddMember')}
        </Button>
      </CardHeader>
      <CardBody>
        {project && workspace && (
          <AddProjectMemberModal
            isOpen={addMemberModal}
            setIsOpen={setAddMemberModal}
            projectId={projectId!}
            companyId={workspace.companyId}
            workspaceId={project.workspaceId}
            onAdd={refetchMembers}
          />
        )}
        <AssignProjectRoleModal
          show={assignRoleModal}
          onClose={() => setAssignRoleModal(false)}
          projectId={projectId!}
          member={selectedMember}
          onSuccess={(message) => toast.success(message)}
          onError={(message) => toast.error(message)}
        />
        <TransferProjectOwnershipModal
          show={transferOwnershipModal}
          onClose={() => setTransferOwnershipModal(false)}
          onConfirm={handleTransferOwnership}
          targetMember={selectedMember}
          roles={roles || []}
          selectedDowngradeRoleId={selectedDowngradeRoleId}
          onRoleChange={setSelectedDowngradeRoleId}
          isPending={isTransferring}
        />
        <div className="table-responsive">
          <Table hover className="table-striped align-middle table-nowrap mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('Email')}</th>
                <th>{t('Role')}</th>
                <th>{t('Action')}</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member: ProjectMember, index: number) => {
                const roleName = roles?.find((r: ProjectRole) => r.id === member.roleId)?.name || member.roleId;
                return (
                  <tr key={member.userId}>
                    <td>{index + 1}</td>
                    <td>{idToEmail[member.userId] || member.userId}</td>
                    <td>
                      {(member as any).owner ? (
                        <span className="badge text-uppercase bg-success-subtle text-success">{t('Owner')}</span>
                      ) : (
                        <span className="badge text-uppercase bg-dark-subtle text-black">{roleName}</span>
                      )}
                    </td>
                    <td>
                      <Dropdown isOpen={openDropdownId === member.userId} toggle={() => toggleDropdown(member.userId)}>
                        <DropdownToggle tag="button" className="btn btn-ghost-secondary btn-icon btn-sm" title={t('MoreOptions')}>
                          <i className="ri-more-2-fill fs-16"></i>
                        </DropdownToggle>
                      <DropdownMenu strategy="fixed">
                        <DropdownItem
                          onClick={() => {
                            setSelectedMember(member);
                            setAssignRoleModal(true);
                          }}
                          disabled={(member as any).owner}>
                          <i className="ri-user-settings-line me-2"></i> {t('AssignRole')}
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => {
                            setSelectedMember(member);
                            setTransferOwnershipModal(true);
                          }}
                          disabled={(member as any).owner}>
                          <i className="ri-exchange-line me-2"></i> {t('TransferOwnership')}
                        </DropdownItem>
                        <DropdownItem divider />
                        <DropdownItem
                          onClick={() => handleRemoveMember(member)}
                          disabled={(member as any).owner || isRemoving}
                          className="text-danger"
                        >
                          <i className="ri-delete-bin-5-line me-2"></i> {t('Remove')}
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </CardBody>
    </Card>
  );
};

export default TeamTab;