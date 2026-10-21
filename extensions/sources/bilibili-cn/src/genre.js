load('config.js');

function execute() {
    return Response.success([
        { title: "Hoạt Hình (Anime - 动画)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=1&type=all", script: "gen.js" },
        { title: "Trò Chơi (Game - 游戏)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=4&type=all", script: "gen.js" },
        { title: "Âm Nhạc (Music - 音乐)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=3&type=all", script: "gen.js" },
        { title: "Phim Ảnh (Cine - 影视)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=181&type=all", script: "gen.js" },
        { title: "Vũ Đạo (Dance - 舞蹈)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=129&type=all", script: "gen.js" },
        { title: "Công Nghệ (Tech - 科技)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=188&type=all", script: "gen.js" },
        { title: "Cuộc Sống (Life - 生活)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=160&type=all", script: "gen.js" },
        { title: "Ẩm Thực (Food - 美食)", input: "https://api.bilibili.com/x/web-interface/ranking/v2?rid=211&type=all", script: "gen.js" }
    ]);
}
