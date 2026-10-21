function parseNextData(html) {
    var m = (html || "").match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!m || !m[1]) return null;
    try {
        return JSON.parse(m[1]);
    } catch (e) {
        return null;
    }
}

function getPageData(html) {
    var d = parseNextData(html);
    if (!d || !d.props || !d.props.pageProps) return null;
    var resp = d.props.pageProps.resp;
    if (!resp || !resp.data) return null;
    return resp.data;
}

function escHtml(s) {
    s = (s === null || s === undefined) ? "" : s + "";
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function extractItems(data) {
    if (!data) return [];
    var content = data.content || {};
    var raw = [];
    var i;
    var j;

    var sections = content.sections || [];
    for (i = 0; i < sections.length; i++) {
        var items = sections[i].items || [];
        for (j = 0; j < items.length; j++) raw.push(items[j]);
    }

    var direct = content.items || [];
    for (i = 0; i < direct.length; i++) raw.push(direct[i]);

    var out = [];
    var seen = {};
    for (i = 0; i < raw.length; i++) {
        var it = raw[i];
        if (!it || !it.title) continue;

        var link = (it.url || it.redirectUrl || "") + "";
        link = link.split("#")[0];
        if (!link) continue;

        var key = (it.contentId || it.id || link) + "";
        if (seen[key]) continue;
        seen[key] = 1;

        if (link.indexOf("http") !== 0) link = BASE_URL + link;

        var pub = it.publisher || {};
        var desc = (it.description || "") + "";
        if (desc.length > 220) desc = desc.substring(0, 217) + "...";

        out.push({
            name: (it.title + "") + "",
            link: link,
            cover: (it.thumb || "") + "",
            description: desc,
            host: BASE_URL,
            tag: (pub.shortName || pub.name || "") + ""
        });
    }
    return out;
}
