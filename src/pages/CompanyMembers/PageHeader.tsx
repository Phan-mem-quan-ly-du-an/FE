import React from 'react';
import {Link} from 'react-router-dom';

interface PageHeaderProps {
    companyId: string;
    onAddMember: () => void;
    onBack: () => void;
}

export default function PageHeader({
    companyId,
    onAddMember,
    onBack
}: PageHeaderProps) {
    return (
        <div className="row">
            <div className="col-12 d-sm-flex align-items-center justify-content-between">
                <h4 className="mb-sm-0">Company Members</h4>
                <div className="d-flex gap-2">
                    <Link to={`/companies/${companyId}/roles`} className="btn btn-primary">
                        Role &amp; Permission Management
                    </Link>
                    <button className="btn btn-primary" onClick={onAddMember}>
                        <i className="ri-user-add-line me-1"></i>
                        Add Member
                    </button>
                    <button className="btn btn-secondary" onClick={onBack}>
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
}
