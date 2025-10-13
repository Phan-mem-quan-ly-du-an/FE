import React from 'react';
import {Card, CardBody, Col, Row} from 'reactstrap';
import SimpleBar from 'simplebar-react';
import {Link} from 'react-router-dom';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Company, Page} from '../../helpers/apiCaller/companies';
import {callApiGetAllCompanies} from '../../apiCaller/companies';

const CompaniesList = () => {
    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage
    } = useInfiniteQuery<Page<Company>>({
        queryKey: ['companies'],
        queryFn: async ({pageParam = 0}): Promise<Page<Company>> => callApiGetAllCompanies(pageParam as number) as Promise<Page<Company>>,
         getNextPageParam: (lastPage: Page<Company>) => (lastPage.last ? undefined : (lastPage.number + 1)),
        initialPageParam: 0
    });

    const companies = ((data?.pages as Array<Page<Company>> | undefined) || []).flatMap((p) => p.content || []);
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
                        <div className="card-header align-items-center d-flex"
                             style={{borderColor: 'rgba(255,255,255,0.15)', background: 'transparent'}}>
                            <h4 className="card-title mb-0 flex-grow-1 text-white">Companies</h4>
                        </div>
                        <CardBody>
                            <div className="table-responsive table-card">
                                <SimpleBar style={{maxHeight: '405px'}}>
                                    <table className="table table-borderless align-middle">
                                        <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td className="text-center py-4 text-white-50">Loading...</td>
                                            </tr>
                                        ) : isError ? (
                                            <tr>
                                                <td className="text-center py-4 text-danger">Failed to load companies
                                                </td>
                                            </tr>
                                        ) : companies.length === 0 ? (
                                            <tr>
                                                <td className="text-center py-4 text-white-50">No companies found</td>
                                            </tr>
                                        ) : companies.map((company: Company) => (
                                            <tr key={company.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        {company.logoUrl ? (
                                                            <div
                                                                className="avatar-sm rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm"
                                                                style={{padding: 4}}>
                                                                <img
                                                                    src={new URL(company.logoUrl, (process.env.REACT_APP_API_URL as string) || `${window.location.origin}/`).toString()}
                                                                    alt="logo"
                                                                    className="img-fluid rounded-circle"
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover'
                                                                    }}
                                                                    onError={(e) => {
                                                                        const target = e.currentTarget as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="avatar-sm rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm">
                                                                <span
                                                                    className="fw-semibold text-dark">{company.name.charAt(0)}</span>
                                                            </div>
                                                        )}
                                                        <div className="ms-3">
                                                            <Link to={`/companies/${company.id}`}
                                                                  className="text-white text-decoration-none">
                                                                <h6 className="fs-15 mb-0 fw-semibold text-white">{company.name}</h6>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-end">
                                                    <Link to={`/companies/${company.id}`}
                                                          className="btn btn-sm btn-outline-light">View</Link>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </SimpleBar>
                            </div>
                            <div className="d-flex justify-content-center mt-2">
                                {hasNextPage && (
                                    <button
                                        className="btn btn-sm btn-outline-light"
                                        disabled={isFetching || isFetchingNextPage}
                                        onClick={() => fetchNextPage()}
                                    >
                                        {isFetchingNextPage ? 'Loading...' : 'Load more'}
                                    </button>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default CompaniesList;


