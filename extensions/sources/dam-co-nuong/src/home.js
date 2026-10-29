load('config.js');

function execute() {
    return Response.success([
        {title: "Mới cập nhật", input: "/tim-kiem?sort=-updated_at", script: "gen.js"},
        {title: "Mới nhất", input: "/tim-kiem?sort=-created_at", script: "gen.js"},
        {title: "Top ngày", input: "/tim-kiem?sort=-views_day", script: "gen.js"},
        {title: "Top tuần", input: "/tim-kiem?sort=-views_week", script: "gen.js"},
        {title: "Top all", input: "/tim-kiem?sort=-views", script: "gen.js"},
        {title: "Truyện nhà làm", input: "/nhom-dich/dam-co-nuong", script: "gen.js"}
    ]);
}