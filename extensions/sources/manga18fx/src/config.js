var BASE_URL = "https://manga18fx.com";
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function normalizeUrl(url) {
    if (!url) return "";
    url = String(url).replace(/\s+/g, "").trim();
    if (!url || url.indexOf("data:image/") === 0) return "";
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("/") === 0) return BASE_URL + url;
    return BASE_URL + "/" + url;
}

function cleanText(text) {
    if (!text) return "";
    return String(text).replace(/\s+/g, " ").trim();
}

function buildPagedUrl(url, page) {
    url = normalizeUrl(url);
    if (!page || page === "1") return url;
    var trimmed = url.replace(/\/+$/, "");
    // Genre pages: /manga-genre/manhwa/2
    if (trimmed.indexOf("/manga-genre/") >= 0) {
        return trimmed + "/" + page;
    }
    // hot-manga and others use ?page=N
    return trimmed + (trimmed.indexOf("?") >= 0 ? "&" : "?") + "page=" + page;
}

function getNextPage(doc, currentPage) {
    var pageNumber = parseInt(currentPage || "1", 10);
    var nextPage = null;
    doc.select("ul.pagination a").forEach(function(e) {
        var href = e.attr("href") || "";
        var matched = /(\d+)\/?$/.exec(href.split("?")[0]) || /[?&]page=(\d+)/i.exec(href);
        if (!matched) return;
        var candidate = parseInt(matched[1], 10);
        if (candidate > pageNumber && (!nextPage || candidate < nextPage)) {
            nextPage = candidate;
        }
    });
    return nextPage ? String(nextPage) : null;
}

function pushUniqueCard(items, seen, item) {
    if (!item || !item.link || seen[item.link]) return;
    seen[item.link] = true;
    items.push(item);
}

function parseStoryCards(doc) {
    var seen = {};
    var items = [];
    doc.select(".bsx-item.mycover, .hot-item.mycover").forEach(function(card) {
        var link = "";
        var cover = "";
        var name = "";

        // h3 name first (bsx-item uses h3.tt.mycover > a)
        var h3 = card.select("h3").first();
        if (h3) {
            var h3a = h3.select("a").first();
            name = cleanText(h3a ? h3a.text() : h3.text());
        }

        card.select("a[href]").forEach(function(a) {
            var href = a.attr("href") || "";
            if (href.indexOf("/manga/") < 0) return;
            if (!link) link = normalizeUrl(href);
            if (!name) {
                var h3inner = a.select("h3").first();
                name = cleanText(h3inner ? h3inner.text() : a.text());
            }
        });

        var img = card.select("img").first();
        if (img) {
            cover = img.attr("src") || img.attr("data-src") || "";
        }

        var chapterBadge = card.select(".chapter-badges").first();
        var description = chapterBadge ? cleanText(chapterBadge.text()) : "";

        pushUniqueCard(items, seen, {
            name: name,
            link: link,
            cover: normalizeUrl(cover),
            description: description,
            host: BASE_URL
        });
    });
    return items;
}
