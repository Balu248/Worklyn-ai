import axios from "axios"

const API_BASE_URL = "http://localhost:8000"

function getToken() {
  return localStorage.getItem("token")
}

export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use(
  (config) => {
    const token = getToken()
    console.log("Token:", token)

    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status

    if (status === 401) {
      console.warn("[api] 401 Unauthorized - redirecting to /login")
      localStorage.removeItem("token")

      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }

    return Promise.reject(error)
  }
)
