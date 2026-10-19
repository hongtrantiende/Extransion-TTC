let BASE_URL = "https://topxx.vip";
try { if (typeof CONFIG_URL !== "undefined" && CONFIG_URL) BASE_URL = CONFIG_URL; } catch (e) {}

var API_URL = BASE_URL + "/api/v1";
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

var HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json",
    "Referer": BASE_URL + "/"
};
