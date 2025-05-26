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


