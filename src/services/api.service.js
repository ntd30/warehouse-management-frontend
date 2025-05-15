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