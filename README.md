# HỆ THỐNG HỌC TẬP FLASHCARD THÔNG MINH ĐA NỀN TẢNG (WEB & MOBILE) TÍCH HỢP AI

Hệ thống hỗ trợ học tập, quản lý và kiểm tra từ vựng tiếng Anh toàn diện trên đa thiết bị, đồng bộ dữ liệu thời gian thực giữa **Web Application (Spring Boot + Thymeleaf)** và **Mobile Application (React Native / Expo SDK 58)** thông qua cơ sở dữ liệu **Google Cloud Firestore**.

---

## TÍNH NĂNG CỐT LÕI

### 1. Đồng bộ hóa thời gian thực (Real-time Cross-Platform Synchronization)
* **Đồng bộ đa chiều:** Lưu trữ dữ liệu trên Google Cloud Firestore, đảm bảo mọi thao tác thêm, sửa, xóa bộ từ vựng hoặc cập nhật hồ sơ cá nhân trên Web lập tức đồng bộ trên Mobile App và ngược lại.
* **Sắp xếp ưu tiên theo mốc thời gian (`orderIndex`):** Sử dụng trường `orderIndex` kiểu `long` (`Date.now()` / `System.currentTimeMillis()`). Bất kỳ bộ thẻ nào được tạo mới, chỉnh sửa hoặc thay đổi vị trí kéo thả sẽ tự động cập nhật dấu thời gian mới nhất và hiển thị lên đầu danh sách.

### 2. Kho chủ đề mẫu & Thuật toán lọc trùng lặp từ vựng
* **Kho lưu trữ mẫu (`sample_topics`):** Tự động nạp các bộ từ vựng chuẩn từ tệp `sample_topics.json` lên Firestore khi khởi động máy chủ thông qua `SampleTopicDataImporter`.
* **Thuật toán khử trùng lặp (`append-json`):**
  * *Chủ đề chưa tồn tại:* Khởi tạo bộ thẻ mới vào danh mục cá nhân của người dùng.
  * *Chủ đề đã tồn tại:* Phân tích mảng đối tượng JSON bằng Jackson `ObjectMapper`, đối chiếu không phân biệt hoa/thường theo trường `englishVocabulary`, tự động bỏ qua các từ đã có và chỉ nối thêm từ mới cùng cập nhật lại số lượng `count` và `orderIndex`.

### 3. Trợ lý AI kép (Gemini API & AI Personal độc lập theo từng tài khoản)
* **Chế độ API AI (Gemini):** Tích hợp lịch sử hội thoại 8 tin nhắn gần nhất (`messagesJson`), hỗ trợ sinh bộ từ vựng JSON theo chủ đề và chèn trực tiếp vào bộ thẻ chỉ với một nút bấm (`+`).
* **Chế độ AI Personal (Model-Based Utility Learning Agent):**
  * Vận hành trực tiếp trên máy chủ Spring Boot, kết hợp **Multinomial Naive Bayes** (phân loại ý định hội thoại có làm trơn Laplace), **TF-IDF Cosine Similarity** (truy xuất ngữ nghĩa), **Constraint Satisfaction Problem - CSP** (ràng buộc chống trùng lặp từ đã học và cân bằng đa dạng loại từ `(n)`, `(v)`, `(adj)`, `(adv)`) và **Utility Function $U(s)$** (đề xuất bộ thẻ cần ôn tập ưu tiên).
  * **Bộ não lưu trữ riêng (`personal_ai_brains`):** Mỗi tài khoản (`userId`) sở hữu một document riêng (`brain_{userId}`) trên Firestore để lưu trữ tri thức từ vựng tích lũy và các quy tắc hội thoại do chính người dùng trực tiếp huấn luyện (`Dạy AI: ... => ...`, `Học từ mới: ...`).

### 4. Không gian học tập 3D & Kiểm tra ghi nhớ 4 vòng (Spaced Repetition)
* **Nền tảng Web:**
  * Băng chuyền lật thẻ 3D (Carousel) kèm hiệu ứng âm thanh (`flipcard.mp3`) và điều hướng nhảy nhanh tới thẻ bất kỳ.
  * Phát âm chuẩn qua Web Speech API (bấm lần 1 đọc tốc độ thường `rate = 0.9`, bấm lần 2 liên tiếp vào cùng từ tự động chuyển sang đọc chậm `rate = 0.5`).
  * Hệ thống kiểm tra 4 vòng (`/test-flashcard`): Vòng 1 (Trắc nghiệm Anh - Việt), Vòng 2 (Trắc nghiệm Việt - Anh), Vòng 3 (Gõ từ theo nghĩa và phiên âm IPA), Vòng 4 (Nghe phát âm và viết chính tả). Đạt từ 80% trở lên tự động ghi nhận tiến độ lên collection `study_progress` của Firestore.
  * Dashboard tổng quan: Thống kê số bộ thẻ, tổng số từ vựng, thanh trạng thái hoạt động, nút tiếp tục học nhanh và thẻ từ vựng ngẫu nhiên (Word Spotlight).
* **Nền tảng Mobile:**
  * Thẻ lật hai mặt mượt mà với `Animated.spring` và hiệu ứng âm thanh (`expo-audio`).
  * Phát âm IPA qua `expo-speech` và điều hướng vuốt trái/phải qua `PanResponder`.

### 5. Chuẩn hóa dữ liệu JSON & Quản trị tài khoản
* **JSON-safe Editing:** Ẩn cặp ngoặc vuông `[ ]` khi hiển thị trên khung soạn thảo để tránh xóa nhầm; tự động làm sạch thẻ Markdown, HTML entities và vá lỗi thiếu dấu phẩy giữa các khối đối tượng trước khi lưu.
* **Quản trị tài khoản & Bảo mật:** Đồng bộ 13 Avatar linh vật (`avatar_0` đến `avatar_12`), đổi mật khẩu trực tiếp và hỗ trợ khôi phục mật khẩu qua email SMTP Gmail ngay tại trang đăng nhập hoặc trang cài đặt.

---

## CÔNG NGHỆ SỬ DỤNG

### 1. Phân hệ Web & Backend
* **Ngôn ngữ & Framework:** Java 17, Spring Boot (Spring MVC, Spring Security, Spring Mail).
* **Giao diện:** HTML5, CSS3, JavaScript ES6+, Bootstrap 5, Boxicons, Thymeleaf.
* **Cơ sở dữ liệu & Xử lý JSON:** Google Cloud Firestore (Firebase Admin SDK `9.2.0`), Jackson `ObjectMapper`.

### 2. Phân hệ Mobile App
* **Nền tảng:** React Native `0.88.1`, Expo SDK `58` (React `19.3.0`).
* **Thư viện tích hợp:**
  * Điều hướng: `@react-navigation/native`, `@react-navigation/native-stack`.
  * Giao diện & Đa phương tiện: `react-native-safe-area-context`, `@expo/vector-icons`, `expo-speech`, `expo-audio`, `expo-clipboard`.
  * Kết nối dữ liệu & Lưu trữ cục bộ: `firebase` (Client SDK), `axios`, `@react-native-async-storage/async-storage`.

---

## CẤU TRÚC THƯ MỤC DỰ ÁN

```text
flashcard_ai/
├── flashcardAI_Web/                             # Phân hệ Backend Spring Boot & Giao diện Web
│   ├── src/main/java/com/vku/flashcard_ai/
│   │   ├── FlashcardAiApplication.java          # Điểm khởi chạy ứng dụng & Bean ObjectMapper
│   │   ├── HomeController.java                  # Điều hướng các trang Thymeleaf
│   │   ├── core/
│   │   │   ├── config/SecurityConfig.java       # Phân quyền Spring Security & Session
│   │   │   ├── firebase/FirebaseInitializer.java# Khởi tạo kết nối Firebase Admin SDK
│   │   │   ├── mail/EmailService.java           # Dịch vụ gửi email SMTP đặt lại mật khẩu
│   │   │   └── tools/SampleTopicDataImporter.java # Tự động nạp dữ liệu mẫu lên Firestore
│   │   └── modules/
│   │       ├── auth/                            # AuthController, AuthService, UserSettingsController, CustomUserDetailsService, UserAccountRepository
│   │       ├── topic/                           # TopicController, TopicService, SampleTopicController, SampleTopicService, Topic, SampleTopic
│   │       ├── flashcard/                       # FlashcardController, FlashcardService, Flashcard
│   │       ├── progress/                        # ProgressController, ProgressService, StudyProgress
│   │       └── ai/                              # AiController, AiService, ChatHistoryService, AiRequestDTO
│   │           ├── engine/                      # PersonalAiEngine, PersonalAiBrainService, NaiveBayesIntentClassifier, VocabularyKnowledgeBase
│   │           └── model/                       # AiChatHistory, PersonalAiBrain
│   ├── src/main/resources/
│   │   ├── static/
│   │   │   ├── css/                             # flashcard.css, chat-ai.css, navbar.css, settings.css, study_flashcard.css, toast.css
│   │   │   ├── js/                              # flashcard.js, chat-ai.js, study_flashcard.js, store.js, settings.js, navbar.js, drag_drop_helper.js, auth-helper.js, toast.js
│   │   │   └── assets/sounds/                   # flipcard.mp3
│   │   ├── templates/
│   │   │   ├── fragments/navbar.html            # Thanh điều hướng dùng chung
│   │   │   ├── flashcard.html                   # Trang chủ quản lý bộ thẻ & Dashboard
│   │   │   ├── study_flashcard.html             # Trang học lật thẻ 3D & Modal kiểm tra 4 vòng
│   │   │   ├── test_flashcard.html              # Trang làm bài kiểm tra 4 vòng
│   │   │   ├── chat-ai.html                     # Giao diện Chat AI đa luồng
│   │   │   ├── store.html                       # Kho chủ đề mẫu
│   │   │   ├── settings.html                    # Cài đặt tài khoản & Đổi mật khẩu
│   │   │   ├── login.html                       # Đăng nhập & Quên mật khẩu
│   │   │   ├── register.html                    # Đăng ký tài khoản
│   │   │   └── reset-password.html              # Đặt lại mật khẩu mới
│   │   ├── application.properties               # Cấu hình cổng 8080, SMTP Gmail, API Keys
│   │   ├── sample_topics.json                   # Dữ liệu bộ thẻ mẫu khởi tạo
│   │   └── firebase-service-account.json        # Khóa xác thực Firebase Admin SDK
│   └── pom.xml                                  # Cấu hình Maven dependencies
│
└── flashcardAI_Mobile/                          # Phân hệ Ứng dụng di động (React Native / Expo SDK 58)
    ├── src/
    │   ├── api/                                 # auth.api.js, topic.api.js
    │   ├── config/firebase.js                   # Khởi tạo kết nối Firebase Client SDK
    │   ├── constants/config.js                  # Cấu hình địa chỉ BASE_API_URL
    │   ├── navigation/                          # AppNavigator.js, AuthNavigator.js
    │   ├── screens/
    │   │   ├── Auth/                            # LoginScreen.js, RegisterScreen.js
    │   │   ├── Home/                            # HomeScreen.js, EditTopicScreen.js
    │   │   ├── Study/                           # FlashcardScreen.js
    │   │   └── Profile/                         # ProfileScreen.js
    │   ├── store/authContext.js                 # Quản lý trạng thái đăng nhập toàn cục
    │   └── assets/sounds/flipcard.mp3           # Âm thanh hiệu ứng lật thẻ
    ├── babel.config.js
    ├── package.json
    ├── app.json
    ├── eas.json
    └── index.js
```

---

## HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY

### 1. Khởi chạy Phân hệ Backend & Web (`flashcardAI_Web`)

1. Di chuyển vào thư mục `flashcardAI_Web`:
   ```bash
   cd flashcardAI_Web
   ```
2. Đảm bảo tệp khóa `firebase-service-account.json` đã được đặt trong `src/main/resources/`.
3. Biên dịch và khởi chạy ứng dụng Spring Boot:
   ```bash
   mvn clean spring-boot:run
   ```
4. Mở trình duyệt và truy cập địa chỉ: `http://localhost:8080`

---

### 2. Cấu hình và Khởi chạy Phân hệ Mobile (`flashcardAI_Mobile`)

1. Lấy địa chỉ IPv4 mạng nội bộ của máy tính:
   * Mở Command Prompt (CMD) trên Windows và chạy lệnh:
     ```bash
     ipconfig
     ```
   * Ghi nhận giá trị tại dòng `IPv4 Address` (ví dụ: `192.168.1.15`).
2. Cập nhật địa chỉ kết nối Backend trong tệp `flashcardAI_Mobile/src/constants/config.js`:
   ```javascript
   export const BASE_API_URL = "[http://192.168.1.15:8080](http://192.168.1.15:8080)";
   ```
   *(Nếu chạy trên máy ảo Android Studio, sử dụng `"http://10.0.2.2:8080"`).*
3. Cài đặt thư viện và khởi động Expo Metro Bundler:
   ```bash
   cd flashcardAI_Mobile
   npm install
   npx expo start -c
   ```
4. Mở ứng dụng trên điện thoại:
   * Cài đặt ứng dụng **Expo Go** trên thiết bị Android hoặc iOS.
   * Kết nối điện thoại và máy tính vào cùng một mạng Wi-Fi, sau đó quét mã QR hiển thị trên Terminal.
   * Trường hợp chạy khác lớp mạng hoặc bị tường lửa chặn cổng nội bộ, khởi chạy bằng đường hầm ngrok:
     ```bash
     npx expo start -c --tunnel ngrok
     ```

---

## CẤU TRÚC CƠ SỞ DỮ LIỆU FIRESTORE

Hệ thống sử dụng **6 collections** trên Google Cloud Firestore:

| Collection | Khóa chính (Document ID) | Mô tả lưu trữ |
| :--- | :--- | :--- |
| `users` | `userId` / `username` | Thông tin tài khoản (`userId`, `username`, `email`, `password`, `avatarKey`, `createdAt`). |
| `topics` | `topicId` | Danh sách bộ thẻ cá nhân (`topicId`, `userId`, `username`, `name`, `color`, `count`, `dataJson`, `orderIndex`, `createdAt`). |
| `sample_topics` | `id` | Kho bộ thẻ mẫu chuẩn được nạp tự động từ `sample_topics.json`. |
| `ai_chat_histories` | `chatId` | Lịch sử hội thoại AI phân cấp theo nhóm chủ đề (`TOPIC_ORIGIN` / `TOPIC`) và chat tự do (`GENERAL`). |
| `personal_ai_brains` | `brain_{userId}` | Kho tri thức từ vựng tích lũy (`customKnowledgeJson`) và quy tắc học riêng (`customRulesJson`) của từng tài khoản. |
| `study_progress` | `{userId}_{topicId}` | Tiến độ hoàn thành các vòng kiểm tra (`completedRounds`, `lastStudiedDate`). |

---

## DANH MỤC API ENDPOINTS CHÍNH

| Phương thức | Đường dẫn Endpoint | Định dạng | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| **POST** | `/api/auth/mobile-login` | JSON | Xác thực đăng nhập cho ứng dụng Mobile và trả về hồ sơ người dùng. |
| **POST** | `/api/auth/forgot-password` | JSON | Gửi email chứa liên kết đặt lại mật khẩu từ màn hình đăng nhập. |
| **POST** | `/api/auth/reset-password` | JSON | Cập nhật mật khẩu mới trực tiếp từ liên kết khôi phục. |
| **GET** | `/api/topics` | None | Lấy danh sách toàn bộ bộ thẻ của người dùng (sắp xếp giảm dần theo `orderIndex`). |
| **POST** | `/api/topics` | JSON | Tạo mới hoặc cập nhật thông tin và nội dung JSON của bộ thẻ. |
| **POST** | `/api/topics/append-json` | JSON | Nối thêm từ vựng vào bộ thẻ hiện có và tự động lọc trùng lặp. |
| **DELETE** | `/api/topics/{id}` | None | Xóa bộ thẻ và toàn bộ lịch sử hội thoại AI liên quan. |
| **GET** | `/api/flashcards/{topicId}` | None | Lấy danh sách đối tượng thẻ từ vựng đã chuẩn hóa của một chủ đề. |
| **DELETE** | `/api/flashcards/{topicId}/{englishWord}` | None | Xóa một thẻ từ vựng cụ thể khỏi bộ thẻ. |
| **GET** | `/api/sample-topics` | None | Lấy danh sách các bộ thẻ mẫu chuẩn từ Firestore. |
| **GET** | `/api/progress/{topicId}` | None | Lấy tiến độ hoàn thành 4 vòng kiểm tra của người dùng theo chủ đề. |
| **POST** | `/api/progress/complete` | JSON | Ghi nhận hoàn thành một vòng kiểm tra lên Firestore. |
| **DELETE** | `/api/progress/{topicId}` | None | Đặt lại toàn bộ tiến độ kiểm tra của chủ đề. |
| **GET** | `/api/settings/profile` | None | Lấy thông tin hồ sơ cá nhân (`username`, `email`, `avatarKey`). |
| **PUT** | `/api/settings/profile` | JSON | Cập nhật avatar linh vật và địa chỉ email liên hệ. |
| **POST** | `/api/settings/change-password` | JSON | Đổi mật khẩu tài khoản trong trang cài đặt. |
| **POST** | `/api/ai/chat/send` | JSON | Gửi tin nhắn tới Trợ lý AI (`gemini` hoặc `ai-personal`). |
| **GET** | `/api/ai/personal-brain` | None | Truy xuất trạng thái bộ nhớ tri thức cá nhân hóa của tài khoản trên Firestore. |
| **GET** | `/api/ai/chat/histories` | None | Lấy danh sách lịch sử hội thoại AI của người dùng. |