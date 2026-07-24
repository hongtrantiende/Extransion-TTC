let BASE_URL = "https://www.bilibili.com";
try { if (typeof CONFIG_URL !== 'undefined' && CONFIG_URL) BASE_URL = CONFIG_URL; } catch (e) {}

var DESKTOP_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
var DESKTOP_REFERER = "https://www.bilibili.com/";

var HEADERS = {
    "User-Agent": DESKTOP_USER_AGENT,
    "Referer": DESKTOP_REFERER,
    "Cookie": "buvid3=bilibili_desktop_session"
};
