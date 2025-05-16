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

