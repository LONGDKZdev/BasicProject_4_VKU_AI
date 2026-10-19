# HỆ THỐNG HỌC TẬP FLASHCARD THÔNG MINH ĐA NỀN TẢNG (WEB & MOBILE) TÍCH HỢP AI

Hệ thống hỗ trợ học tập và ghi nhớ từ vựng tiếng Anh toàn diện trên đa thiết bị, đạt độ tương thích và đồng bộ 100% giữa **Web Application (Spring Boot + Thymeleaf)** và **Mobile Application (React Native / Expo SDK 57)** thông qua nền tảng cơ sở dữ liệu thời gian thực **Google Cloud Firestore**.

---

## 🌟 TÍNH NĂNG CỐT LÕI

### 1. Đồng bộ hóa thời gian thực (Real-time Cross-Platform Synchronization)
* **Đồng bộ đa chiều:** Lưu trữ phi tập trung trên Cloud Firestore, đảm bảo mọi thao tác thêm, sửa, xóa, nạp bộ từ vựng hoặc đổi thông tin cá nhân trên Web lập tức cập nhật trên Mobile App và ngược lại.
* **Thuật toán sắp xếp ưu tiên (Timestamp Indexing):** Sử dụng trường `orderIndex` kiểu số nguyên dài (`long` / `Date.now()`). Bất kỳ bộ thẻ nào được thêm mới, cập nhật nội dung hoặc tương tác gần nhất sẽ tự động nhận dấu nhãn thời gian mới và nhảy lên vị trí đầu tiên của danh sách.

### 2. Kho chủ đề mẫu chuẩn & Thuật toán lọc trùng lặp từ vựng
* **Kho lưu trữ mẫu (`sample_topics`):** Cung cấp các bộ từ vựng chuẩn được phân loại theo chủ đề (Du lịch, Giao tiếp hằng ngày, Công sở, Học thuật).
* **Thuật toán khử trùng lặp (Deduplication Algorithm):**
  * *Chủ đề chưa có:* Tự động khởi tạo bộ thẻ mới vào danh mục cá nhân.
  * *Chủ đề đã tồn tại:* Hệ thống tự động phân tích mảng từ vựng, quét đối chiếu trường định danh `englishVocabulary`, loại bỏ các từ đã có sẵn và chỉ chèn thêm các từ mới mà không làm hỏng cấu trúc dữ liệu cũ.

### 3. Không gian học tương tác trực quan
* **Nền tảng Web:**
  * Băng chuyền 3D (Carousel) xoay lật thẻ mượt mà kèm âm thanh tương tác.
  * Dropdown điều hướng nhảy nhanh đến thẻ bất kỳ.
  * Phát âm chuẩn xác qua Web Speech API (tự động đảo ngữ điệu và tốc độ đọc khi nghe lặp lại).
  * Dashboard tổng quan: Theo dõi tiến độ học tập, tỷ lệ thẻ sẵn sàng và tính năng "Word Spotlight" hiển thị ngẫu nhiên từ vựng mỗi ngày.
* **Nền tảng Mobile:**
  * Thẻ lật hai mặt mượt mà với Animated Spring API và hiệu ứng âm thanh lật thẻ (`expo-audio`).
  * Phát âm IPA chuẩn qua `expo-speech`.
  * Cử chỉ vuốt chạm điều hướng trực quan (`PanResponder`).

### 4. Chuẩn hóa & An toàn dữ liệu JSON
* Loại bỏ hoàn toàn định dạng bao bọc mảng `[ ]` gây rối mắt trên giao diện soạn thảo.
* Người dùng chỉ làm việc trực tiếp trên các khối đối tượng từ vựng `{ ... }`.
* Hệ thống tự động làm sạch Markdown, vá lỗi thiếu dấu phẩy giữa các block, ngăn chặn triệt để lỗi cú pháp JSON Parse Exception.

### 5. Quản trị tài khoản & Cá nhân hóa (Profile & Settings)
* Đồng bộ bộ sưu tập 13 Avatar linh vật Emoji (`avatar_0` đến `avatar_12`) trên cả Web Navbar và Mobile Profile.
* Thống kê trực quan: Tổng số bộ flashcard sở hữu và tổng số từ vựng tích lũy.
* Phân hệ bảo mật: Đổi mật khẩu tài khoản trực tiếp, giao diện bảo mật có nút ẩn/hiện mật khẩu và hỗ trợ khôi phục qua email SMTP.

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### 1. Phân hệ Web & Backend
* **Ngôn ngữ & Nền tảng:** Java 17, Spring Boot (Spring MVC, Spring Security, Spring Mail).
* **Giao diện Web:** HTML5, CSS3, JavaScript ES6+, Bootstrap 5, Boxicons, Thymeleaf Template Engine.
* **Cơ sở dữ liệu:** Google Cloud Firestore thông qua Firebase Admin SDK (xử lý logic nghiệp vụ, bảo mật cấp server).

### 2. Phân hệ Mobile App
* **Nền tảng:** React Native 0.86.3, Expo SDK 57 (React 19.2.3).
* **Thư viện tích hợp:** 
  * Điều hướng: `@react-navigation/native`, `@react-navigation/native-stack`.
  * Giao diện: `react-native-safe-area-context`, `@expo/vector-icons`.
  * Đa phương tiện & Tiện ích: `expo-speech`, `expo-audio`, `expo-clipboard`.
  * Kết nối dữ liệu: `firebase/app`, `firebase/firestore` (Client SDK v10), `axios`.
  * Lưu trữ cục bộ: `@react-native-async-storage/async-storage`.

---

## 📁 CẤU TRÚC THƯ MỤC THỰC TẾ CỦA DỰ ÁN

```text
flashcard_ai/
├── flashcardAI_Web/                             # Module Backend Spring Boot & Web Admin
│   ├── src/main/java/com/vku/flashcard_ai/
│   │   ├── core/config/                         # Cấu hình bảo mật SecurityConfig, CORS
│   │   └── modules/
│   │       ├── auth/                            # AuthController, MobileAuthController, AuthService, UserAccount
│   │       ├── topic/                           # TopicController, SampleTopicController, TopicService, Topic
│   │       ├── ai/                              # AiController, AiService, ChatSession
│   │       └── settings/                        # UserSettingsController
│   ├── src/main/resources/
│   │   ├── static/                              # Tài nguyên tĩnh
│   │   │   ├── css/                             # flashcard.css, chat-ai.css, navbar.css, settings.css, toast.css
│   │   │   ├── js/                              # flashcard.js, chat-ai.js, study_flashcard.js, store.js, settings.js
│   │   │   └── assets/sounds/                   # flipcard.mp3
│   │   ├── templates/                           # Giao diện Thymeleaf
│   │   │   ├── flashcard.html                   # Màn hình chính quản lý bộ thẻ & Dashboard
│   │   │   ├── study_flashcard.html             # Màn hình lật thẻ học tập 3D
│   │   │   ├── chat-ai.html                     # Giao diện Trợ lý AI
│   │   │   ├── store.html                       # Kho chủ đề mẫu chuẩn
│   │   │   ├── settings.html                    # Cài đặt tài khoản & Avatar
│   │   │   ├── login.html                       # Đăng nhập hệ thống
│   │   │   └── register.html                    # Đăng ký tài khoản
│   │   ├── application.properties               # Cấu hình Port 8080, SMTP Gmail, API Keys
│   │   └── firebase-service-account.json        # Khóa xác thực Firebase Admin SDK
│   └── pom.xml                                  # Cấu hình Maven dependencies
│
└── flashcardAI_Mobile/                          # Module Ứng dụng di động (React Native / Expo SDK 57)
    ├── src/
    │   ├── api/                                 # Cầu nối API (auth.api.js, topic.api.js)
    │   ├── config/                              # firebase.js (Khởi tạo kết nối Cloud Firestore)
    │   ├── constants/                           # config.js (Quản lý BASE_API_URL tập trung)
    │   ├── navigation/                          # AppNavigator.js, AuthNavigator.js
    │   ├── screens/                             # Màn hình ứng dụng
    │   │   ├── Auth/                            # LoginScreen.js, RegisterScreen.js
    │   │   ├── Home/                            # HomeScreen.js (Search, Preset Import), EditTopicScreen.js
    │   │   ├── Study/                           # FlashcardScreen.js (Lật thẻ, Speech, PanResponder)
    │   │   └── Profile/                         # ProfileScreen.js (Avatar Emoji, Đổi mật khẩu)
    │   ├── store/                               # authContext.js (Quản lý Context xác thực toàn cục)
    │   └── assets/sounds/                       # flipcard.mp3
    ├── babel.config.js                          # Cấu hình Babel preset expo
    ├── package.json                             # Dependencies Expo SDK 57
    ├── app.json                                 # Cấu hình Expo Project
    └── index.js                                 # Điểm khởi chạy Root của ứng dụng di động
---

## 🚀 HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY

### 1. Khởi chạy Phân hệ Backend & Web (flashcardAI_Web)

* Bước 1: Mở cửa sổ Terminal tại thư mục `flashcardAI_Web`:
  cd flashcardAI_Web

* Bước 2: Đóng gói và chạy ứng dụng Spring Boot:
  mvn clean spring-boot:run

* Bước 3: Truy cập vào giao diện Web trên trình duyệt:
  http://localhost:8080

---

### 2. Cấu hình và Khởi chạy Phân hệ Mobile (flashcardAI_Mobile)

* Bước 1: Lấy địa chỉ IP mạng nội bộ của máy tính:
  * Mở Command Prompt (CMD) trên máy tính và gõ lệnh:
    ipconfig
  * Tìm dòng IPv4 Address (ví dụ: 192.168.1.15).

* Bước 2: Cập nhật file cấu hình kết nối API:
  * Mở file `flashcardAI_Mobile/src/constants/config.js`.
  * Cập nhật địa chỉ IP vừa lấy:
    export const BASE_API_URL = "http://192.168.1.15:8080";

* Bước 3: Cài đặt dependencies và khởi động Metro Bundler:
  cd flashcardAI_Mobile
  npm install
  npx expo start -c

* Bước 4: Mở ứng dụng trên điện thoại:
  * Tải và cài đặt ứng dụng Expo Go trên thiết bị (Android qua CH Play hoặc iOS qua App Store).
  * Đảm bảo điện thoại và máy tính kết nối chung một mạng Wi-Fi.
  * Quét mã QR hiển thị trên Terminal bằng camera hoặc ứng dụng Expo Go.
  * (Trường hợp mạng Wi-Fi bị chặn cổng nội bộ hoặc dùng 4G, khởi chạy bằng lệnh: `npx expo start -c --tunnel`).

---

## 📡 DANH MỤC API ENDPOINTS CHÍNH (BACKEND)

| Phương thức | Đường dẫn Endpoint | Định dạng | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| **POST** | `/api/auth/mobile-login` | JSON | Xác thực đăng nhập cho Mobile, cấp Security Session |
| **POST** | `/api/auth/mobile-register` | JSON | Đăng ký tài khoản người dùng từ Mobile |
| **POST** | `/api/auth/reset-password` | JSON | Đặt lại mật khẩu tài khoản |
| **GET** | `/api/topics` | None | Lấy danh sách toàn bộ chủ đề của user (sắp xếp giảm dần) |
| **POST** | `/api/topics` | JSON | Tạo mới hoặc cập nhật thông tin chủ đề flashcard |
| **POST** | `/api/topics/append-json` | JSON | Ghép thêm từ vựng và tự động lọc trùng từ tiếng Anh |
| **DELETE** | `/api/topics/{id}` | None | Xóa chủ đề và các thẻ trực thuộc theo ID |
| **GET** | `/api/sample-topics` | None | Lấy danh mục các chủ đề mẫu từ kho lưu trữ chuẩn |
| **GET** | `/api/settings/profile` | None | Lấy thông tin tài khoản, avatarKey và email |
| **PUT** | `/api/settings/profile` | JSON | Cập nhật avatar linh vật và email liên hệ |
| **POST** | `/api/settings/change-password` | JSON | Đổi mật khẩu tài khoản bảo mật |
| **POST** | `/api/ai/chat/send` | JSON | Gửi tin nhắn đến Trợ lý AI (Gemini / Personal Model) |
| **GET** | `/api/ai/chat/histories` | None | Lấy danh sách lịch sử các phiên hội thoại AI theo nhóm |

---
