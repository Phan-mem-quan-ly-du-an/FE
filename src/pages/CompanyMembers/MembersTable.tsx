import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CompanyMember } from '../../apiCaller/companyMembers';
import TableContainer from '../../Components/Common/TableContainer';

interface MembersTableProps {
    members: CompanyMember[];
    companyId: string;
    deletingUserId: string | null;
    onDelete: (member: CompanyMember) => void;
    onTransferOwnership: (member: CompanyMember) => void;
    deleteMemberMutation: {
        isPending: boolean;
    };
}

export default function MembersTable({
    members,
    companyId,
    deletingUserId,
    onDelete,
    onTransferOwnership,
    deleteMemberMutation
}: MembersTableProps) {
    const { t } = useTranslation();

    // Table columns configuration
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
                header: t("UserID"),
                accessorKey: "userId",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <span className="font-monospace">{cell.getValue()}</span>
                ),
            },
            {
                header: t("RoleID"),
                accessorKey: "roleId",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    const member = cell.row.original;
                    return member.owner ? (
                        <span className="badge text-uppercase bg-success-subtle text-success">{t('Owner')}</span>
                    ) : (
                        member.roleId ?? '—'
                    );
                },
            },
            {
                header: t("Owner") + "?",
                accessorKey: "owner",
                enableColumnFilter: false,
                cell: (cell: any) => cell.getValue() ? 'Yes' : 'No',
            },
            {
                header: t("InvitedEmail"),
                accessorKey: "invitedEmail",
                enableColumnFilter: false,
                cell: (cell: any) => cell.getValue() ?? '—',
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
                cell: (cellProps: any) => {
                    const member = cellProps.row.original;
                    const isDisabled = member.owner || deletingUserId === member.userId || deleteMemberMutation.isPending;
                    
                    return (
                        <ul className="list-inline hstack gap-2 mb-0">
                            <li className="list-inline-item">
                                <Link
                                    to={`/companies/${companyId}/members/${encodeURIComponent(member.userId)}/assign-role`}
                                    className="text-primary d-inline-block"
                                    title={t('AssignRole')}
                                >
                                    <i className="ri-user-settings-line fs-16"></i>
                                </Link>
                            </li>
                            <li className="list-inline-item">
                                <Link
                                    to="#"
                                    className="text-warning d-inline-block"
                                    onClick={() => onTransferOwnership(member)}
                                    style={{ 
                                        pointerEvents: member.owner ? 'none' : 'auto',
                                        opacity: member.owner ? 0.5 : 1 
                                    }}
                                    title={t('TransferOwnership')}
                                >
                                    <i className="ri-exchange-line fs-16"></i>
                                </Link>
                            </li>
                            <li className="list-inline-item">
                                <Link
                                    to="#"
                                    className="text-danger d-inline-block"
                                    onClick={() => onDelete(member)}
                                    style={{ 
                                        pointerEvents: isDisabled ? 'none' : 'auto',
                                        opacity: isDisabled ? 0.5 : 1 
                                    }}
                                    title={t('DeleteMember')}
                                >
                                    <i className="ri-delete-bin-5-fill fs-16"></i>
                                </Link>
                            </li>
                        </ul>
                    );
                },
            },
        ],
        [companyId, deletingUserId, deleteMemberMutation.isPending, onTransferOwnership, onDelete, t]
    );

    return (
        <TableContainer
            columns={columns}
            data={members || []}
            isGlobalFilter={true}
            customPageSize={10}
            divClass="table-responsive table-card mb-1 mt-0"
            tableClass="align-middle table-nowrap"
            theadClass="table-light text-muted text-uppercase"
            SearchPlaceholder="Search for user ID, email, or role..."
        />
    );
}