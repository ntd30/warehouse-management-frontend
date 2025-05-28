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

export const GetAllProduct = (data) => {
    const URL_BACKEND = `/api/products`;
    return axios.post(URL_BACKEND, data);
}
export const StockCheckAPI = (username, data) => {
    const URL_BACKEND = `/api/stockcheck/perform?username=${username}`;
    return axios.post(URL_BACKEND, data);
};
export const fetchStockCheckByDate = (date) => {
    const URL_BACKEND = `/api/stockcheck/by-date?date=${date}`;
    return axios.get(URL_BACKEND);
}
export const exportStockCheckExcelByDate = async (date) => {
    try {
        const response = await axios.get(`/api/stockcheck/export-excel`, {
            params: { date },
            responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;

        const contentDisposition = response.headers["content-disposition"];
        let fileName = "stock_check.xlsx";
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?/);
            if (match?.[1]) {
                fileName = match[1];
            }
        }

        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error("Lỗi khi xuất Excel:", error);
        throw error;
    }
};


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
    const URL_BACKEND = `/api/admin/roles?page=${current - 1}&size=${pageSize}`
    return axios.get(URL_BACKEND)
}

export const createUpdateRoleAPI = async (id, { name, description }) => {
    const URL_BACKEND = '/api/admin/roles';
    const data = { name, description, active: true };
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

export const goNhieuQuyenChoVaiTro = (roleId, permissionIds) => {
    const URL_BACKEND = `/api/admin/permissions/revoke`
    const data = {
        roleId: roleId,
        permissionIds: permissionIds
    }
    return axios.delete(URL_BACKEND, {
        data: data,
        headers: {
            "Content-Type": "application/json"
        }
    })
}

export const deleteRoleAPI = (id) => {
    const URL_BACKEND = `/api/admin/roles/${id}`;
    return axios.delete(URL_BACKEND);
};

export const fetchAllUsersAPI = (current, pageSize) => {
    const URL_BACKEND = `/api/admin/users?page=${current}&size=${pageSize}&sort=id,desc`;
    return axios.get(URL_BACKEND);
};

export const createUserAPI = (username, email, password, fullName, isActive, roleId) => {
    const URL_BACKEND = "/api/admin/users"
    const data = {
        username: username,
        email: email,
        password: password,
        fullName: fullName,
        isActive: isActive,
        roleId: roleId,
        address: '',
        // phoneNumber: ''
    }
    return axios.post(URL_BACKEND, data)
}

export const updateUserAPI = (id, fullName, isActive, roleId) => {
    const URL_BACKEND = `/api/admin/users/${id}`
    const data = {
        fullName: fullName,
        isActive: isActive,
        roleId: roleId,
        address: '',
        // phoneNumber: '',
    }
    return axios.put(URL_BACKEND, data)
}

export const deleteUserAPI = (id) => {
    const URL_BACKEND = `/api/admin/users/${id}`
    return axios.delete(URL_BACKEND)
}

export const countProductsAPI = () => {
    const URL_BACKEND = `/api/products/count`;
    return axios.get(URL_BACKEND);
};

export const countStockAPI = () => {
    const URL_BACKEND = `/api/inventories/count`;
    return axios.get(URL_BACKEND);
};

export const countTotalImportQuantityAPI = () => {
    const URL_BACKEND = `/api/stock-in/count`;
    return axios.get(URL_BACKEND);
};

export const countTotalExportQuantityAPI = () => {
    const URL_BACKEND = `/api/stock-out/count`;
    return axios.get(URL_BACKEND);
};

export const fetchProductsPaginationAPI = (current, pageSize) => {
    const URL_BACKEND = `/api/products?page=${current}&size=${pageSize}&sort=createdAt,desc`
    return axios.get(URL_BACKEND)
}

export const createProductAPI = (formData) => {
    const URL_BACKEND = "api/products/create";
    return axios.post(URL_BACKEND, formData);
};

export const deleteProductAPI = (id) => {
    const URL_BACKEND = `/api/products/${id}`
    return axios.delete(URL_BACKEND)
}

export const updateProductAPI = (productCode, values) => {
    const URL_BACKEND = `api/products/${productCode}`;
    const data = {
        name: values.name,
        unit: values.unit,
        productCode: values.productCode,
        supplierId: values.supplierId
    }

    return axios.put(URL_BACKEND, data);
}

export const fetchStockInHistoryAPI = (current, pageSize) => {
    const URL_BACKEND = `/api/stock-in/stockin/forms?page=${current}&size=${pageSize}`;
    return axios.get(URL_BACKEND);
}

export const fetchFormDetailsAPI = (id) => {
    const URL_BACKEND = `/api/stock-in/forms/${id}`;
    return axios.get(URL_BACKEND);
}

export const fetchStockOutHistoryAPI = (current, pageSize) => {
    const URL_BACKEND = `/api/stock-out/forms?page=${current}&size=${pageSize}`;
    return axios.get(URL_BACKEND);
}

export const fetchFormOutDetailsAPI = (id) => {
    const URL_BACKEND = `/api/stock-out/forms/${id}`;
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

export const fetchProductReportAPI = async (filterType, page = 0, size = 10, startDate, endDate) => {
    try {
        const response = await axios.get('/api/reports/products', {
            params: { filterType, page, size, startDate, endDate }
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

export const fetchAllSettingsAPI = async () => {
    try {
        const response = await axios.get('/api/settings/list');
        return response;
    } catch (error) {
        throw error;
    }
};

export const createSettingAPI = async (key, value, description) => {
    try {
        const response = await axios.post('/api/settings/create', { key, value, description });
        return response;
    } catch (error) {
        throw error;
    }
};

export const updateSettingAPI = async (key, value, description) => {
    try {
        const response = await axios.put('/api/settings/update', { key, value, description });
        return response;
    } catch (error) {
        throw error;
    }
};

export const deleteSettingAPI = async (key) => {
    try {
        const response = await axios.delete('/api/settings/delete', { params: { key } });
        return response;
    } catch (error) {
        throw error;
    }
};

export const fetchLowStockAlertEnabledAPI = async () => {
    try {
        const response = await axios.get('/api/settings/low-stock-alert-enabled');
        return response;
    } catch (error) {
        throw error;
    }
};

export const fetchLowStockAlertEmailsAPI = async () => {
    try {
        const response = await axios.get('/api/settings/low-stock-alert-emails');
        return response;
    } catch (error) {
        throw error;
    }
};


export const fetchAllProductsAPI = async () => {
    try {
        const response = await axios.get('/api/products');
        return response;
    } catch (error) {
        throw error;
    }
};

export const updateMinStockAPI = async (productCode, minStock) => {
    const URL_BACKEND = `api/products/${productCode}/min-stock`;
    return axios.put(URL_BACKEND, { minStock });
};

export const updateBatchMinStockAPI = async (updates) => {
    try {
        const response = await axios.put('/api/products/min-stock/batch', updates);
        return response;
    } catch (error) {
        throw error;
    }
};