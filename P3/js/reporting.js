// CYBERSIM PRO - SECURITY AUDIT & REPORT GENERATOR MODULE

const ReportingModule = (() => {
  let repCompany, repAnalyst, repNotes;
  let chkScan, chkSqli, chkXss, chkHash;
  let prevCompany, prevAnalyst, prevDate, prevNotes, prevFindingsBody;
  let btnCompile, btnPrint;

  function init() {
    repCompany = document.getElementById("rep-company");
    repAnalyst = document.getElementById("rep-analyst");
    repNotes = document.getElementById("rep-notes");

    chkScan = document.getElementById("rep-chk-scan");
    chkSqli = document.getElementById("rep-chk-sqli");
    chkXss = document.getElementById("rep-chk-xss");
    chkHash = document.getElementById("rep-chk-hash");

    prevCompany = document.getElementById("rep-preview-company");
    prevAnalyst = document.getElementById("rep-preview-analyst");
    prevDate = document.getElementById("rep-preview-date");
    prevNotes = document.getElementById("rep-preview-notes-body");
    prevFindingsBody = document.getElementById("rep-preview-findings-body");

    btnCompile = document.getElementById("btn-compile-report");
    btnPrint = document.getElementById("btn-print-report");

    // Real-time binding changes
    repCompany.addEventListener("input", syncPreviewMetadata);
    repAnalyst.addEventListener("input", syncPreviewMetadata);
    repNotes.addEventListener("input", syncPreviewMetadata);

    btnCompile.addEventListener("click", () => {
      refreshReportPreview();
      logSessionAction("Reporting Engine", "Report Compiled", `Target: ${repCompany.value}`);
      alert("Security audit report compiled and refreshed. Check the preview sheet on the right.");
    });

    btnPrint.addEventListener("click", () => {
      // Warm warning if labs are incomplete
      let incompleteCount = 0;
      for (const key in AppState.completions) {
        if (!AppState.completions[key]) incompleteCount++;
      }

      if (incompleteCount > 0) {
        if (!confirm(`Warning: You have ${incompleteCount} incomplete labs. Incomplete vectors will display as PENDING in the final audit. Proceed to print?`)) {
          return;
        }
      }

      logSessionAction("Reporting Engine", "PDF Export Activated", "Window print dialogue invoked");
      window.print();
    });

    // Run initial sync
    syncPreviewMetadata();
    refreshReportPreview();

    // Make available globally
    window.ReportingModule = {
      refreshReportPreview
    };
  }

  function syncPreviewMetadata() {
    prevCompany.innerText = repCompany.value || "SecureCorp Systems";
    prevAnalyst.innerText = repAnalyst.value || "Analyst #419";
    prevNotes.innerText = repNotes.value || "No executive summary notes provided.";
    
    // Set date string
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    prevDate.innerText = formattedDate;
  }

  function refreshReportPreview() {
    // Sync checkboxes to reflect AppState completions
    chkScan.checked = AppState.completions.recon;
    chkSqli.checked = AppState.completions.webvuln;
    chkXss.checked = AppState.completions.webvuln && AppState.sessionLogs.some(l => l.action === "Stored XSS Injected");
    chkHash.checked = AppState.completions.password;

    // Build the dynamic vulnerability table body
    prevFindingsBody.innerHTML = "";

    // 1. RECON SCAN FINDINGS
    appendFindingRow(
      "Subnet Scan Discovery",
      AppState.completions.recon ? "MEDIUM" : "PENDING AUDIT",
      AppState.completions.recon ? "Nmap target scan mapped hosts on 192.168.4.0/24 subnet. Discovered ports 22 (SSH), 80 (HTTP), and 3306 (MySQL)." : "Lab incomplete. Targets and ports unscanned.",
      AppState.completions.recon ? "Discovered open ports logged and tracked in SecOps register." : "Run target network scans in Recon Lab.",
      AppState.completions.recon ? "txt-warning" : "txt-rose"
    );

    // 2. SQL INJECTION FINDINGS
    appendFindingRow(
      "SQL Injection login bypass",
      AppState.completions.webvuln ? "CRITICAL" : "PENDING AUDIT",
      AppState.completions.webvuln ? "Authentication bypassed by injecting payload <code>admin' OR '1'='1</code> into username fields, forcing queries to return true." : "Lab incomplete. Proxy auditing not performed.",
      AppState.mitigations.sqli ? "Prepared statements implemented, sanitizing input parameters." : "Apply prepared statements mitigation in SIEM tab.",
      AppState.completions.webvuln ? "txt-rose" : "txt-rose"
    );

    // 3. STORED XSS FINDINGS
    const hasXssComplete = AppState.sessionLogs.some(l => l.action === "Stored XSS Injected") || AppState.mitigations.xss;
    appendFindingRow(
      "Stored Cross-Site Scripting (XSS)",
      hasXssComplete ? "HIGH" : "PENDING AUDIT",
      hasXssComplete ? "Injected script <code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code> into feedback comments guestbook, executing script in host context." : "Lab incomplete. Feedback fields script injection auditing not performed.",
      AppState.mitigations.xss ? "HTML context entity encoding applied to message renders." : "Apply HTML sanitizer mitigation in SIEM tab.",
      hasXssComplete ? "txt-rose" : "txt-rose"
    );

    // 4. WEAK PASSWORD HASH STORAGE FINDINGS
    appendFindingRow(
      "Weak Password Hashing Algorithms",
      AppState.completions.password ? "HIGH" : "PENDING AUDIT",
      AppState.completions.password ? "Audited admin password hash (MD5). Cracker successfully decrypted MD5 digest in under 1 second via dictionary wordlists." : "Lab incomplete. Password hashing audits not performed.",
      AppState.mitigations.weakpw ? "Upgraded password hashing scheme to adaptive cost Bcrypt stretching." : "Apply Bcrypt upgrade mitigation in SIEM tab.",
      AppState.completions.password ? "txt-rose" : "txt-rose"
    );
  }

  function appendFindingRow(vector, severity, details, mitigation, textClass) {
    const row = document.createElement("tr");

    const vectorTd = document.createElement("td");
    vectorTd.innerHTML = `<strong>${vector}</strong>`;

    const riskTd = document.createElement("td");
    riskTd.innerHTML = `<span class="${textClass}">${severity}</span>`;

    const detailsTd = document.createElement("td");
    detailsTd.innerHTML = details;

    const mitigationTd = document.createElement("td");
    mitigationTd.innerHTML = mitigation;

    row.appendChild(vectorTd);
    row.appendChild(riskTd);
    row.appendChild(detailsTd);
    row.appendChild(mitigationTd);

    prevFindingsBody.appendChild(row);
  }

  document.addEventListener("DOMContentLoaded", init);

})();
