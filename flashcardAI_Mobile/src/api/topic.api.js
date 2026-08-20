import axios from "axios";

const BASE_URL = "http://192.168.X.X:8080/api/topics";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Quan trọng để Spring Boot nhận diện user đang đăng nhập
});

// Lấy danh sách Flashcard (Khớp với @GetMapping trong TopicController)
export const getTopics = async () => {
  try {
    const response = await api.get("/");
    return response.data; // Trả về mảng JSON chứa các Topic
  } catch (error) {
    throw error;
  }
};

// Lưu Flashcard mới (Khớp với @PostMapping)
export const createTopic = async (topicData) => {
  try {
    // topicData chứa { name, count, color, dataJson }
    const response = await api.post("/", topicData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
