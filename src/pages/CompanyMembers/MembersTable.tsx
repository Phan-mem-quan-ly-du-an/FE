import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CompanyMember } from '../../apiCaller/companyMembers';
import TableContainer from '../../Components/Common/TableContainer';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

interface MembersTableProps {
    members: CompanyMember[];
    companyId: string;
    deletingUserId: string | null;
    onDelete: (member: CompanyMember) => Promise<void>;
    onTransferOwnership: (member: CompanyMember) => void;
    onAssignRole: (member: CompanyMember) => void;
    deleteMemberMutation: {
        isPending: boolean;
    };
    roles: { id: number; name?: string | null }[];
}

export default function MembersTable({
    members,
    companyId,
    roles,
    deletingUserId,
    onDelete,
    onTransferOwnership,
    onAssignRole,
    deleteMemberMutation
}: MembersTableProps) {
    const { t } = useTranslation();

    // State mới để quản lý dropdownFF
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Hàm để bật/tắt dropdown cho từng dòng
    const toggleDropdown = useCallback((userId: string) => {
        setOpenDropdownId(prevId => (prevId === userId ? null : userId));
    }, []);

    const columns = useMemo(
        () => [
            {
                header: '#',
                accessorKey: 'id',
                enableColumnFilter: false,
                enableSorting: false,
                cell: (cell: any) => cell.row.index + 1,
            },
            {
                header: t("Email"),
                accessorKey: "email",
                accessorFn: (row: CompanyMember) => row.email ?? row.invitedEmail ?? row.userId,
                enableColumnFilter: false,
                cell: (cell: any) => cell.getValue() ?? '—',
            },
            {
                header: t("Role"),
                accessorKey: "roleId",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    const member = cell.row.original;
                    const role = roles?.find(r => r.id === member.roleId);
                    const roleName = role ? role.name : t('No Role');

                    return (member.owner) ?
                        <span className="badge text-uppercase bg-success-subtle text-success">{t('Owner')}</span>
                        : <span className="badge text-uppercase bg-dark-subtle text-black">{roleName}</span>;
                },
            },
            {
                header: t("Owner") + "?",
                accessorKey: "owner",
                enableColumnFilter: false,
                cell: (cell: any) => cell.getValue() ? 'Yes' : 'No',
            },
            {
                header: t("JoinedAt"),
                accessorKey: "joinedAt",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    const joinedAt = cell.getValue();
                    return joinedAt ? new Date(joinedAt).toLocaleString() : '—';
                },
            },
            {
                header: t("Action"),
                id: 'action', // Thêm id cho cột action
                cell: (cellProps: any) => {
                    const member = cellProps.row.original;
                    const isDeleting = deletingUserId === member.userId || deleteMemberMutation.isPending;

                    return (
                <Dropdown
                    isOpen={openDropdownId === member.userId}
                    toggle={() => toggleDropdown(member.userId)}
                >
                    <DropdownToggle
                        tag="button"
                        className="btn btn-ghost-secondary btn-icon btn-sm"
                        title={t('MoreOptions') as string}
                    >
                        <i className="ri-more-2-fill fs-16"></i>
                    </DropdownToggle>

                    <DropdownMenu strategy="fixed"> {/* <-- THÊM PROP NÀY VÀO ĐÂY */}
                        {/* Nút Gán vai trò (Assign Role) */}
                        <DropdownItem
                            onClick={() => onAssignRole(member)}
                            disabled={member.owner}
                        >
                            <i className="ri-user-settings-line me-2"></i> {t('AssignRole')}
                        </DropdownItem>

                        {/* Nút Chuyển quyền sở hữu (Transfer Ownership) */}
                        <DropdownItem
                            onClick={() => onTransferOwnership(member)}
                            disabled={member.owner}
                        >
                            <i className="ri-exchange-line me-2"></i> {t('TransferOwnership')}
                        </DropdownItem>

                        <DropdownItem divider />

                        {/* Nút Xóa (Delete) */}
                        <DropdownItem
                            onClick={() => onDelete(member)}
                            disabled={isDeleting || member.owner}
                            className="text-danger"
                        >
                            <i className="ri-delete-bin-5-line me-2"></i> {t('DeleteMember')}
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            );
        },
    },
],
        // Cập nhật mảng phụ thuộc
                [deletingUserId, deleteMemberMutation.isPending, onTransferOwnership, onDelete, onAssignRole, t, openDropdownId, toggleDropdown, roles]
    );

    return (
        <TableContainer
            columns={columns}
            data={members || []}
            isGlobalFilter={false}
            customPageSize={10}
            divClass="table-responsive table-card mb-1 mt-0"
            tableClass="align-middle table-nowrap"
            theadClass="table-light text-muted text-uppercase"
        />
    );
}