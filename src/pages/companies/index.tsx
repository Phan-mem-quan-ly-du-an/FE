import {callApiGetAllCompanies} from "../../apiCaller/companies";

const Companies = () => {
    const data = callApiGetAllCompanies()
    return (
        <div className="page-content">
            <p>Companies</p>
        </div>
    )
}

export default Companies
