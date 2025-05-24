import axios from './axios.customize'

export const loginAPI = (username, password) => {
    const URL_BACKEND = "/api/auth/login"
    const data = {
        username: username,
        password: password,
        // delay: 2000
    }
    return axios.post(URL_BACKEND, data)
}

export const registerAPI = (username, email, password, fullName) => {
    const URL_BACKEND = "/api/auth/register"
    const data = {
        username: username,
        email: email,
        password: password,
        fullName: fullName
    }
    return axios.post(URL_BACKEND, data)
}

export const fetchProductByCodeAPI = (productCode) => {
    const URL_BACKEND = `/api/products/${productCode}`;
    return axios.get(URL_BACKEND);
}

export const warehouse = (formData) => {
    const URL_BACKEND = `/api/stock-in`;
    return axios.post(URL_BACKEND, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

export const StockOutAPI = (data) => {
    const URL_BACKEND = `/api/stock-out`;
    return axios.post(URL_BACKEND, data);
}

export const getProfileAPI = () => {
    const URL_BACKEND = `/api/auth/profile`;
    return axios.get(URL_BACKEND);
}


export const fetchWarehouseReportAPI = async (startDate, endDate, reportType) => {
    try {
        const response = await axios.get('/api/reports/warehouse', {
            params: { startDate, endDate, reportType }
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const exportWarehouseReportAPI = async (startDate, endDate, reportType) => {
    try {
        const response = await axios.get('/api/reports/warehouse/export', {
            params: { startDate, endDate, reportType },
            responseType: 'blob'
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const fetchProductReportAPI = async (filterType) => {
    try {
        const response = await axios.get('/api/reports/products', {
            params: { filterType }
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const exportProductReportAPI = async (filterType) => {
    try {
        const response = await axios.get('/api/reports/products/export', {
            params: { filterType },
            responseType: 'blob'
        });
        return response;
    } catch (error) {
        throw error;
    }
};


export const fetchDemandForecastAPI = async (productCode) => {
    try {
        const response = await axios.get('/api/forecast/demand', {
            params: { productCode: productCode !== 'all' ? productCode : undefined }
        });
        return response;
    } catch (error) {
        throw error;
    }
};