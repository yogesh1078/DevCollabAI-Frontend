import axios from "axios"

const axiosInstance = axios.create({
    baseURL : import.meta.env.VITE_BASE_SERVER_URL,
    headers :{
        "Authorization" : `Bearer ${localStorage.getItem('token')}`
    }
})

export default axiosInstance;