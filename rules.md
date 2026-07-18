# Project Coding Standards & Rules

These standards apply to all code modifications and additions in this project repository.

---

## 🛡️ Rhino JS Engine Coding Rules
Due to the app running on an older Rhino Engine:
- **No ES6+ syntax**: Do not use `async/await`, optional chaining (`?.`), nullish coalescing (`??`), or complex destructuring. Use ES5 syntax for compatibility.
- **Null Safety**: Always convert parsed values to string (`+ ""` or `String(...)`) to prevent null reference errors on Java side. Check elements for existence before querying fields (e.g., check `element ? element.text() : ""`).
- **JSoup Selectors**: Always check if selector matches a node before accessing properties (e.g. `doc.select("a").first()` can be null).

---

## ⚙️ Development Environment (Android / Novela)
- Use `.\gradlew.bat` in Windows PowerShell.
- **KSP Multi-drive Bug**: Set `$env:GRADLE_USER_HOME="C:\Users\bac5a\.gradle"` before running gradle commands.
- Run `assembleAppDebug` to package APKs, and install using ADB:
  `& "C:\Users\bac5a\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s PNAUU475TOYPLV7H install -r -d "app/build/outputs/apk/app/debug/Novela-arm64-v8a-debug.apk"`
