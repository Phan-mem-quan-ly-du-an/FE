import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, DropdownItem, DropdownMenu, DropdownToggle, Row, UncontrolledDropdown } from 'reactstrap';

//import images

//SimpleBar
import SimpleBar from "simplebar-react";

const OverviewTab = () => {
    return (
        <React.Fragment>
            <Row>
                <Col xl={9} lg={8}>
                    <Card>
                        <CardBody>
                            <div className="text-muted">
                                <h6 className="mb-3 fw-semibold text-uppercase">Summary</h6>
                                <p>It will be as simple as occidental in fact, it will be Occidental. To an English person, it will seem like simplified English, as a skeptical Cambridge friend of mine told me what Occidental is. The European languages are members of the same family. Their separate existence is a myth. For science, music, sport, etc, Europe uses the same vocabulary. The languages only differ in their grammar, their pronunciation and their most common words.</p>

                                <ul className="ps-4 vstack gap-2">
                                    <li>Product Design, Figma (Software), Prototype</li>
                                    <li>Four Dashboards : Ecommerce, Analytics, Project,etc.</li>
                                    <li>Create calendar, chat and email app pages.</li>
                                    <li>Add authentication pages.</li>
                                    <li>Content listing.</li>
                                </ul>

                                <div>
                                    <button type="button" className="btn btn-link link-secondary p-0">Read more</button>
                                </div>

                                <div className="pt-3 border-top border-top-dashed mt-4">
                                    <Row className="gy-3">

                                        <Col lg={3} sm={6}>
                                            <div>
                                                <p className="mb-2 text-uppercase fw-medium">Create Date :</p>
                                                <h5 className="fs-15 mb-0">15 Sep, 2021</h5>
                                            </div>
                                        </Col>
                                        <Col lg={3} sm={6}>
                                            <div>
                                                <p className="mb-2 text-uppercase fw-medium">Due Date :</p>
                                                <h5 className="fs-15 mb-0">29 Dec, 2021</h5>
                                            </div>
                                        </Col>
                                        <Col lg={3} sm={6}>
                                            <div>
                                                <p className="mb-2 text-uppercase fw-medium">Priority :</p>
                                                <div className="badge bg-success fs-12">High</div>
                                            </div>
                                        </Col>
                                        <Col lg={3} sm={6}>
                                            <div>
                                                <p className="mb-2 text-uppercase fw-medium">Status :</p>
                                                <div className="badge bg-primary fs-12">Inprogress</div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pt-3 border-top border-top-dashed mt-4">
                                    <h6 className="mb-3 fw-semibold text-uppercase">Resources</h6>
                                    <Row className="g-3">
                                        <Col xxl={4} lg={6}>
                                            <div className="border rounded border-dashed p-2">
                                                <div className="d-flex align-items-center">
                                                    <div className="flex-shrink-0 me-3">
                                                        <div className="avatar-sm">
                                                            <div className="avatar-title bg-light text-primary rounded fs-24">
                                                                <i className="ri-folder-zip-line"></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-grow-1 overflow-hidden">
                                                        <h5 className="fs-13 mb-1"><Link to="#" className="text-dark text-truncate d-block">App pages.zip</Link></h5>
                                                        <div>2.2MB</div>
                                                    </div>
                                                    <div className="flex-shrink-0 ms-2">
                                                        <div className="d-flex gap-1">
                                                            <button type="button" className="btn btn-icon text-muted btn-sm fs-18"><i className="ri-download-2-line"></i></button>
                                                            <UncontrolledDropdown>
                                                                <DropdownToggle tag="button" className="btn btn-icon text-muted btn-sm fs-18 dropdown">
                                                                    <i className="ri-more-fill"></i>
                                                                </DropdownToggle>
                                                                <DropdownMenu>
                                                                    <li><DropdownItem><i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Rename</DropdownItem></li>
                                                                    <li><DropdownItem><i className="ri-delete-bin-fill align-bottom me-2 text-muted"></i> Delete</DropdownItem></li>
                                                                </DropdownMenu>
                                                            </UncontrolledDropdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>

                                        <Col xxl={4} lg={6}>
                                            <div className="border rounded border-dashed p-2">
                                                <div className="d-flex align-items-center">
                                                    <div className="flex-shrink-0 me-3">
                                                        <div className="avatar-sm">
                                                            <div className="avatar-title bg-light text-primary rounded fs-24">
                                                                <i className="ri-file-ppt-2-line"></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-grow-1 overflow-hidden">
                                                        <h5 className="fs-13 mb-1"><Link to="#" className="text-dark text-truncate d-block">Velzon admin.ppt</Link></h5>
                                                        <div>2.4MB</div>
                                                    </div>
                                                    <div className="flex-shrink-0 ms-2">
                                                        <div className="d-flex gap-1">
                                                            <button type="button" className="btn btn-icon text-muted btn-sm fs-18"><i className="ri-download-2-line"></i></button>
                                                            <UncontrolledDropdown>
                                                                <DropdownToggle tag="button" className="btn btn-icon text-muted btn-sm fs-18 dropdown">
                                                                    <i className="ri-more-fill"></i>
                                                                </DropdownToggle>
                                                                <DropdownMenu>
                                                                    <li><DropdownItem><i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Rename</DropdownItem></li>
                                                                    <li><DropdownItem><i className="ri-delete-bin-fill align-bottom me-2 text-muted"></i> Delete</DropdownItem></li>
                                                                </DropdownMenu>
                                                            </UncontrolledDropdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </CardBody>

                    </Card>

                </Col>

                <Col xl={3} lg={4}>
                    <Card>
                        <CardBody>
                            <h5 className="card-title mb-4">Skills</h5>
                            <div className="d-flex flex-wrap gap-2 fs-16">
                                <div className="badge fw-medium bg-secondary-subtle text-secondary">UI/UX</div>
                                <div className="badge fw-medium bg-secondary-subtle text-secondary">Figma</div>
                                <div className="badge fw-medium bg-secondary-subtle text-secondary">HTML</div>
                                <div className="badge fw-medium bg-secondary-subtle text-secondary">CSS</div>
                                <div className="badge fw-medium bg-secondary-subtle text-secondary">Javascript</div>
                                <div className="badge fw-medium bg-secondary-subtle text-secondary">C#</div>
                                <div className="badge fw-medium bg-secondary-subtle text-secondary">Nodejs</div>
                            </div>
                        </CardBody>

                    </Card>


                    <Card>
                        <CardHeader className="align-items-center d-flex border-bottom-dashed">
                            <h4 className="card-title mb-0 flex-grow-1">Attachments</h4>
                            <div className="flex-shrink-0">
                                <button type="button" className="btn btn-soft-primary btn-sm"><i className="ri-upload-2-fill me-1 align-bottom"></i> Upload</button>
                            </div>
                        </CardHeader>

                        <CardBody>

                            <div className="vstack gap-2">
                                <div className="border rounded border-dashed p-2">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0 me-3">
                                            <div className="avatar-sm">
                                                <div className="avatar-title bg-light text-primary rounded fs-24">
                                                    <i className="ri-folder-zip-line"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 overflow-hidden">
                                            <h5 className="fs-13 mb-1"><Link to="#" className="text-dark text-truncate d-block">App-pages.zip</Link></h5>
                                            <div>2.2MB</div>
                                        </div>
                                        <div className="flex-shrink-0 ms-2">
                                            <div className="d-flex gap-1">
                                                <button type="button" className="btn btn-icon text-muted btn-sm fs-18"><i className="ri-download-2-line"></i></button>
                                                <UncontrolledDropdown>
                                                    <DropdownToggle tag="button" className="btn btn-icon text-muted btn-sm fs-18 dropdown" type="button">
                                                        <i className="ri-more-fill"></i>
                                                    </DropdownToggle>
                                                    <DropdownMenu>
                                                        <li><DropdownItem><i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Rename</DropdownItem></li>
                                                        <li><DropdownItem><i className="ri-delete-bin-fill align-bottom me-2 text-muted"></i> Delete</DropdownItem></li>
                                                    </DropdownMenu>
                                                </UncontrolledDropdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border rounded border-dashed p-2">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0 me-3">
                                            <div className="avatar-sm">
                                                <div className="avatar-title bg-light text-primary rounded fs-24">
                                                    <i className="ri-file-ppt-2-line"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 overflow-hidden">
                                            <h5 className="fs-13 mb-1"><Link to="#" className="text-dark text-truncate d-block">Velzon-admin.ppt</Link></h5>
                                            <div>2.4MB</div>
                                        </div>
                                        <div className="flex-shrink-0 ms-2">
                                            <div className="d-flex gap-1">
                                                <button type="button" className="btn btn-icon text-muted btn-sm fs-18"><i className="ri-download-2-line"></i></button>
                                                <UncontrolledDropdown>
                                                    <DropdownToggle tag="button" className="btn btn-icon text-muted btn-sm fs-18 dropdown" type="button">
                                                        <i className="ri-more-fill"></i>
                                                    </DropdownToggle>
                                                    <DropdownMenu>
                                                        <li><DropdownItem><i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Rename</DropdownItem></li>
                                                        <li><DropdownItem><i className="ri-delete-bin-fill align-bottom me-2 text-muted"></i> Delete</DropdownItem></li>
                                                    </DropdownMenu>
                                                </UncontrolledDropdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border rounded border-dashed p-2">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0 me-3">
                                            <div className="avatar-sm">
                                                <div className="avatar-title bg-light text-primary rounded fs-24">
                                                    <i className="ri-folder-zip-line"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 overflow-hidden">
                                            <h5 className="fs-13 mb-1"><Link to="#" className="text-dark text-truncate d-block">Images.zip</Link></h5>
                                            <div>1.2MB</div>
                                        </div>
                                        <div className="flex-shrink-0 ms-2">
                                            <div className="d-flex gap-1">
                                                <button type="button" className="btn btn-icon text-muted btn-sm fs-18"><i className="ri-download-2-line"></i></button>
                                                <UncontrolledDropdown>
                                                    <DropdownToggle tag="button" className="btn btn-icon text-muted btn-sm fs-18 dropdown" type="button">
                                                        <i className="ri-more-fill"></i>
                                                    </DropdownToggle>
                                                    <DropdownMenu>
                                                        <li><DropdownItem><i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Rename</DropdownItem></li>
                                                        <li><DropdownItem><i className="ri-delete-bin-fill align-bottom me-2 text-muted"></i> Delete</DropdownItem></li>
                                                    </DropdownMenu>
                                                </UncontrolledDropdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border rounded border-dashed p-2">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0 me-3">
                                            <div className="avatar-sm">
                                                <div className="avatar-title bg-light text-primary rounded fs-24">
                                                    <i className="ri-image-2-line"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 overflow-hidden">
                                            <h5 className="fs-13 mb-1"><Link to="#" className="text-dark text-truncate d-block">bg-pattern.png</Link></h5>
                                            <div>1.1MB</div>
                                        </div>
                                        <div className="flex-shrink-0 ms-2">
                                            <div className="d-flex gap-1">
                                                <button type="button" className="btn btn-icon text-muted btn-sm fs-18"><i className="ri-download-2-line"></i></button>
                                                <UncontrolledDropdown>
                                                    <DropdownToggle tag="button" className="btn btn-icon text-muted btn-sm fs-18 dropdown" type="button">
                                                        <i className="ri-more-fill"></i>
                                                    </DropdownToggle>
                                                    <DropdownMenu>
                                                        <li><DropdownItem><i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Rename</DropdownItem></li>
                                                        <li><DropdownItem><i className="ri-delete-bin-fill align-bottom me-2 text-muted"></i> Delete</DropdownItem></li>
                                                    </DropdownMenu>
                                                </UncontrolledDropdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 text-center">
                                    <button type="button" className="btn btn-primary">View more</button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default OverviewTab;