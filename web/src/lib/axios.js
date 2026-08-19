import axios from "axios";

const api = axios.create({
    baseURL:"https://hillo-t16j.onrender.com/api",
    withCredentials: true,
})

export default api;