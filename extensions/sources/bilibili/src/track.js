load('config.js');

function execute(url) {
    // If direct video file (mp4 / m3u8) -> Native player with Desktop Headers
    if (url.indexOf(".mp4") !== -1 || url.indexOf(".m3u8") !== -1 || url.indexOf("upos-") !== -1) {
        return Response.success({
            data: url,
            type: "native",
            headers: {
                "User-Agent": DESKTOP_USER_AGENT,
                "Referer": DESKTOP_REFERER
            },
            host: BASE_URL,
            timeSkip: []
        });
    }

    // Embed player -> WebView auto with Desktop Headers
    return Response.success({
        data: url,
        type: "auto",
        headers: {
            "User-Agent": DESKTOP_USER_AGENT,
            "Referer": DESKTOP_REFERER
        },
        host: BASE_URL,
        timeSkip: []
    });
}
