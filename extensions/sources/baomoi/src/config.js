let BASE_URL = "https://baomoi.com";
try { if (typeof CONFIG_URL !== "undefined" && CONFIG_URL) BASE_URL = CONFIG_URL; } catch (e) {}

var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

var HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml",
    "Referer": BASE_URL + "/"
};

var CATEGORIES = [
    ["Trang chủ", ""],
    ["Tin mới", "tin-moi"],
    ["Thời sự", "thoi-su"],
    ["Thế giới", "the-gioi"],
    ["Kinh tế", "kinh-te"],
    ["Kinh doanh", "kinh-doanh"],
    ["Tài chính", "tai-chinh"],
    ["Chứng khoán", "chung-khoan"],
    ["Bất động sản", "nha-dat"],
    ["Giải trí", "giai-tri"],
    ["Thể thao", "the-thao"],
    ["Bóng đá", "bong-da"],
    ["Đời sống", "doi-song"],
    ["Giáo dục", "giao-duc"],
    ["Pháp luật", "phap-luat"],
    ["Sức khỏe", "suc-khoe-y-te"],
    ["Công nghệ", "khoa-hoc-cong-nghe"],
    ["Xe", "xe-co"],
    ["Du lịch", "du-lich"],
    ["Văn hóa", "van-hoa"],
    ["Âm nhạc", "am-nhac"],
    ["Điện ảnh", "dien-anh-truyen-hinh"],
    ["Thời trang", "thoi-trang"],
    ["Tình yêu", "tinh-yeu-hon-nhan"],
    ["Việc làm", "lao-dong-viec-lam"],
    ["Môi trường", "moi-truong-khi-hau"],
    ["An ninh", "an-ninh-trat-tu"],
    ["Giao thông", "giao-thong"],
    ["Xã hội", "xa-hoi"],
    ["Khoa học", "khoa-hoc"],
    ["Học bổng", "hoc-bong-du-hoc"],
    ["CNTT", "cntt-vien-thong"],
    ["Thiết bị", "thiet-bi-phan-cung"],
    ["Kiến trúc", "khong-gian-kien-truc"],
    ["Quy hoạch", "quan-ly-quy-hoach"],
    ["Nghệ thuật", "nghe-thuat"],
    ["Dinh dưỡng", "dinh-duong-lam-dep"],
    ["Bóng đá VN", "bong-da-viet-nam"],
    ["Bóng đá QT", "bong-da-quoc-te"],
    ["Hình sự", "hinh-su-dan-su"]
];

function categoryUrl(slug) {
    return slug ? (BASE_URL + "/" + slug + ".epi") : (BASE_URL + "/");
}
