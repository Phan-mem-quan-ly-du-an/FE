import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import axiosClient from "./axiosClient";

interface ApiCallMethodGet {
    endpoint?: string | null;
}

interface ApiCallMethodPost {
    endpoint?: string | null;
    data?: object | null;
}

export default class ApiCaller {
    private backendUrl = process.env.REACT_APP_API_URL + "/api";
    private endpoint = "";
    private requestOptions: AxiosRequestConfig = {};

    private static handleError(error: AxiosError) {
        if (error.response && error.response.status === 403) {
            const newError = new Error("Forbidden access");
            newError.name = "ForbiddenError";
            return Promise.reject(newError);
        }

        return Promise.reject(error);
    }

    setUrl(endpoint: string) {
        this.endpoint += endpoint;
        return this;
    }

    setQueryParams(params: object) {
        this.requestOptions.params = params;
        return this;
    }

    setHeaders(options: AxiosRequestConfig) {
        this.requestOptions = { ...this.requestOptions, ...options };
        return this;
    }

    private prepareRequest(options?: ApiCallMethodGet | ApiCallMethodPost) {
        if (!this.endpoint) {
            if (options && options.endpoint) {
                this.setUrl(options.endpoint);
            } else {
                throw new Error("URL is not set.");
            }
        }

        if (!this.requestOptions.headers) {
            this.requestOptions.headers = {};
        }
    }

    async get(options?: ApiCallMethodGet): Promise<AxiosResponse<unknown>> {
        this.prepareRequest(options);
          return await axiosClient
            .get(this.endpoint, this.requestOptions)
            .catch(ApiCaller.handleError);
    }

    async post(options?: ApiCallMethodPost): Promise<AxiosResponse<unknown>> {
        this.prepareRequest(options);
        return await axiosClient
            .post(this.endpoint, options?.data, this.requestOptions)
            .catch(ApiCaller.handleError);
    }

    async put(options?: ApiCallMethodPost): Promise<AxiosResponse<unknown>> {
        this.prepareRequest(options);
        return await axiosClient
            .put(this.endpoint, options?.data, this.requestOptions)
            .catch(ApiCaller.handleError);
    }

    async patch(options?: ApiCallMethodPost): Promise<AxiosResponse<unknown>> {
        this.prepareRequest(options);
        return await axiosClient
            .patch(this.endpoint, options?.data, this.requestOptions)
            .catch(ApiCaller.handleError);
    }

    async delete(options?: ApiCallMethodGet): Promise<AxiosResponse<unknown>> {
        this.prepareRequest(options);
        return await axiosClient
            .delete(this.endpoint, this.requestOptions)
            .catch(ApiCaller.handleError);
    }

}
