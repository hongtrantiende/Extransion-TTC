function execute(url) {
    var response = fetch(url, {
        headers: {
            "User-Agent": USER_AGENT
        }
    });

    if (!response.ok) {
        return Response.error("Lỗi kết nối");
    }

    var html = response.text();
    var iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/i) || html.match(/<iframe[^>]+src='([^']+)'/i);
    if (!iframeMatch) {
        return Response.error("Không tìm thấy trình phát");
    }

    var embedUrl = absoluteUrl(iframeMatch[1]);
    var embedResponse = fetch(embedUrl, {
        headers: {
            "User-Agent": USER_AGENT,
            "Referer": url
        }
    });

    if (!embedResponse.ok) {
        return Response.error("Lỗi kết nối máy chủ phát");
    }

    var embedHtml = embedResponse.text();
    var playerMatch = embedHtml.match(/<iframe[^>]+data-src="([^"]+)"/i) || embedHtml.match(/<iframe[^>]+src="([^"]+)"/i);
    if (!playerMatch) {
        return Response.error("Không tìm thấy máy chủ phát");
    }

    var playerUrl = absoluteUrl(playerMatch[1]);
    var playerResponse = fetch(playerUrl, {
        headers: {
            "User-Agent": USER_AGENT,
            "Referer": "https://hhtq.io/"
        }
    });

    if (!playerResponse.ok) {
        return Response.error("Lỗi kết nối máy chủ phát");
    }

    var playerHtml = playerResponse.text();
    var streamMatch = playerHtml.match(/data-src=["']([^"']+\.m3u8[^"']*)["']/i);
    var obfHtml = playerHtml;

    if (streamMatch) {
        var streamPageUrl = absoluteUrl(streamMatch[1]);
        var streamPageResponse = fetch(streamPageUrl, {
            headers: {
                "User-Agent": USER_AGENT,
                "Referer": originOf(playerUrl)
            }
        });
        if (streamPageResponse.ok) {
            obfHtml = streamPageResponse.text();
        }
    }

    var obfMatch = obfHtml.match(/data-obf=["']([^"']+)["']/i);
    if (!obfMatch) {
        if (streamMatch) {
            return Response.success({
                data: absoluteUrl(streamMatch[1]),
                type: "native",
                headers: {
                    "User-Agent": USER_AGENT,
                    "Referer": originOf(playerUrl)
                },
                host: "https://hhtq.io",
                timeSkip: []
            });
        }
        return Response.error("Không tìm thấy dữ liệu trình phát");
    }

    var payload = decodeBase64(obfMatch[1]);
    var data;
    try {
        data = JSON.parse(payload);
    } catch (e) {
        return Response.error("Dữ liệu trình phát không hợp lệ");
    }

    var streamUrl = data.pU || data.sU || "";
    if (!streamUrl) {
        return Response.error("Không tìm thấy luồng phát video");
    }

    return Response.success({
        data: streamUrl,
        type: "native",
        headers: {
            "User-Agent": USER_AGENT,
            "Referer": originOf(playerUrl)
        },
        host: "https://hhtq.io",
        timeSkip: []
    });
}

var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function decodeBase64(text) {
    try {
        var bytes = java.util.Base64.getDecoder().decode(text);
        return String(new java.lang.String(bytes, "UTF-8"));
    } catch (e) {}
    try {
        var bytes2 = android.util.Base64.decode(text, 0);
        return String(new java.lang.String(bytes2, "UTF-8"));
    } catch (e2) {}
    return "";
}

function originOf(url) {
    var match = (url || "").match(/^(https?:\/\/[^\/]+)/i);
    return match ? match[1] + "/" : "https://yanhh3d.chat/";
}

function absoluteUrl(url) {
    if (!url) return "";
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    return "https://hhtq.io" + (url.charAt(0) === "/" ? url : "/" + url);
}
