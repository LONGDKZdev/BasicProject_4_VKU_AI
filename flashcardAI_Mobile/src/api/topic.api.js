import axios from "axios";
import { BASE_API_URL } from "../constants/config";

const api = axios.create({
  baseURL: `${BASE_API_URL}/api/topics`,
  withCredentials: true,
});

export const getTopics = async () => {
  try {
    const response = await api.get("/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createTopic = async (topicData) => {
  try {
    const response = await api.post("/", topicData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Gọi endpoint ghép JSON có sẵn lọc trùng giống Web
export const appendJsonToTopicApi = async (topicId, rawJson) => {
  try {
    const response = await api.post("/append-json", {
      topicId: topicId,
      json: rawJson,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};