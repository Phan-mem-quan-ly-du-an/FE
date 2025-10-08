import ApiCaller from "./caller/apiCaller";

export const callApiGetAllCompanies = async ({ pageParam }: any) => {
    console.log(pageParam)
  const {data} = await new ApiCaller()
      .setUrl('/companies/admin/all')
      .get()
return data
}