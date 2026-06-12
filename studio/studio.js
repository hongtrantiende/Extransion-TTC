const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const JSZip = require('jszip');

// Configs
const STUDIO_DIR = __dirname;
const REPO_DIR = path.join(STUDIO_DIR, '..');
const PROJECT_ROOT = path.join(REPO_DIR, '..');
const REBUILD_EXT_DIR = path.join(PROJECT_ROOT, 'vbook-rebuild', 'app', 'src', 'main', 'assets', 'extensions');
const REPO_INDEX_PATH = path.join(REPO_DIR, 'plugin.json');
const REPO_ZIPS_DIR = path.join(REPO_DIR, 'zips');
const PORT = 8080;
const SERVER_URL = `http://127.0.0.1:${PORT}`;

// Colors
const C = {
    R: '\x1b[31m', // Red
    G: '\x1b[32m', // Green
    Y: '\x1b[33m', // Yellow
    B: '\x1b[34m', // Blue
    M: '\x1b[35m', // Magenta
    C: '\x1b[36m', // Cyan
    W: '\x1b[37m', // White
    Bold: '\x1b[1m',
    Reset: '\x1b[0m'
};

function log(msg, color = C.W) {
    console.log(color + msg + C.Reset);
}

function toSlug(name) {
    return name.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function resolveUrl(urlStr, hostStr, sourceUrl) {
    if (!urlStr) return "";
    const trimUrl = urlStr.trim();
    if (trimUrl.startsWith("http://") || trimUrl.startsWith("https://")) return trimUrl;
    
    let base = (hostStr || "").trim() || (sourceUrl || "").trim() || "";
    if (!base) return trimUrl;
    
    const cleanUrl = trimUrl.startsWith("/") ? trimUrl.substring(1) : trimUrl;
    const cleanBase = base.endsWith("/") ? base : base + "/";
    return cleanBase + cleanUrl;
}

// 1. ADB Port Forwarding
function adbForward() {
    log("=== THIẾT LẬP ADB PORT FORWARD ===", C.Bold + C.C);
    let adbPath = 'adb';
    if (process.env.LOCALAPPDATA) {
        const standardAdb = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
        if (fs.existsSync(standardAdb)) {
            adbPath = standardAdb;
        }
    }
    try {
        execSync(`"${adbPath}" forward tcp:${PORT} tcp:${PORT}`, { stdio: 'pipe' });
        log("✔ ADB port forward tcp:8080 -> tcp:8080 thành công!", C.G);
        return true;
    } catch (e) {
        log(`⚠ Cảnh báo ADB forward thất bại: ${e.message}`, C.Y);
        log(`Hãy chắc chắn điện thoại đã bật gỡ lỗi USB (USB Debugging) và cắm cáp kết nối PC.`, C.Y);
        return false;
    }
}

// 2. Check Connection
async function checkServer() {
    try {
        const res = await fetch(`${SERVER_URL}/connect`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
            const data = await res.json();
            log(`✔ Đã kết nối với Novel Reader Server (Phone)! Trạng thái: ${JSON.stringify(data)}`, C.G);
            return true;
        }
    } catch (e) {
        log(`❌ Không thể kết nối tới Server trên điện thoại tại ${SERVER_URL}`, C.R);
        log(`Chi tiết lỗi: ${e.message}`, C.R);
        log(`Hãy kiểm tra:`, C.Y);
        log(`1. Novel Reader trên điện thoại đã được cài đặt và đang chạy.`, C.Y);
        log(`2. Đã bật "Developer Mode" hoặc "Bắt đầu máy chủ test" trong cài đặt ứng dụng.`, C.Y);
        log(`3. Cáp USB kết nối ổn định.`, C.Y);
    }
    return false;
}

// Send request to phone JS test engine
async function callPhoneEngine(pluginText, srcObj, scriptFile, args = []) {
    const payload = {
        plugin: pluginText,
        src: JSON.stringify(srcObj),
        icon: '',
        input: JSON.stringify({ script: scriptFile, vararg: args })
    };
    const r = await fetch(`${SERVER_URL}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30s timeout cho mỗi bước mạng
    });
    if (!r.ok) {
        throw new Error(`Server returned HTTP ${r.status}`);
    }
    return await r.json();
}

function parseToArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
    } catch (e) {}
    return [];
}

function verifyChapter(contentStr, type) {
    if (!contentStr) return { ok: false, desc: 'Rỗng (Null/Empty)' };
    const s = contentStr.toLowerCase();
    if (type === 'novel') {
        if (contentStr.length > 100) return { ok: true, desc: `Truyện chữ: ${contentStr.length} ký tự (Đạt)` };
        return { ok: false, desc: `Truyện chữ quá ngắn: ${contentStr.length} ký tự` };
    }
    if (type === 'comic') {
        if (s.includes('.jpg') || s.includes('.png') || s.includes('.webp') || s.includes('http')) {
            const count = (contentStr.match(/http/g) || []).length;
            return { ok: true, desc: `Truyện tranh: Phát hiện ${count} ảnh (Đạt)` };
        }
        return { ok: false, desc: 'Không tìm thấy liên kết ảnh hợp lệ' };
    }
    if (type === 'video') {
        let isJsonArray = false;
        try {
            const parsed = JSON.parse(contentStr);
            if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].data !== undefined || parsed[0].url !== undefined)) {
                isJsonArray = true;
            }
        } catch (e) {}

        if (isJsonArray || s.includes('.m3u8') || s.includes('.m3u9') || s.includes('.mp4') || s.includes('embed') || s.includes('player') || s.includes('data:') || s.includes('track:')) {
            return { ok: true, desc: `Video Stream/Track/Embed: ${contentStr.substring(0, 100)}... (Đạt)` };
        }
        return { ok: false, desc: 'Không tìm thấy URL stream hoặc thẻ nhúng video phát được' };
    }
    return { ok: contentStr.length > 20, desc: `Khác: ${contentStr.length} bytes` };
}

// 3. Deep Test Pipeline
async function testExtension(extId) {
    log(`\n=== BẮT ĐẦU KIỂM THỬ SÂU EXTENSION: ${extId} ===`, C.Bold + C.C);
    
    if (extId === 'youtube') {
        log(`\n[NGOẠI LỆ] YouTube là tiện ích đặc thù (cần tìm kiếm trực tiếp trên app mới xem được). Bỏ qua kiểm thử tự động.`, C.Bold + C.G);
        log(`🎉 THÀNH CÔNG! (Bỏ qua do ngoại lệ)`, C.Bold + C.G);
        return;
    }

    adbForward();
    const serverConnected = await checkServer();
    if (!serverConnected) return;

    const extPath = path.join(REBUILD_EXT_DIR, extId);
    const pluginJsonPath = path.join(extPath, 'plugin.json');
    const srcDir = path.join(extPath, 'src');

    if (!fs.existsSync(pluginJsonPath)) {
        log(`❌ Không tìm thấy thư mục extension hoặc plugin.json tại: ${pluginJsonPath}`, C.R);
        return;
    }

    const pluginText = fs.readFileSync(pluginJsonPath, 'utf8');
    const pluginObj = JSON.parse(pluginText);
    const metadata = pluginObj.metadata || {};
    const extType = metadata.type || 'novel';
    const script = pluginObj.script || {};

    const srcFiles = fs.readdirSync(srcDir);
    const srcObj = {};
    for (const f of srcFiles) {
        const fp = path.join(srcDir, f);
        if (fs.statSync(fp).isFile() && f.endsWith('.js')) {
            srcObj[f] = fs.readFileSync(fp, 'utf8');
        }
    }

    // --- STEP 1: HOME ---
    const homeFile = script.home;
    if (!homeFile || !srcObj[homeFile]) {
        log(`❌ Không cấu hình home.js trong plugin.json`, C.R);
        return;
    }

    log(`\nStep 1: Nạp Trang Chủ (${homeFile})...`, C.B);
    let homeRes;
    try {
        homeRes = await callPhoneEngine(pluginText, srcObj, homeFile, []);
    } catch (e) {
        log(`❌ Lỗi mạng khi gọi điện thoại: ${e.message}`, C.R);
        return;
    }

    if (homeRes.exception) {
        log(`❌ JS Exception tại Trang Chủ:\n${homeRes.exception}`, C.R);
        printRhinoLogs(homeRes.log);
        return;
    }

    printRhinoLogs(homeRes.log);

    let items = [];
    try {
        const parsed = JSON.parse(homeRes.result);
        items = parsed.data || parsed;
    } catch (e) {
        log(`❌ Không thể parse kết quả JSON trả về từ Home: ${homeRes.result}`, C.R);
        return;
    }

    log(`✔ Trang chủ trả về ${items.length} phần tử.`, C.G);
    if (items.length === 0) {
        log(`⚠ Kết quả rỗng. Dừng pipeline.`, C.Y);
        return;
    }

    let nextUrl = null;
    let selectedItem = null;
    const firstItem = items[0];

    // --- STEP 1.5: TAB/GEN (nếu home trả về danh sách Tab) ---
    if (firstItem && firstItem.script && firstItem.script.endsWith('.js')) {
        const tabScript = firstItem.script;
        const tabInput = firstItem.input || firstItem.url;
        log(`\nStep 1.5: Home trả về Tabs. Nạp Tab tiếp theo (${tabScript}) với đầu vào: ${tabInput}...`, C.B);
        
        if (!srcObj[tabScript]) {
            log(`❌ Tệp script của tab "${tabScript}" không tồn tại trong src/`, C.R);
            return;
        }

        let tabRes;
        try {
            tabRes = await callPhoneEngine(pluginText, srcObj, tabScript, [tabInput]);
        } catch (e) {
            log(`❌ Lỗi mạng: ${e.message}`, C.R);
            return;
        }

        if (tabRes.exception) {
            log(`❌ JS Exception tại Tab:\n${tabRes.exception}`, C.R);
            printRhinoLogs(tabRes.log);
            return;
        }
        printRhinoLogs(tabRes.log);

        let tabItems = [];
        try {
            const parsed = JSON.parse(tabRes.result);
            tabItems = parsed.data || parsed;
        } catch (e) {
            log(`❌ Không thể parse JSON của Tab: ${tabRes.result}`, C.R);
            return;
        }

        log(`✔ Tab trả về ${tabItems.length} phần tử.`, C.G);
        log(`[DEBUG tabRes.result]: ${tabRes.result.substring(0, 300)}`, C.Y);
        if (tabItems.length === 0) {
            log(`⚠ Tab rỗng. Dừng pipeline.`, C.Y);
            return;
        }
        selectedItem = tabItems[0];
        nextUrl = selectedItem.url || selectedItem.link;
        if (typeof nextUrl === 'function') nextUrl = null;
        nextUrl = resolveUrl(nextUrl, selectedItem.host || firstItem.host, metadata.source);
    } else {
        selectedItem = firstItem;
        nextUrl = selectedItem.url || selectedItem.link;
        if (typeof nextUrl === 'function') nextUrl = null;
        nextUrl = resolveUrl(nextUrl, selectedItem.host, metadata.source);
    }

    if (!nextUrl) {
        log(`❌ Không tìm thấy trường URL/link trong phần tử mẫu: ${JSON.stringify(selectedItem)}`, C.R);
        return;
    }

    log(`👉 Chọn phần tử mẫu: "${selectedItem.name || selectedItem.title}" | URL: ${nextUrl}`, C.C);

    // --- STEP 2: DETAIL ---
    const detailFile = script.detail;
    let tocUrl = nextUrl;
    let detailObj = null;
    if (detailFile && srcObj[detailFile]) {
        log(`\nStep 2: Nạp Chi Tiết Truyện (${detailFile})...`, C.B);
        let detailRes;
        try {
            detailRes = await callPhoneEngine(pluginText, srcObj, detailFile, [nextUrl]);
        } catch (e) {
            log(`❌ Lỗi mạng: ${e.message}`, C.R);
            return;
        }

        if (detailRes.exception) {
            log(`❌ JS Exception tại Chi Tiết:\n${detailRes.exception}`, C.R);
            printRhinoLogs(detailRes.log);
            return;
        }
        printRhinoLogs(detailRes.log);

        try {
            const parsed = JSON.parse(detailRes.result);
            detailObj = parsed.data || parsed;
        } catch (e) {
            log(`❌ Không thể parse JSON của Chi Tiết: ${detailRes.result}`, C.R);
            return;
        }

        log(`✔ Nạp chi tiết truyện thành công: "${detailObj.name || detailObj.title}"`, C.G);
        log(`   Tác giả: ${detailObj.author || 'Không rõ'} | Trạng thái: ${detailObj.status || 'Không rõ'}`, C.W);
        if (detailObj.url || detailObj.tocUrl) {
            tocUrl = detailObj.url || detailObj.tocUrl;
        }
        tocUrl = resolveUrl(tocUrl, detailObj.host || selectedItem.host, metadata.source);
    } else {
        log(`\nStep 2: Không cấu hình detail.js, bỏ qua và lấy trực tiếp URL từ Home để nạp TOC.`, C.Y);
        tocUrl = resolveUrl(tocUrl, selectedItem.host, metadata.source);
    }

    // --- STEP 3: TOC (Mục lục chương) ---
    const tocFile = script.toc;
    if (!tocFile || !srcObj[tocFile]) {
        log(`❌ Không cấu hình toc.js trong plugin.json`, C.R);
        return;
    }

    log(`\nStep 3: Nạp Mục Lục Chương (${tocFile}) | URL: ${tocUrl}...`, C.B);
    let tocRes;
    try {
        tocRes = await callPhoneEngine(pluginText, srcObj, tocFile, [tocUrl]);
    } catch (e) {
        log(`❌ Lỗi mạng: ${e.message}`, C.R);
        return;
    }

    if (tocRes.exception) {
        log(`❌ JS Exception tại Mục Lục:\n${tocRes.exception}`, C.R);
        printRhinoLogs(tocRes.log);
        return;
    }
    printRhinoLogs(tocRes.log);

    let chapters = [];
    try {
        chapters = parseToArray(tocRes.result);
    } catch (e) {
        log(`❌ Không thể parse JSON của Mục Lục: ${tocRes.result}`, C.R);
        return;
    }

    log(`✔ Tìm thấy ${chapters.length} chương.`, C.G);
    if (chapters.length === 0) {
        log(`⚠ Mục lục rỗng. Dừng pipeline.`, C.Y);
        return;
    }

    // Tìm chương đầu tiên thực tế (bỏ qua các section phân loại nếu có)
    const firstChap = chapters.find(c => c.url || c.link);
    if (!firstChap) {
        log(`❌ Mục lục không chứa liên kết chương nào hợp lệ!`, C.R);
        return;
    }

    let chapUrl = firstChap.url || firstChap.link;
    chapUrl = resolveUrl(chapUrl, firstChap.host || (detailObj ? detailObj.host : null) || selectedItem.host, metadata.source);
    log(`👉 Chọn chương mẫu: "${firstChap.name}" | URL: ${chapUrl}`, C.C);

    // --- STEP 4: CHAPTER CONTENT (Nội dung chương) ---
    const chapFile = script.chap || script.episode || script.page;
    if (!chapFile || !srcObj[chapFile]) {
        log(`❌ Không cấu hình chap.js/episode.js trong plugin.json`, C.R);
        return;
    }

    log(`\nStep 4: Nạp Nội Dung Chương (${chapFile}) | URL: ${chapUrl}...`, C.B);
    let chapRes;
    try {
        chapRes = await callPhoneEngine(pluginText, srcObj, chapFile, [chapUrl]);
    } catch (e) {
        log(`❌ Lỗi mạng: ${e.message}`, C.R);
        return;
    }

    if (chapRes.exception) {
        log(`❌ JS Exception tại Nội Dung Chương:\n${chapRes.exception}`, C.R);
        printRhinoLogs(chapRes.log);
        return;
    }
    printRhinoLogs(chapRes.log);

    let chapContent = '';
    try {
        const parsed = JSON.parse(chapRes.result);
        const data = parsed.data !== undefined ? parsed.data : parsed;
        if (typeof data === 'string') {
            chapContent = data;
        } else if (data && typeof data === 'object') {
            chapContent = data.content || JSON.stringify(data);
        } else {
            chapContent = String(data);
        }
    } catch (e) {
        log(`❌ Không thể parse JSON của Nội dung chương: ${chapRes.result}`, C.R);
        return;
    }

    const verification = verifyChapter(chapContent, extType);
    if (verification.ok) {
        log(`\n🎉 THÀNH CÔNG! Pipeline kiểm thử hoàn chỉnh vượt qua trơn tru!`, C.Bold + C.G);
        log(`[KẾT QUẢ]: ${verification.desc}`, C.G);
    } else {
        log(`\n🔶 CẢNH BÁO! Pipeline hoàn thành nhưng dữ liệu chương không đạt chuẩn!`, C.Bold + C.Y);
        log(`[LÝ DO]: ${verification.desc}`, C.Y);
        log(`Nội dung thô nhận được (100 ký tự đầu):`, C.W);
        log(chapContent.substring(0, 100) + '...', C.W);
    }
}

function printRhinoLogs(logs) {
    if (!logs || logs.length === 0) return;
    log(`--- Nhật ký điện thoại (Rhino Logs) ---`, C.Bold + C.M);
    logs.forEach(line => {
        log(`  ${line}`, C.M);
    });
    log(`--------------------------------------`, C.Bold + C.M);
}

// 4. Hot Install to Device
async function installExtension(extId) {
    log(`\n=== BẮT ĐẦU CÀI ĐẶT NÓNG EXTENSION: ${extId} TO DEVICE ===`, C.Bold + C.C);
    
    adbForward();
    const serverConnected = await checkServer();
    if (!serverConnected) return;

    const extPath = path.join(REBUILD_EXT_DIR, extId);
    const pluginJsonPath = path.join(extPath, 'plugin.json');
    const srcDir = path.join(extPath, 'src');

    if (!fs.existsSync(pluginJsonPath)) {
        log(`❌ Không tìm thấy thư mục extension hoặc plugin.json tại: ${pluginJsonPath}`, C.R);
        return;
    }

    const pluginText = fs.readFileSync(pluginJsonPath, 'utf8');
    const srcFiles = fs.readdirSync(srcDir);
    const srcObj = {};
    for (const f of srcFiles) {
        const fp = path.join(srcDir, f);
        if (fs.statSync(fp).isFile() && f.endsWith('.js')) {
            srcObj[f] = fs.readFileSync(fp, 'utf8');
        }
    }

    let iconBase64 = "";
    const iconPath = path.join(extPath, 'icon.png');
    if (fs.existsSync(iconPath)) {
        const iconBuffer = fs.readFileSync(iconPath);
        iconBase64 = "data:image/png;base64," + iconBuffer.toString('base64');
    }

    const payload = {
        plugin: pluginText,
        src: JSON.stringify(srcObj),
        icon: iconBase64
    };

    try {
        const res = await fetch(`${SERVER_URL}/install`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000)
        });
        if (res.ok) {
            const data = await res.json();
            if (data.success) {
                log(`✔ Cài đặt thành công! Extension "${extId}" đã được nạp trực tiếp vào điện thoại và kích hoạt.`, C.G);
                log(`Hãy mở ứng dụng Novel Reader trên điện thoại để kiểm thử UI trực tiếp!`, C.G);
            } else {
                log(`❌ Cài đặt thất bại: ${data.message}`, C.R);
            }
        } else {
            log(`❌ Cài đặt thất bại, server trả về mã lỗi HTTP ${res.status}`, C.R);
        }
    } catch (e) {
        log(`❌ Lỗi mạng khi cài đặt: ${e.message}`, C.R);
    }
}

// 5. Pack Extension (Zip and version bump)
async function packExtension(extId, bumpType = 'patch') {
    log(`\n=== BẮT ĐẦU ĐÓNG GỐI TIỆN ÍCH: ${extId} ===`, C.Bold + C.C);

    const extPath = path.join(REBUILD_EXT_DIR, extId);
    const pluginJsonPath = path.join(extPath, 'plugin.json');
    if (!fs.existsSync(pluginJsonPath)) {
        log(`❌ Không tìm thấy tiện ích local: ${pluginJsonPath}`, C.R);
        return;
    }

    const pluginText = fs.readFileSync(pluginJsonPath, 'utf8');
    const pluginObj = JSON.parse(pluginText);
    const currentVersion = pluginObj.metadata.version || 1;
    const nextVersion = currentVersion + 1; // VBook dùng phiên bản kiểu integer

    log(`👉 Phiên bản hiện tại: ${currentVersion} -> Phiên bản mới: ${nextVersion}`, C.Y);

    // 1. Cập nhật version trong local plugin.json
    pluginObj.metadata.version = nextVersion;
    fs.writeFileSync(pluginJsonPath, JSON.stringify(pluginObj, null, 2), 'utf8');
    log(`✔ Đã cập nhật plugin.json cục bộ của extension.`, C.G);

    // 2. Cập nhật version trong Extransion-TTC/plugin.json
    if (fs.existsSync(REPO_INDEX_PATH)) {
        const repoText = fs.readFileSync(REPO_INDEX_PATH, 'utf8');
        const repoObj = JSON.parse(repoText);
        const extList = repoObj.data || [];
        
        // Tìm extension bằng tên slug hoặc name
        const match = extList.find(e => toSlug(e.name) === extId || toSlug(e.name) === toSlug(pluginObj.metadata.name));
        if (match) {
            match.version = nextVersion;
            // Cập nhật các trường mô tả khác nếu cần đồng bộ
            match.description = pluginObj.metadata.description || match.description;
            fs.writeFileSync(REPO_INDEX_PATH, JSON.stringify(repoObj, null, 2), 'utf8');
            log(`✔ Đã cập nhật version lên ${nextVersion} trong catalog index (plugin.json) của repo Extransion-TTC.`, C.G);
        } else {
            log(`⚠ Cảnh báo: Không tìm thấy extension "${pluginObj.metadata.name}" trong Extransion-TTC/plugin.json. Hãy thêm thủ công nếu là extension mới.`, C.Y);
        }
    }

    // 3. Nén zip sử dụng JSZip
    const zip = new JSZip();
    zip.file('plugin.json', JSON.stringify(pluginObj, null, 2));
    
    const iconPath = path.join(extPath, 'icon.png');
    if (fs.existsSync(iconPath)) {
        zip.file('icon.png', fs.readFileSync(iconPath));
    }

    const srcDir = path.join(extPath, 'src');
    if (fs.existsSync(srcDir)) {
        const zipSrcFolder = zip.folder('src');
        const jsFiles = fs.readdirSync(srcDir);
        for (const file of jsFiles) {
            const fp = path.join(srcDir, file);
            if (fs.statSync(fp).isFile() && file.endsWith('.js')) {
                zipSrcFolder.file(file, fs.readFileSync(fp));
            }
        }
    }

    if (!fs.existsSync(REPO_ZIPS_DIR)) {
        fs.mkdirSync(REPO_ZIPS_DIR, { recursive: true });
    }

    const outputZipPath = path.join(REPO_ZIPS_DIR, `${extId}.zip`);
    const content = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(outputZipPath, content);
    log(`✔ Đã đóng gói thành công tệp nén: ${outputZipPath}`, C.G);
}

// 6. Push changes to GitHub
function pushRepo(commitMessage) {
    log(`\n=== ĐẨY BẢN VÁ LÊN GITHUB KHO TIỆN ÍCH ===`, C.Bold + C.C);
    if (!fs.existsSync(REPO_DIR)) {
        log(`❌ Thư mục repo Extransion-TTC không tồn tại tại: ${REPO_DIR}`, C.R);
        return;
    }

    const msg = commitMessage || "Fix and update extensions";
    try {
        log("1. Git status...", C.B);
        const statusOut = execSync('git status -s', { cwd: REPO_DIR }).toString().trim();
        if (!statusOut) {
            log("✔ Kho tiện ích làm việc sạch sẽ. Không có thay đổi nào cần commit.", C.G);
            return;
        }
        log(statusOut, C.W);

        log("2. Git add...", C.B);
        execSync('git add .', { cwd: REPO_DIR });

        log(`3. Git commit với lời nhắn: "${msg}"...`, C.B);
        execSync(`git commit -m "${msg}"`, { cwd: REPO_DIR });

        log("4. Git push origin main...", C.B);
        const pushOut = execSync('git push origin main', { cwd: REPO_DIR }).toString();
        log(pushOut, C.W);
        log("✔ Đẩy thay đổi lên GitHub kho Extransion-TTC thành công!", C.G);
    } catch (e) {
        log(`❌ Lỗi khi thực hiện lệnh git: ${e.message}`, C.R);
    }
}

// 7. Bulk scan and test all extensions
async function scanAll(limitStr) {
    log(`\n=== BẮT ĐẦU QUÉT TOÀN BỘ KHO TIỆN ÍCH ===`, C.Bold + C.C);
    adbForward();
    const serverConnected = await checkServer();
    if (!serverConnected) return;

    if (!fs.existsSync(REPO_INDEX_PATH)) {
        log(`❌ Tệp chỉ mục ${REPO_INDEX_PATH} không tồn tại!`, C.R);
        return;
    }

    const repo = JSON.parse(fs.readFileSync(REPO_INDEX_PATH, 'utf8'));
    let extensions = repo.data || [];
    const limit = parseInt(limitStr) || 0;
    if (limit > 0) {
        extensions = extensions.slice(0, limit);
        log(`⚡ Giới hạn quét ${limit} tiện ích.`, C.Y);
    }

    const total = extensions.length;
    log(`🚀 Đang quét ${total} tiện ích. Vui lòng chờ...`, C.C);

    const report = {
        scanTime: new Date().toISOString(),
        total,
        success: [],
        broken: [],
        skipped: []
    };

    for (let i = 0; i < total; i++) {
        const ext = extensions[i];
        const extId = toSlug(ext.name);
        const extPath = path.join(REBUILD_EXT_DIR, extId);
        const pluginJsonPath = path.join(extPath, 'plugin.json');

        process.stdout.write(`[${i + 1}/${total}] ${ext.name} (${ext.type})... `);

        if (!fs.existsSync(pluginJsonPath)) {
            console.log(`${C.Y}BỎ QUA (Không có code local)${C.Reset}`);
            report.skipped.push({ name: ext.name, reason: 'No local files' });
            continue;
        }

        try {
            const pluginText = fs.readFileSync(pluginJsonPath, 'utf8');
            const pluginObj = JSON.parse(pluginText);
            const script = pluginObj.script || {};
            const homeFile = script.home;

            if (!homeFile) {
                console.log(`${C.R}LỖI (Thiếu home.js)${C.Reset}`);
                report.broken.push({ name: ext.name, id: extId, reason: 'No home script configured' });
                continue;
            }

            const srcDir = path.join(extPath, 'src');
            const srcObj = {};
            if (fs.existsSync(srcDir)) {
                fs.readdirSync(srcDir).forEach(f => {
                    if (f.endsWith('.js')) srcObj[f] = fs.readFileSync(path.join(srcDir, f), 'utf8');
                });
            }

            if (!srcObj[homeFile]) {
                console.log(`${C.R}LỖI (Thiếu file ${homeFile})${C.Reset}`);
                report.broken.push({ name: ext.name, id: extId, reason: `${homeFile} file missing` });
                continue;
            }

            const homeRes = await callPhoneEngine(pluginText, srcObj, homeFile, []);
            if (homeRes.exception) {
                const briefErr = homeRes.exception.split('\n')[0].substring(0, 80);
                console.log(`${C.R}JS EXCEPTION: ${briefErr}${C.Reset}`);
                report.broken.push({ name: ext.name, id: extId, reason: 'JS Exception: ' + briefErr });
                continue;
            }

            let items = [];
            try {
                const parsed = JSON.parse(homeRes.result);
                items = parsed.data || parsed;
            } catch (e) {}

            if (items.length === 0) {
                console.log(`${C.Y}RỖNG (Không lấy được danh sách)${C.Reset}`);
                report.broken.push({ name: ext.name, id: extId, reason: 'Empty home list' });
            } else {
                console.log(`${C.G}OK (${items.length} phần tử)${C.Reset}`);
                report.success.push({ name: ext.name, id: extId, count: items.length });
            }
        } catch (err) {
            const errMsg = err.message || String(err);
            console.log(`${C.R}LỖI MẠNG/HỆ THỐNG: ${errMsg.substring(0, 60)}${C.Reset}`);
            report.broken.push({ name: ext.name, id: extId, reason: 'Network/Engine crash: ' + errMsg });
        }
    }

    log(`\n================ KẾT QUẢ QUÉT TOÀN BỘ MẠNG ================`, C.Bold + C.C);
    log(`Tổng số quét: ${total}`, C.W);
    log(`✅ Thành công (OK): ${report.success.length}`, C.G);
    log(`❌ Bị lỗi/Site sập: ${report.broken.length}`, C.R);
    log(`⏩ Bỏ qua (không có code): ${report.skipped.length}`, C.Y);
    log(`===========================================================`, C.Bold + C.C);

    if (report.broken.length > 0) {
        log(`\nDanh sách tiện ích lỗi cần ưu tiên sửa:`, C.Y);
        report.broken.forEach(b => {
            log(`  - [${b.id}] ${b.name}: ${b.reason}`, C.R);
        });
    }

    const reportPath = path.join(PROJECT_ROOT, 'scratch', 'scan_all_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    log(`\n📄 Đã lưu báo cáo chi tiết vào: ${reportPath}`, C.C);
}

// Main Command Router
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        showHelp();
        return;
    }

    const command = args[0];
    const target = args[1];

    switch (command) {
        case 'test':
            if (!target) {
                log("❌ Thiếu id extension cần test. Ví dụ: node studio.js test anime-hay", C.R);
                return;
            }
            await testExtension(target);
            break;
        case 'install':
            if (!target) {
                log("❌ Thiếu id extension cần cài đặt. Ví dụ: node studio.js install anime-hay", C.R);
                return;
            }
            await installExtension(target);
            break;
        case 'pack':
            if (!target) {
                log("❌ Thiếu id extension cần đóng gói. Ví dụ: node studio.js pack anime-hay", C.R);
                return;
            }
            await packExtension(target);
            break;
        case 'push':
            pushRepo(target);
            break;
        case 'scan':
            await scanAll(target);
            break;
        case 'help':
        default:
            showHelp();
            break;
    }
}

function showHelp() {
    log(`\n=================== TTC EXTENSION STUDIO ===================`, C.Bold + C.C);
    log(`Công cụ tối ưu hóa phát triển, kiểm thử và phân phối VBook Extensions.`);
    log(`Sử dụng điện thoại vật lý kết nối qua ADB làm môi trường chạy thực tế.`);
    log(`\nLỆNH SỬ DỤNG:`, C.Bold + C.Y);
    log(`  node studio.js test <ext-id>        : Chạy kiểm thử sâu (Deep Test) 4 bước trên điện thoại.`);
    log(`  node studio.js install <ext-id>     : Đóng gói và cài đặt nóng extension vào app trên điện thoại.`);
    log(`  node studio.js pack <ext-id>        : Tự động nâng phiên bản (+1) và nén zip lưu vào Extransion-TTC.`);
    log(`  node studio.js push "[lời nhắn]"    : Commit và push các tệp thay đổi của repo Extransion-TTC lên GitHub.`);
    log(`  node studio.js scan [limit]         : Dò quét nhanh danh sách tiện ích, kiểm thử kết nối các nguồn.`);
    log(`\nVÍ DỤ THỰC TẾ:`, C.Bold + C.Y);
    log(`  node studio.js test anime-hay`);
    log(`  node studio.js install anime-hay`);
    log(`  node studio.js pack anime-hay`);
    log(`  node studio.js push "Vá lỗi nguồn Anime Hay do đổi cấu trúc link"`);
    log(`=============================================================`, C.Bold + C.C);
}

main();
