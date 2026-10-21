load('config.js');

function unescapeUrl(value) {
    return (value || "").replace(/\\\//g, "/").replace(/&amp;/g, "&");
}

function extractStream(html) {
    var keys = [
        "hls_url",
        "hls_fallback_url",
        "storage_url",
        "cdn_streaming_url",
        "cdn_embed_url",
        "cdn_secondary_streaming_url",
        "cdn_secondary_embed_url"
    ];

    for (var i = 0; i < keys.length; i++) {
        var quoted = html.match(new RegExp('"' + keys[i] + '"\\s*:\\s*"([^"]+)"'));
        var plain = html.match(new RegExp(keys[i] + '\\s*:\\s*"([^"]+)"'));
        var match = quoted || plain;
        if (!match || !match[1]) continue;
        var stream = unescapeUrl(match[1]);
        if (stream.indexOf("http") === 0) return stream;
    }
    return "";
}

function execute(url) {
    var embed = (url || "") + "";
    if (embed.indexOf("xhub.network") !== -1) embed = embed.replace("xhub.network", "embed.streamxx.net");
    if (embed.indexOf("http") !== 0) embed = "https://" + embed;

    var stream = "";
    try {
        var res = fetch(embed, {
            headers: { "User-Agent": USER_AGENT, "Referer": BASE_URL + "/" }
        });
        if (res && res.ok) stream = extractStream(res.text());
    } catch (e) {
        stream = "";
    }

    if (stream) {
        return Response.success({
            data: stream,
            type: "native",
            headers: {
                "User-Agent": USER_AGENT,
                "Referer": "https://embed.streamxx.net/"
            },
            host: BASE_URL,
            timeSkip: []
        });
    }

    return Response.success({
        data: embed,
        type: "auto",
        headers: {
            "User-Agent": USER_AGENT,
            "Referer": BASE_URL + "/"
        },
        host: BASE_URL,
        timeSkip: []
    });
}
