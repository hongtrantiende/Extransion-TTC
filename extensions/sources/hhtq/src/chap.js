function execute(url) {
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://hhtq.io/"
        }
    });

    if (!playerResponse.ok) {
        return Response.error("Lỗi kết nối máy chủ phát");
    }

    var playerHtml = playerResponse.text();
    var streamMatch = playerHtml.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
    if (!streamMatch) {
        streamMatch = playerHtml.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/i);
    }
    if (!streamMatch) {
        return Response.error("Không tìm thấy luồng phát video");
    }

    return Response.success(streamMatch[0]);
}

function absoluteUrl(url) {
    if (!url) return "";
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    return "https://hhtq.io" + (url.charAt(0) === "/" ? url : "/" + url);
}
