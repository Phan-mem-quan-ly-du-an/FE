import React from 'react';
import {Link} from 'react-router-dom';
import {CompanyMember} from '../../apiCaller/companyMembers';

interface MembersTableProps {
    members: CompanyMember[];
    loading: boolean;
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
    loading,
    companyId,
    deletingUserId,
    onDelete,
    onTransferOwnership,
    deleteMemberMutation
}: MembersTableProps) {
    return (
        <div className="row mt-3">
            <div className="col-12">
                <div className="table-responsive">
                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th style={{width: 60}}>#</th>
                                <th>User ID</th>
                                <th>Role ID</th>
                                <th>Owner?</th>
                                <th>Invited Email</th>
                                <th>Joined At</th>
                                <th style={{width: 260}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={7} className="text-center py-5">
                                        Loading...
                                    </td>
                                </tr>
                            )}
                            {!loading && members.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center text-muted py-5">
                                        No members
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                members.map((m, idx) => (
                                    <tr key={m.id}>
                                        <td>{idx + 1}</td>
                                        <td className="font-monospace">{m.userId}</td>
                                        <td>{m.owner ? <span
                                            className="badge bg-success">Owner</span> : (m.roleId ?? '—')}</td>
                                        <td>{m.owner ? 'Yes' : 'No'}</td>
                                        <td>{m.invitedEmail ?? '—'}</td>
                                        <td>{m.joinedAt ? new Date(m.joinedAt).toLocaleString() : '—'}</td>
                                        <td>
                                            <div className="btn-group">
                                                <Link
                                                    className="btn btn-sm btn-outline-primary"
                                                    to={`/companies/${companyId}/members/${encodeURIComponent(m.userId)}/assign-role`}
                                                >
                                                    Assign role
                                                </Link>

                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => onDelete(m)}
                                                    disabled={m.owner || deletingUserId === m.userId || deleteMemberMutation.isPending}
                                                >
                                                    {deletingUserId === m.userId ? 'Deleting...' : 'Delete'}
                                                </button>

                                                <button
                                                    className="btn btn-sm btn-outline-warning"
                                                    onClick={() => onTransferOwnership(m)}
                                                    disabled={m.owner}
                                                    title="Transfer ownership"
                                                >
                                                    Transfer owner
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
