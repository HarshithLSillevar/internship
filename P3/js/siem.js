// CYBERSIM PRO - SIEM & INCIDENT RESPONSE ENGINE

const SiemModule = (() => {
  let logStreamPane, searchInput, clearBtn;
  let chkCrit, chkWarn, chkInfo;
  let btnBrute, btnSqli, btnXss, btnWeakpw;
  let progressText, progressBar;

  let logStreamInterval = null;
  const loggedEvents = []; // Holds all generated log records: { id, time, level, text }
  let eventCounter = 0;

  function init() {
    logStreamPane = document.getElementById("siem-log-stream");
    searchInput = document.getElementById("siem-search-input");
    clearBtn = document.getElementById("btn-siem-clear");
    
    chkCrit = document.getElementById("siem-filter-critical");
    chkWarn = document.getElementById("siem-filter-warning");
    chkInfo = document.getElementById("siem-filter-info");
    
    btnBrute = document.getElementById("btn-mitigate-bruteforce");
    btnSqli = document.getElementById("btn-mitigate-sqli");
    btnXss = document.getElementById("btn-mitigate-xss");
    btnWeakpw = document.getElementById("btn-mitigate-weakpw");
    
    progressText = document.getElementById("siem-progress-percent");
    progressBar = document.getElementById("siem-mitigate-bar");

    // Clear logs console
    clearBtn.addEventListener("click", () => {
      loggedEvents.length = 0;
      renderLogStream();
      logSessionAction("SIEM Console", "Logs Cleared", "Buffer purged");
    });

    // Filters event listeners
    chkCrit.addEventListener("change", renderLogStream);
    chkWarn.addEventListener("change", renderLogStream);
    chkInfo.addEventListener("change", renderLogStream);
    searchInput.addEventListener("input", renderLogStream);

    // Mitigation button event listeners
    btnBrute.addEventListener("click", () => applyMitigation("bruteforce", btnBrute, "siem-alert-bruteforce", "Firewall IP Block: 203.0.113.88 banned"));
    btnSqli.addEventListener("click", () => applyMitigation("sqli", btnSqli, "siem-alert-sqli", "Prepared Statements: SQL injection query validation patched"));
    btnXss.addEventListener("click", () => applyMitigation("xss", btnXss, "siem-alert-xss", "HTML Output Sanitizer: Feedback comments escaped"));
    btnWeakpw.addEventListener("click", () => applyMitigation("weakpw", btnWeakpw, "siem-alert-weakpw", "Hash storage: Replaced MD5 with BCrypt cost stretching"));

    // Start streaming logs loop
    startLogStream();

    // Make SiemModule available globally
    window.SiemModule = {
      reset,
      insertSystemEvent: (text) => insertLogEvent("info", text)
    };
  }

  function startLogStream() {
    // Prime initial log history
    for(let i = 0; i < 15; i++) {
      generateMockEvent();
    }
    renderLogStream();

    // Loop log feeding every 900ms
    logStreamInterval = setInterval(() => {
      generateMockEvent();
      renderLogStream();
    }, 950);
  }

  function generateMockEvent() {
    const levels = ["info", "info", "info", "info", "warning", "warning", "critical"];
    const chosenLevel = levels[Math.floor(Math.random() * levels.length)];
    const pool = CYBER_DATA.siemLogs[chosenLevel];
    let logText = pool[Math.floor(Math.random() * pool.length)];

    // Dynamic log overrides depending on active mitigations
    if (AppState.mitigations.bruteforce && logText.includes("203.0.113.88")) {
      logText = "firewall: DROP connection request from blocked host 203.0.113.88 port 22";
    }
    if (AppState.mitigations.sqli && logText.includes("SQL error")) {
      logText = "mysql_audit: SQL parameterized request validated safely.";
    }
    if (AppState.mitigations.xss && logText.includes("<script>")) {
      logText = "web_nginx: Filtered stored input containing suspicious script tags.";
    }

    insertLogEvent(chosenLevel, logText);
  }

  function insertLogEvent(level, text) {
    eventCounter++;
    const time = new Date().toLocaleTimeString();
    loggedEvents.push({ id: eventCounter, time, level, text });
    
    // Maintain maximum buffer of 200 logs to optimize performance
    if (loggedEvents.length > 200) {
      loggedEvents.shift();
    }
  }

  function renderLogStream() {
    const searchVal = searchInput.value.toLowerCase();
    
    logStreamPane.innerHTML = "";
    
    const showCrit = chkCrit.checked;
    const showWarn = chkWarn.checked;
    const showInfo = chkInfo.checked;

    const filtered = loggedEvents.filter(log => {
      // Level checks
      if (log.level === "critical" && !showCrit) return false;
      if (log.level === "warning" && !showWarn) return false;
      if (log.level === "info" && !showInfo) return false;
      
      // Search matching
      if (searchVal && !log.text.toLowerCase().includes(searchVal)) return false;
      
      return true;
    });

    if (filtered.length === 0) {
      logStreamPane.innerHTML = "<div class='txt-muted font-mono text-center mt-md'>No matching logs found in buffer...</div>";
      return;
    }

    filtered.forEach(log => {
      const row = document.createElement("div");
      row.className = "log-row";
      
      let levelBadge = "";
      if (log.level === "critical") levelBadge = "<span class='txt-rose font-bold'>[CRIT]</span>";
      else if (log.level === "warning") levelBadge = "<span class='txt-warning font-bold'>[WARN]</span>";
      else levelBadge = "<span class='txt-cyan'>[INFO]</span>";

      row.innerHTML = `<span class="txt-muted">${log.time}</span> ${levelBadge} ${log.text}`;
      logStreamPane.appendChild(row);
    });

    // Auto-scroll to bottom of stream console
    logStreamPane.scrollTop = logStreamPane.scrollHeight;
  }

  function applyMitigation(key, button, alertId, successText) {
    if (AppState.mitigations[key]) return;

    // Set state
    AppState.mitigations[key] = true;
    logSessionAction("Incident Response", "Applied Hotfix", successText);
    
    // Style mitigation button to disabled success
    button.disabled = true;
    button.innerText = "Secured";
    button.className = "btn btn-outline-cyan text-xs py-xs";
    
    // Style corresponding alert panel card to green Secured
    const alertBox = document.getElementById(alertId);
    alertBox.className = "alert-box alert-green flex justify-between items-center";
    alertBox.style.backgroundColor = "rgba(0, 255, 102, 0.03)";
    alertBox.style.borderColor = "rgba(0, 255, 102, 0.15)";
    
    const meta = alertBox.querySelector("p");
    meta.innerText = "Status: Patch Successfully Implemented";
    meta.className = "text-xs txt-green mt-xs";

    // Insert hotfix logs into stream
    insertLogEvent("info", `SYSTEM_HOTFIX: Applied secops script for [${key.toUpperCase()}]. Threat neutralized.`);
    renderLogStream();

    // Recalculate completions & scores
    updateMitigationProgress();
    updateGlobalScore();
  }

  function updateMitigationProgress() {
    let count = 0;
    for (const key in AppState.mitigations) {
      if (AppState.mitigations[key]) count++;
    }

    const percent = count * 25; // 4 mitigations
    progressText.innerText = `${percent}% Secured`;
    progressBar.style.width = `${percent}%`;

    // Audit check: If all mitigations are resolved, SIEM lab complete!
    if (count === 4) {
      AppState.completions.siem = true;
      logSessionAction("SIEM Lab", "System Hardened", "All four vulnerabilities patched");
    }
  }

  function reset() {
    // Reset mitigations
    const buttons = [
      { key: "bruteforce", btn: btnBrute, alert: "siem-alert-bruteforce", desc: "Source: 203.0.113.88 → Port 22", type: "danger" },
      { key: "sqli", btn: btnSqli, alert: "siem-alert-sqli", desc: "Source: Web application forms", type: "warning" },
      { key: "xss", btn: btnXss, alert: "siem-alert-xss", desc: "Payload identified in Feedback Database", type: "warning" },
      { key: "weakpw", btn: btnWeakpw, alert: "siem-alert-weakpw", desc: "Admin hash cracked using local MD5 dictionaries", type: "danger" }
    ];

    buttons.forEach(b => {
      // Re-enable buttons
      b.btn.disabled = false;
      b.btn.innerText = b.key === 'bruteforce' || b.key === 'weakpw' ? 'Apply IP Block' : b.key === 'sqli' ? 'Patch SQL Queries' : 'Apply HTML Sanitizer';
      b.btn.className = `btn btn-${b.type === 'danger' ? 'danger' : 'warning'} text-xs py-xs`;

      // Reset alert panel colors
      const alertBox = document.getElementById(b.alert);
      alertBox.className = `alert-box alert-${b.type} flex justify-between items-center`;
      alertBox.style.backgroundColor = "";
      alertBox.style.borderColor = "";

      const meta = alertBox.querySelector("p");
      meta.className = "text-xs txt-muted mt-xs";
      meta.innerText = b.desc;
    });

    loggedEvents.length = 0;
    eventCounter = 0;
    
    chkCrit.checked = true;
    chkWarn.checked = true;
    chkInfo.checked = true;
    searchInput.value = "";
    
    updateMitigationProgress();
  }

  document.addEventListener("DOMContentLoaded", init);

})();
