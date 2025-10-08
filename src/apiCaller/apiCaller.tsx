import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

interface ApiCallMethodGet {
    endpoint?: string | null;
}

interface ApiCallMethodPost {
    endpoint?: string | null;
    data?: object | null;
}

export default class ApiCaller {
    private backendUrl = process.env.REACT_APP_API_URL + '/api';
    private endpoint = '';
    private requestOptions: AxiosRequestConfig = {
        withCredentials: true,
        headers: {
            'Accept-Language': ApiCaller.currentLanguage,
        },
    };

    private static _currentLanguage: string = 'vi';

    static get currentLanguage(): string {
        return ApiCaller._currentLanguage;
    }

    static setLanguage(languageCode: string): void {
        ApiCaller._currentLanguage = languageCode;
    }

    private static handleError(error: AxiosError) {
        if (error.response && error.response.status === 403) {
            const newError = new Error('Forbidden access');
            newError.name = 'ForbiddenError';
            return Promise.reject(newError);
        }

        return Promise.reject(error);
    }

    setUrl(endpoint: string) {
        this.endpoint += endpoint;
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
                throw new Error('URL is not set.');
            }
        }

        if (!this.requestOptions.headers) {
            this.requestOptions.headers = {};
        }
        this.requestOptions.headers['Accept-Language'] = ApiCaller.currentLanguage;
    }

    async get(options?: ApiCallMethodGet): Promise<AxiosResponse<unknown>> {
        this.prepareRequest(options);
        return await axios.get(this.backendUrl + this.endpoint, this.requestOptions).catch(ApiCaller.handleError);
    }

    async post(options?: ApiCallMethodPost): Promise<AxiosResponse<unknown>> {
        this.prepareRequest(options);
        return await axios
            .post(this.backendUrl + this.endpoint, options?.data, this.requestOptions)
            .catch(ApiCaller.handleError);
    }

    async put(options?: ApiCallMethodPost): Promise<AxiosResponse<unknown>> {
        this.prepareRequest(options);
        return await axios
            .put(this.backendUrl + this.endpoint, options?.data, this.requestOptions)
            .catch(ApiCaller.handleError);
    }

    async delete(options?: ApiCallMethodGet): Promise<AxiosResponse<unknown>> {
        this.prepareRequest(options);
        return await axios.delete(this.backendUrl + this.endpoint, this.requestOptions).catch(ApiCaller.handleError);
    }
}