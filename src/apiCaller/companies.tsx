import ApiCaller from "./caller/apiCaller";

export const callApiGetAllCompanies = async () => {
  const {data} = await new ApiCaller()
      .setUrl('/companies/admin/all')
      .get()
    console.log(data)
}