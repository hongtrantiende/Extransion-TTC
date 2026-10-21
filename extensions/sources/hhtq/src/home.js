function execute() {
    var kinds = [
        {
            title: "Phim mới cập nhật",
            name: "Phim mới cập nhật",
            input: "https://hhtq.io/?page=1",
            script: "genre.js"
        },
        {
            title: "Tập mới hôm nay",
            name: "Tập mới hôm nay",
            input: "https://hhtq.io/?today=1",
            script: "genre.js"
        }
    ];
    return Response.success(kinds);
}
