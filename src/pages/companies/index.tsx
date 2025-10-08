import {callApiGetAllCompanies} from "../../apiCaller/companies";
import {useInfiniteQuery} from "@tanstack/react-query";

const Companies = () => {
    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        status,
    } = useInfiniteQuery({
        queryKey: ['projects'],
        queryFn: callApiGetAllCompanies,
        initialPageParam: 0,
        getNextPageParam: (lastPage: any) => {
            return lastPage.number < lastPage.totalPages ? lastPage.number + 1 : null;
        },
    })

    return (
        <div className="page-content">
            <p>Companies</p>
        </div>
    )
}

export default Companies
