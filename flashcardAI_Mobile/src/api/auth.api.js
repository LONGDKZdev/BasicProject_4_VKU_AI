import axios from "axios";
import { BASE_API_URL } from "../constants/config";

const api = axios.create({
  baseURL: BASE_API_URL,
  timeout: 10000,
  withCredentials: true,
});

export const loginApi = async (username, password) => {
  try {
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
    const response = await api.post("/register", null, {
      params: { username, email, password },
    });
    return response;
  } catch (error) {
    throw error;
  }
};