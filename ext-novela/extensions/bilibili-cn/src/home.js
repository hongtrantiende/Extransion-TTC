load('config.js');

function execute() {
    return Response.success([
        { title: "Nổi Bật (Popular)", input: "https://api.bilibili.com/x/web-interface/popular?ps=20&pn={{page}}", script: "gen.js" },
        { title: "Top Chọn Lọc (Must-Watch)", input: "https://api.bilibili.com/x/web-interface/popular/precious?page={{page}}", script: "gen.js" },
        { title: "Hoạt Hình (Anime)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=1&type=all", script: "gen.js" },
        { title: "Trò Chơi (Game)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=4&type=all", script: "gen.js" },
        { title: "Âm Nhạc (Music)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=3&type=all", script: "gen.js" },
        { title: "Phim Ảnh (Cine)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=181&type=all", script: "gen.js" },
        { title: "Công Nghệ (Tech)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=188&type=all", script: "gen.js" }
    ]);
}
