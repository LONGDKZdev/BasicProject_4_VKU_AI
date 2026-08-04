import os
from datetime import datetime

# 1. Cấu hình giới hạn kích thước mỗi file (tính bằng số lượng ký tự)
MAX_CHARS_PER_FILE = 300000 

# 2. Lọc danh sách thư mục rác, thư viện, thư mục tự build (BỎ QUA)
EXCLUDE_DIRS = {
    '.gradle', '.idea', 'build', 'out', '.firebase',
    'node_modules', '.git', 'assets', 'gradle', 
    'drawable', 'mipmap', 'images' # Bỏ qua cả thư mục ảnh
}

# 3. Chỉ quét các đuôi file có chứa logic/giao diện
INCLUDE_EXTENSIONS = {
    # Code Android
    '.kt', '.xml', '.kts',
    # Code Web Admin
    '.html', '.css', '.js', '.php'
    # Code Java Backend
    '.java', '.properties', '.yml', '.yaml'
}

# 4. Những file đặc biệt nên bỏ qua (bảo mật hoặc file thư viện rác)
EXCLUDE_FILES = {
    'google-services.json', 'local.properties', 
    'package-lock.json', 'gradle-wrapper.properties'
}

# TỰ ĐỘNG THÊM GIỜ VÀO TÊN FILE (Định dạng: ngày-tháng-năm_GiờhPhútp)
time_str = datetime.now().strftime("%d-%m-%Y_%Hh%Mp")

def is_valid_file(filepath, filename):
    if filename in EXCLUDE_FILES:
        return False
    _, ext = os.path.splitext(filepath)
    return ext.lower() in INCLUDE_EXTENSIONS

def generate_project_chunks():
    root_dir = os.getcwd()
    
    current_chunk_idx = 1
    current_content = []
    current_char_count = 0
    
    # Tiêu đề file đầu tiên KHÔNG GHI part 1 nữa để tránh hiểu nhầm
    current_content.append(f"# TỔNG HỢP MÃ NGUỒN DỰ ÁN\n")
    current_content.append("=" * 50 + "\n")

    for dirpath, dirnames, filenames in os.walk(root_dir):
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
                        
                        if current_char_count + block_len > MAX_CHARS_PER_FILE and current_char_count > 0:
                            save_chunk(current_chunk_idx, current_content)
                            
                            current_chunk_idx += 1
                            # File số 2 trở đi mới ghi thêm chữ (PHẦN 2...)
                            current_content = [f"# TỔNG HỢP MÃ NGUỒN DỰ ÁN (PHẦN {current_chunk_idx})\n" + "=" * 50 + "\n"]
                            current_char_count = len(current_content[0])
                            
                        current_content.append(file_block)
                        current_char_count += block_len
                        
                except Exception as e:
                    print(f"⚠️ Bỏ qua file do không thể đọc dưới dạng văn bản: {rel_path}")

    if current_content and current_char_count > len(current_content[0]):
        save_chunk(current_chunk_idx, current_content)

def save_chunk(idx, content_list):
    # Chỉ file số 2 trở đi mới có đuôi part
    if idx == 1:
        filename = f"gom_code_{time_str}.txt"
    else:
        filename = f"gom_code_{time_str}_part_{idx}.txt"
        
    with open(filename, 'w', encoding='utf-8') as out_f:
        out_f.write("".join(content_list))
    print(f"✅ Đã tạo file: {filename}")

if __name__ == "__main__":
    print("⏳ Đang quét và chia nhỏ mã nguồn...")
    for f in os.listdir('.'):
        if f.startswith('gom_code_') and f.endswith('.txt'):
            os.remove(f)
            
    generate_project_chunks()
    print("🎉 Hoàn tất!")
    input("Nhấn Enter để thoát...")