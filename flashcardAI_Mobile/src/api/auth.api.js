import axios from "axios";

// Đổi IP này thành IPv4 máy tính của bạn (Mở CMD gõ ipconfig)
const BASE_URL = "http://192.168.X.X:8080";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  // Cấu hình để nhận Session Cookie từ Spring Boot giống như trên Web
  withCredentials: true,
});

export const loginApi = async (username, password) => {
  try {
    // Gọi đến API đăng nhập của Spring Boot
    const response = await api.post("/login", null, {
      params: { username, password },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const registerApi = async (username, email, password) => {
  try {
    // Khớp với @PostMapping("/register") trong AuthController.java
    const response = await api.post("/register", null, {
      params: { username, email, password },
    });
    return response;
  } catch (error) {
    throw error;
  }
};
