import os
from datetime import datetime

# 1. Cấu hình giới hạn kích thước mỗi file chunk (khoảng 300.000 ký tự)
MAX_CHARS_PER_FILE = 300000 

# 2. Danh sách thư mục RÁC, BUILD, THƯ VIỆN cần BỎ QUA triệt để
EXCLUDE_DIRS = {
    # Thư mục hệ thống & IDE
    '.git', '.github', '.vscode', '.idea',
    # Thư mục build của Java / Spring Boot
    'target', '.mvn', 'build', 'out',
    # Thư mục build & thư viện của Node.js / Expo / React Native
    'node_modules', '.expo', '.expo-shared',
    # Thư mục lưu trữ code txt hoặc tài liệu
    'TXT_Code', 'assets', 'images', 'drawable', 'mipmap'
}

# 3. Các đuôi file CHỨA CODE NGUỒN CẦN QUÉT
INCLUDE_EXTENSIONS = {
    # Mã nguồn Java Backend
    '.java', '.properties', '.yml', '.yaml',
    # Mã nguồn Frontend Web
    '.html', '.css', '.js',
    # Mã nguồn cấu hình dự án
    '.xml', '.json'
}

# 4. Những file cụ thể CẦN BỎ QUA (không phải code chức năng hoặc chứa khóa/rác)
EXCLUDE_FILES = {
    'package-lock.json', 
    'google-services.json',
    'firebase-service-account.json', # Tránh lộ private key
    'local.properties',
    'gradle-wrapper.properties',
    'HELP.md'
}

# Đuôi tài liệu văn phòng tuyệt đối không đọc dưới dạng text
DOCUMENT_EXTENSIONS = {'.docx', '.dotx', '.pdf', '.xlsx', '.pptx', '.mp3', '.png', '.jpg', '.jpeg'}

time_str = datetime.now().strftime("%d-%m-%Y_%Hh%Mp")

def is_valid_file(filepath, filename):
    # Bỏ qua các file gom code do chính script tạo ra hoặc script python
    if filename.startswith('gom_code_') or filename == 'gom_code_New.py':
        return False
        
    if filename in EXCLUDE_FILES:
        return False
        
    _, ext = os.path.splitext(filename)
    ext_lower = ext.lower()
    
    if ext_lower in DOCUMENT_EXTENSIONS:
        return False
        
    # Gom cả file pom.xml
    if filename == 'pom.xml':
        return True
        
    return ext_lower in INCLUDE_EXTENSIONS

def generate_project_chunks():
    root_dir = os.getcwd()
    
    current_chunk_idx = 1
    current_content = []
    current_char_count = 0
    
    # Tiêu đề mở đầu
    header = "# TỔNG HỢP MÃ NGUỒN DỰ ÁN\n" + "=" * 50 + "\n"
    current_content.append(header)
    current_char_count = len(header)

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Lọc bỏ các thư mục rác ngay tại cấp duyệt thư mục
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            
            if is_valid_file(filepath, filename):
                rel_path = os.path.relpath(filepath, root_dir)
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        file_block = f"\n\n{'='*50}\n### FILE: {rel_path}\n{'='*50}\n```\n{content}\n```\n"
                        block_len = len(file_block)
                        
                        # Nếu vượt quá giới hạn ký tự thì cắt sang file part tiếp theo
                        if current_char_count + block_len > MAX_CHARS_PER_FILE and current_char_count > len(header):
                            save_chunk(current_chunk_idx, current_content)
                            
                            current_chunk_idx += 1
                            part_header = f"# TỔNG HỢP MÃ NGUỒN DỰ ÁN (PHẦN {current_chunk_idx})\n" + "=" * 50 + "\n"
                            current_content = [part_header]
                            current_char_count = len(part_header)
                            
                        current_content.append(file_block)
                        current_char_count += block_len
                        
                except Exception as e:
                    print(f"⚠️ Bỏ qua file nhị phân/không thể đọc UTF-8: {rel_path}")

    if current_content and current_char_count > len(header):
        save_chunk(current_chunk_idx, current_content)

def save_chunk(idx, content_list):
    if idx == 1:
        filename = f"gom_code_{time_str}.txt"
    else:
        filename = f"gom_code_{time_str}_part_{idx}.txt"
        
    with open(filename, 'w', encoding='utf-8') as out_f:
        out_f.write("".join(content_list))
    print(f"✅ Đã tạo file: {filename}")

if __name__ == "__main__":
    print("⏳ Đang dọn dẹp các file gom code cũ và quét mã nguồn...")
    for f in os.listdir('.'):
        if f.startswith('gom_code_') and f.endswith('.txt'):
            try:
                os.remove(f)
            except Exception:
                pass
            
    generate_project_chunks()
    print("🎉 Hoàn tất gom code sạch!")
    input("Nhấn Enter để kết thúc...")