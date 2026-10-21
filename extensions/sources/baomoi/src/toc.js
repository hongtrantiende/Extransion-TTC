load('config.js');

function execute(url) {
    return Response.success([{ name: "Đọc bài", url: url, host: BASE_URL }]);
}
