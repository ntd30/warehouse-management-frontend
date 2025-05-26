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

export const createSupplierAPI = async (supplierData) => {
    const URL_BACKEND = `/api/suppliers`;
    return await axios.post(URL_BACKEND, supplierData);
};

export const createLocationAPI = async (locationData) => {
    const URL_BACKEND = `/api/locations`;
    return await axios.post(URL_BACKEND, locationData);
};

export const fetchSuppliersAPI = async () => {
    const URL_BACKEND = `/api/suppliers`;
    return await axios.get(URL_BACKEND);
};

export const fetchLocationsAPI = async () => {
    const URL_BACKEND = `/api/locations`;
    return await axios.get(URL_BACKEND);
};

export const fetchAllPermissionsAPI = (current, pageSize) => {
    const URL_BACKEND = `/api/admin/permissions?page=${current}&size=${pageSize}`
    return axios.get(URL_BACKEND)
}

export const fetchAllRolesAPI = (current, pageSize) => {
    const URL_BACKEND = `/api/admin/roles?page=${current}&size=${pageSize}`
    return axios.get(URL_BACKEND)
}

export const createUpdateRoleAPI = async (id, { name, description }) => {
    const URL_BACKEND = '/api/admin/roles';
    const data = { name, description };
    if (id) {
        // Cập nhật vai trò
        return axios.put(`${URL_BACKEND}/${id}`, data);
    } else {
        // Thêm mới vai trò
        return axios.post(URL_BACKEND, data);
    }
};

export const ganNhieuQuyenChoVaiTro = (roleId, permissionIds) => {
    const URL_BACKEND = `/api/admin/permissions/assign`
    const data = {
        roleId: roleId,
        permissionIds: permissionIds
    }
    return axios.post(URL_BACKEND, data)
}

export const deleteRoleAPI = (id) => {
    const URL_BACKEND = `/api/admin/roles/${id}`;
    return axios.delete(URL_BACKEND);
};

export const fetchAllUsersAPI = (current, pageSize) => {
    const URL_BACKEND = `/api/admin/users?page=${current}&size=${pageSize}&sort=id,desc`;
    return axios.get(URL_BACKEND);
};

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