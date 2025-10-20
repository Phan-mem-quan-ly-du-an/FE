import React, { useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Container, Row, Col, Card, CardHeader, CardBody } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import ChangePasswordModal from "./ChangePasswordModal";

const valOrDash = (v?: string) => (v && `${v}`.trim() ? `${v}` : "-");

export default function AccountPage() {
    const auth = useAuth();
    const [showChange, setShowChange] = useState(false);

    const email = valOrDash(auth.user?.profile?.email as string);
    const givenName = valOrDash(auth.user?.profile?.given_name as string);
    const familyName = valOrDash(auth.user?.profile?.family_name as string);
    const gender = valOrDash((auth.user?.profile as any)?.gender as string);

    const displayName = useMemo(() => {
        const full = `${auth.user?.profile?.given_name || ""} ${auth.user?.profile?.family_name || ""}`.trim();
        return (
            full ||
            (auth.user?.profile?.name as string) ||
            (auth.user?.profile?.preferred_username as string) ||
            (auth.user?.profile?.email as string) ||
            "-"
        );
    }, [auth.user?.profile]);

    const initials = useMemo(() => {
        const n = (displayName || "").trim();
        const parts = n.split(" ").filter(Boolean);
        const s = parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join("");
        return s || "U";
    }, [displayName]);

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"My Account"} pageTitle={"My Account"} />

                <Row>
                    <Col>
                        <Card>
                            <CardHeader className="card-header border-0">
                                <div className="d-sm-flex align-items-center justify-content-between gap-2">
                                    <h5 className="card-title mb-0">My Account</h5>
                                    <div className="d-flex flex-wrap gap-2 justify-content-sm-end">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => setShowChange(true)}
                                        >
                                            <i className="ri-lock-password-line me-1"></i>Change password
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="pt-0">
                                <div className="table-responsive table-card mb-1 mt-0">
                                    <table className="table align-middle table-nowrap">
                                        <thead className="table-light text-muted text-uppercase">
                                        <tr>
                                            <th style={{ width: 260 }}>Field</th>
                                            <th>Value</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {/* Avatar / Display */}
                                        <tr>
                                            <td>Avatar</td>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div
                                                        className="d-inline-flex align-items-center justify-content-center"
                                                        style={{
                                                            width: 48, height: 48, borderRadius: "50%",
                                                            background: "#f1f3f5", border: "1px solid rgba(0,0,0,.06)",
                                                            fontWeight: 700
                                                        }}
                                                        aria-label="avatar"
                                                    >
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold">{displayName}</div>
                                                        <div className="text-muted small">{email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td>Email</td>
                                            <td>{email}</td>
                                        </tr>
                                        <tr>
                                            <td>Display name</td>
                                            <td>{displayName}</td>
                                        </tr>
                                        <tr>
                                            <td>Given name</td>
                                            <td>{givenName}</td>
                                        </tr>
                                        <tr>
                                            <td>Family name</td>
                                            <td>{familyName}</td>
                                        </tr>
                                        <tr>
                                            <td>Gender</td>
                                            <td>{gender}</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Change Password Modal (đã làm đẹp) */}
                <ChangePasswordModal
                    open={showChange}
                    onClose={() => setShowChange(false)}
                    accessToken={auth.user?.access_token || ""}
                    onChanged={() => {}}
                />
            </Container>
        </div>
    );
}
