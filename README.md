# FlashcardAI - Smart Flashcard Learning System with AI Integration 🚀🧠

Dự án xây dựng hệ thống học tập và ghi nhớ **Flashcard thông minh đa nền tảng (Spring Boot Backend + React Native Mobile App)**, tích hợp trí tuệ nhân tạo (AI) tự động sinh nội dung thẻ từ vựng và hỗ trợ luyện phát âm chuẩn qua giọng nói.

---

## 🌟 Tính năng chính

### 1. Backend Service (Spring Boot - Port 8080)
* **Xác thực & Bảo mật tài khoản:** Đăng ký, đăng nhập và bảo mật thông tin người dùng qua Spring Security.
* **Quản trị dữ liệu (RESTful API):** Cung cấp các API chuẩn RESTful cho việc quản lý bộ chủ đề (`Topics`), thẻ học (`Flashcards`) và tiến trình học tập.
* **Tích hợp trí tuệ nhân tạo (AI Generator):** Tự động phân tích từ khóa chủ đề để sinh ra bộ từ vựng hoàn chỉnh (từ vựng, phiên âm IPA, giải nghĩa tiếng Việt, câu ví dụ và ngữ cảnh thực tế).
* **AI Chat Assistant:** Endpoint tương tác hội thoại trực tiếp với AI phục vụ giải đáp ngữ pháp, tra cứu từ vựng và tạo tình huống giao tiếp mẫu.

### 2. Mobile Client (React Native / Expo - Port 8081)
* **Giao diện đa nền tảng:** Tối ưu hóa trải nghiệm trên Android, iOS và Web Browser bằng **React Native 0.81.5** & **Expo SDK 54** (React 19)[cite: 5].
* **Cơ chế lật thẻ trực quan (Flip Card):** Hiệu ứng chuyển đổi mặt trước (Front - Thuật ngữ) và mặt sau (Back - Định nghĩa & Ví dụ) mượt mà.
* **Xử lý âm thanh & Giọng nói:**
  * **Text-to-Speech (`expo-speech`):** Tự động phát âm chuẩn từng từ vựng bằng giọng AI[cite: 5].
  * **Audio Recording (`expo-audio`):** Ghi âm giọng đọc của người dùng để luyện phản xạ và kiểm tra phát âm[cite: 5].
* **Lưu trữ phiên cục bộ:** Sử dụng `@react-native-async-storage/async-storage` để lưu token đăng nhập và trạng thái ứng dụng ngoại tuyến[cite: 5].

---

## 🛠️ Cấu trúc thư mục dự án

```text
flashcard_ai/
├── flashcardAI_Web/                      # Backend Spring Boot & Web Admin
│   ├── src/main/java/com/vku/flashcard_ai/
│   │   ├── config/                       # Cấu hình SecurityConfig, CORS
│   │   ├── controller/                   # REST API Controllers (Auth, Topic, AI, Chat)
│   │   ├── dto/                          # DTO Request/Response
│   │   ├── entity/                       # Database Entities (User, Topic, Flashcard)
│   │   ├── repository/                   # Spring Data JPA Repositories
│   │   ├── service/                      # Logic nghiệp vụ & Tích hợp AI Service
│   │   └── FlashcardAiApplication.java   # Điểm khởi chạy Backend Server
│   ├── src/main/resources/
│   │   └── application.properties        # Cấu hình Database & Port Server
│   └── pom.xml                           # Quản lý dependencies Maven
│
└── flashcardAI_Mobile/                   # Frontend Mobile App (React Native / Expo)[cite: 5]
    ├── src/
    │   ├── api/                          # Client API (Axios instance, auth, topic, ai)[cite: 5]
    │   ├── components/                   # Custom UI Components (FlashcardItem, Header, Input)
    │   ├── navigation/                   # Cấu hình Stack Navigator (AppNavigator)
    │   └── screens/                      # Màn hình giao diện (Login, Register, Home, Study, AIChat)
    ├── app.json                          # Cấu hình Expo, quyền RECORD_AUDIO & EAS Project ID[cite: 5]
    ├── babel.config.js                   # Cấu hình Babel preset expo[cite: 5]
    ├── eas.json                          # Cấu hình build APK / Production EAS Build[cite: 5]
    ├── package.json                      # Quản lý dependencies di động (SDK 54)[cite: 5]
    └── index.js                          # Điểm khởi chạy Root của ứng dụng[cite: 5]
```

---

## ⚙️ Yêu cầu môi trường cài đặt

* **Java Development Kit (JDK):** Phiên bản **Java 17** hoặc **Java 21**.
* **Maven:** Đã cài đặt trong PATH hoặc dùng trực tiếp Maven Wrapper (`./mvnw`).
* **Node.js:** Phiên bản `>= 20.x` (kèm theo trình quản lý gói `npm`).
* **Cơ sở dữ liệu:** MySQL Server (hoặc cấu hình Database trong `application.properties`).
* **Thiết bị chạy Mobile:** 
  * Điện thoại thật đã cài app **Expo Go** (Android / iOS).
  * Hoặc máy ảo Android Emulator trên Android Studio.

---

## 🚀 Hướng dẫn cài đặt và khởi chạy hệ thống

### Bước 1: Khởi chạy Backend Server (`flashcardAI_Web`)

1. Mở cửa sổ Terminal thứ nhất và di chuyển vào thư mục Backend:
   ```cmd
   cd flashcardAI_Web
   ```
2. Khởi chạy server bằng Maven Wrapper:
   ```cmd
   ./mvnw spring-boot:run
   ```
   *Console sẽ hiển thị:*
   ```text
   =================================================
    FlashcardAI Backend is running on: http://localhost:8080
    Database Connection: Established
   =================================================
   ```

---

### Bước 2: Cài đặt và cấu hình ứng dụng Mobile (`flashcardAI_Mobile`)

1. Mở cửa sổ Terminal thứ hai và di chuyển vào thư mục Mobile:
   ```cmd
   cd flashcardAI_Mobile
   ```
2. Cài đặt toàn bộ dependencies:
   ```cmd
   npm install
   ```
3. Cấu hình địa chỉ IP kết nối Backend trong file `src/api/client.js`:
   * **Nếu test trên Trình duyệt Web / iOS Simulator:**
     ```javascript
     export const BASE_URL = 'http://localhost:8080';
     ```
   * **Nếu test trên Máy ảo Android Emulator:**
     ```javascript
     export const BASE_URL = '[http://10.0.2.2:8080](http://10.0.2.2:8080)';
     ```
   * **Nếu test trên Điện thoại thật (Expo Go):**
     Thay bằng địa chỉ IP LAN của máy tính đang chạy server (xem bằng lệnh `ipconfig`):
     ```javascript
     export const BASE_URL = '[http://192.168.1.](http://192.168.1.)X:8080';
     ```

---

### Bước 3: Khởi chạy Expo Metro Bundler

Khởi động Metro Bundler với tùy chọn dọn sạch cache:

```cmd
npx expo start -c
```

> **Lưu ý bỏ qua đăng nhập:** Khi Terminal hiển thị câu hỏi:
> ```text
> ? It is recommended to log in with your Expo account before proceeding.
> > Proceed anonymously
> ```
> Dùng phím **mũi tên xuống $\downarrow$** chọn **`Proceed anonymously`** rồi nhấn **Enter**.

---

## 📱 Hướng dẫn kết nối và sử dụng chi tiết

### 1. Các phương thức mở ứng dụng

#### A. Qua Điện thoại thật với Expo Go (Khuyên dùng)
* Kết nối điện thoại và máy tính vào **cùng một mạng Wi-Fi** (mạng máy tính đặt chế độ *Private*).
* Mở app **Expo Go** $\rightarrow$ Quét mã QR trên màn hình Terminal.
* *Trường hợp mạng Wi-Fi bị chặn kết nối nội bộ hoặc dùng 4G:* Dừng tiến trình (Ctrl + C) và chạy lệnh:
  ```cmd
  npx expo start --tunnel
  ```

#### B. Qua Trình duyệt Web (Mở nhanh)
* Nhấn phím **`w`** trên bàn phím trong Terminal đang chạy Metro Bundler.
* Trình duyệt sẽ tự động mở giao diện ứng dụng tại: `http://localhost:8081`.

#### C. Qua Máy ảo Android (Android Emulator)
* Mở sẵn máy ảo từ Android Studio $\rightarrow$ Nhấn phím **`a`** trong Terminal.

---

### 2. Hướng dẫn sử dụng các tính năng chính

* **Đăng ký / Đăng nhập:** Tạo tài khoản mới hoặc đăng nhập để lưu trữ phiên học tập an toàn trên thiết bị[cite: 5].
* **Quản lý Bộ Flashcard:** Nhấn biểu tượng `+` để thêm mới chủ đề, chọn màu sắc và thêm các thẻ học thủ công.
* **Tạo Flashcard tự động bằng AI:** Nhập tên chủ đề cần học (ví dụ: *IELTS Speaking Part 1*, *Từ vựng du lịch*) $\rightarrow$ Chọn số lượng thẻ $\rightarrow$ Hệ thống AI sẽ tự động sinh danh sách từ vựng kèm ngữ nghĩa và lưu vào tài khoản.
* **Chế độ Luyện tập:** 
  * Chạm để lật qua lại giữa 2 mặt của Flashcard.
  * Nhấn biểu tượng loa để nghe phát âm chuẩn bằng giọng AI (`expo-speech`)[cite: 5].
  * Nhấn giữ biểu tượng Micro để ghi âm giọng đọc của bạn và đối chiếu (`expo-audio`)[cite: 5].
* **AI Chat Assistant:** Chuyển sang tab AI Chat để trao đổi ngữ pháp, đặt câu hoặc nhờ AI giải thích nghĩa sâu của từ vựng.

---

## 📡 Danh mục API Endpoints chính (Backend)

| Method | Endpoint | Định dạng Body | Mô tả |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/auth/register` | `JSON` | Đăng ký tài khoản người dùng mới |
| **`POST`** | `/api/auth/login` | `JSON` | Đăng nhập hệ thống và cấp token |
| **`POST`** | `/api/auth/reset-password` | `JSON` | Đặt lại mật khẩu tài khoản |
| **`GET`** | `/api/topics` | *None* | Lấy danh sách toàn bộ chủ đề Flashcard |
| **`POST`** | `/api/topics` | `JSON` | Tạo chủ đề mới hoặc cập nhật |
| **`DELETE`**| `/api/topics/{id}` | *None* | Xóa chủ đề và các thẻ trực thuộc theo ID |
| **`POST`** | `/api/ai/generate-cards` | `JSON` | Yêu cầu AI sinh mảng từ vựng theo chủ đề |
| **`POST`** | `/api/ai/chat` | `JSON` | Gửi tin nhắn trò chuyện với Trợ lý AI Flashcard |

---

## 🛠️ Bảng tra cứu lệnh thực thi thông dụng

| Phân hệ | Lệnh thực thi | Mục đích |
| :--- | :--- | :--- |
| **Backend** | `mvn clean install` | Tải lại dependency và đóng gói file JAR |
| **Backend** | `mvn spring-boot:run` | Khởi chạy máy chủ Backend API |
| **Mobile** | `npm install` | Cài đặt toàn bộ thư viện React Native / Expo[cite: 5] |
| **Mobile** | `npx expo start -c` | Khởi chạy Metro Bundler kèm xóa sạch cache cũ |
| **Mobile** | `npx expo start --tunnel` | Khởi chạy chế độ Tunnel vượt Firewall và mạng 4G |
| **Mobile** | `npx expo install react-dom react-native-web` | Bổ sung thư viện hỗ trợ giao diện trên nền tảng Web[cite: 5] |