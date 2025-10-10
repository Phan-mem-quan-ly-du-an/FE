import React from 'react';
import {Card, CardBody, Col, Row} from 'reactstrap';
import SimpleBar from 'simplebar-react';
import {Link} from 'react-router-dom';
import Logo1 from "../../assets/images/companies/img-1.png";
import Logo2 from "../../assets/images/companies/img-2.png";
import Logo3 from "../../assets/images/companies/img-3.png";
import Logo4 from "../../assets/images/companies/img-4.png";
import Logo5 from "../../assets/images/companies/img-5.png";
import Logo6 from "../../assets/images/companies/img-6.png";

const CompaniesList = () => {
    const companies = [
        { id: 1, name: 'Acme Corp', logo: Logo1 },
        { id: 2, name: 'Globex Inc', logo: Logo2 },
        { id: 3, name: 'Initech', logo: Logo3 },
        { id: 4, name: 'Hooli', logo: Logo4 },
        { id: 5, name: 'Stark Industries', logo: Logo5 },
        { id: 6, name: 'Wayne Enterprises', logo: Logo6 },
    ];

    return (
        <React.Fragment>
            <Row className="justify-content-center">
                <Col xxl={5}>
                    <Card
                        className="rounded-3"
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(12px)'
                        }}
                    >
                        <div className="card-header align-items-center d-flex" style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'transparent' }}>
                            <h4 className="card-title mb-0 flex-grow-1 text-white">Companies</h4>
                        </div>
                        <CardBody>
                            <div className="table-responsive table-card">
                                <SimpleBar style={{ maxHeight: "405px" }}>
                                    <table className="table table-borderless align-middle">
                                        <tbody>
                                        {companies.map((company) => (
                                            <tr key={company.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        {company.logo ? (
                                                            <div className="avatar-sm rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm" style={{ padding: 4 }}>
                                                                <img
                                                                    src={company.logo}
                                                                    alt="logo"
                                                                    className="img-fluid rounded-circle"
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    onError={(e) => {
                                                                        const target = e.currentTarget as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="avatar-sm rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm">
                                                                <span className="fw-semibold text-dark">{company.name.charAt(0)}</span>
                                                            </div>
                                                        )}
                                                        <div className="ms-3">
                                                            <Link to={`/companies/${company.id}`} className="text-white text-decoration-none">
                                                                <h6 className="fs-15 mb-0 fw-semibold text-white">{company.name}</h6>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-end">
                                                    <Link to={`/companies/${company.id}`} className="btn btn-sm btn-outline-light">View</Link>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </SimpleBar>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default CompaniesList;


