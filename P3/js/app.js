// CYBERSIM PRO - MAIN APPLICATION ORCHESTRATOR & STATE MANAGER

const AppState = {
  // Navigation & Tabs
  activeTab: "dashboard",
  
  // Lab Task Completion Flags
  completions: {
    recon: false,
    webvuln: false,
    password: false,
    siem: false
  },
  
  // Incident Response Mitigations Active
  mitigations: {
    bruteforce: false, // IP Block applied
    sqli: false,       // Query binding patched
    xss: false,        // Output sanitization applied
    weakpw: false      // Upgrade storage hash to Bcrypt
  },
  
  // Logs of actions completed during session (for audit report compilation)
  sessionLogs: [],
  
  // Computed Security Posture Rate (40% default base, +15% per mitigation applied)
  securityScore: 40
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initAppNavigation();
  initMatrixRain();
  initDashboardChart();
  updateGlobalScore();
  
  // Reset session trigger
  document.getElementById("btn-reset-session").addEventListener("click", () => {
    if(confirm("Are you sure you want to reset all SecOps progress and clear session logs?")) {
      resetSessionProgress();
    }
  });

  // Start with AI welcome message after brief delay
  setTimeout(() => {
    if (window.AiAdvisor) {
      window.AiAdvisor.welcomeMessage();
    }
  }, 1000);
});

// Tab Management
function initAppNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const panels = document.querySelectorAll(".tab-panel");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetTab = item.getAttribute("data-tab");
      
      // Update sidebar styling
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      
      // Switch active pane
      panels.forEach(p => p.classList.remove("active"));
      document.getElementById(`tab-${targetTab}`).classList.add("active");
      
      AppState.activeTab = targetTab;
      
      // Module-specific hooks
      handleTabSwitchHooks(targetTab);
    });
  });

  // "Start Scanning" button on dashboard
  document.getElementById("btn-go-to-lab").addEventListener("click", () => {
    document.getElementById("nav-recon").click();
  });
}

function handleTabSwitchHooks(tabName) {
  // Update AI Assistant guidance message for this specific lab
  if (window.AiAdvisor) {
    window.AiAdvisor.updateLabContext(tabName);
  }
  
  // Resize canvases or maps if needed
  if (tabName === "reports" && window.ReportingModule) {
    window.ReportingModule.refreshReportPreview();
  }
  if (tabName === "password" && window.PasswordLabModule) {
    window.PasswordLabModule.syncHashOutput();
  }
}

// Compute & Update Dashboard Stats
function updateGlobalScore() {
  // Recalculate score: Base 40% + 15% for each mitigation active
  let mitigationCount = 0;
  for (const key in AppState.mitigations) {
    if (AppState.mitigations[key]) mitigationCount++;
  }
  
  AppState.securityScore = 40 + (mitigationCount * 15);
  
  // Recalculate lab completions
  let labsDone = 0;
  for (const key in AppState.completions) {
    if (AppState.completions[key]) labsDone++;
  }
  const labsPercent = Math.round((labsDone / 4) * 100);

  // Update HUD Header Metrics
  document.getElementById("header-score-text").innerText = `${AppState.securityScore}%`;
  document.getElementById("header-mitigations-count").innerText = `${mitigationCount} / 4`;
  document.getElementById("header-labs-count").innerText = `${labsPercent}%`;

  // Draw HUD circle stroke offset: circumference is 2 * pi * r = 2 * 3.14159 * 18 = 113.
  const scoreRing = document.getElementById("header-score-ring");
  const offset = 113 - (113 * AppState.securityScore) / 100;
  scoreRing.style.strokeDashoffset = offset;
  
  // Change ring color based on threat severity
  if (AppState.securityScore <= 50) {
    scoreRing.style.stroke = "var(--rose)";
  } else if (AppState.securityScore <= 80) {
    scoreRing.style.stroke = "var(--warning)";
  } else {
    scoreRing.style.stroke = "var(--green)";
  }

  // Update Dashboard Widgets
  const dashMitigationText = document.getElementById("dash-mitigation-status");
  if (mitigationCount === 0) {
    dashMitigationText.innerText = "Low";
    dashMitigationText.className = "stat-number txt-rose";
  } else if (mitigationCount < 3) {
    dashMitigationText.innerText = "Moderate";
    dashMitigationText.className = "stat-number txt-warning";
  } else {
    dashMitigationText.innerText = "High Secured";
    dashMitigationText.className = "stat-number txt-green";
  }

  document.getElementById("dash-vectors-count").innerText = `${4 - mitigationCount} / 4`;
  document.getElementById("dash-progress-text").innerText = `${labsPercent}%`;

  // Update Checklist styling
  updateMilestoneChecklist();

  // If a lab is marked complete, change button text on Dashboard
  const startBtn = document.getElementById("btn-go-to-lab");
  if (labsDone === 0) {
    startBtn.innerHTML = `<span>Start Scanning (Lab 1)</span><i data-lucide="arrow-right"></i>`;
  } else if (labsDone < 4) {
    // Find first incomplete lab
    let nextLabName = "Recon Lab";
    let nextLabId = "nav-recon";
    if (!AppState.completions.recon) {
      nextLabName = "Recon (Lab 1)";
      nextLabId = "nav-recon";
    } else if (!AppState.completions.webvuln) {
      nextLabName = "Web Security (Lab 2)";
      nextLabId = "nav-webvuln";
    } else if (!AppState.completions.password) {
      nextLabName = "Password Attack (Lab 3)";
      nextLabId = "nav-password";
    } else if (!AppState.completions.siem) {
      nextLabName = "SIEM Log Monitor (Lab 4)";
      nextLabId = "nav-siem";
    }
    startBtn.innerHTML = `<span>Continue: ${nextLabName}</span><i data-lucide="arrow-right"></i>`;
    startBtn.onclick = () => { document.getElementById(nextLabId).click(); };
  } else {
    startBtn.innerHTML = `<span>Generate Security Portfolio</span><i data-lucide="file-check"></i>`;
    startBtn.onclick = () => { document.getElementById("nav-reports").click(); };
  }
  lucide.createIcons();
}

function updateMilestoneChecklist() {
  const setMilestone = (id, isComplete) => {
    const item = document.getElementById(id);
    const check = item.querySelector(".task-check");
    if (isComplete) {
      item.classList.add("completed");
      check.innerHTML = `<i data-lucide="check-circle-2" class="txt-green"></i>`;
    } else {
      item.classList.remove("completed");
      check.innerHTML = `<i data-lucide="circle" class="txt-muted"></i>`;
    }
  };

  setMilestone("task-recon", AppState.completions.recon);
  setMilestone("task-webvuln", AppState.completions.webvuln);
  setMilestone("task-password", AppState.completions.password);
  setMilestone("task-siem", AppState.completions.siem);
  lucide.createIcons();
}

// Global logger to feed Reporting tab
function logSessionAction(module, action, result) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = { timestamp, module, action, result };
  AppState.sessionLogs.push(logEntry);
  
  // Also push to SIEM log generator so actions can be seen in Splunk stream
  if (window.SiemModule) {
    window.SiemModule.insertSystemEvent(`INFO: Analyst SecOps action - [${module}] ${action} (${result})`);
  }
}

// Reset Session
function resetSessionProgress() {
  AppState.completions = { recon: false, webvuln: false, password: false, siem: false };
  AppState.mitigations = { bruteforce: false, sqli: false, xss: false, weakpw: false };
  AppState.sessionLogs = [];
  
  updateGlobalScore();
  
  // Reset other component models
  if (window.ReconModule) window.ReconModule.reset();
  if (window.WebVulnModule) window.WebVulnModule.reset();
  if (window.PasswordLabModule) window.PasswordLabModule.reset();
  if (window.SiemModule) window.SiemModule.reset();
  if (window.TerminalModule) window.TerminalModule.clear();
  
  logSessionAction("Global", "Session Reset", "All security postures reverted");
  
  // Click dashboard tab
  document.getElementById("nav-dashboard").click();
}

// Matrix Falling Characters Effect
function initMatrixRain() {
  const canvas = document.getElementById("matrix-canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const charList = "01010101ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&^";
  const alphabet = charList.split("");

  const fontSize = 14;
  const columns = canvas.width / fontSize;

  const rainDrops = [];
  for (let x = 0; x < columns; x++) {
    rainDrops[x] = 1;
  }

  const drawRain = () => {
    ctx.fillStyle = "rgba(6, 9, 19, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00f0ff"; // Matrix Cyan
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < rainDrops.length; i++) {
      const text = alphabet[Math.floor(Math.random() * alphabet.length)];
      ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

      if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        rainDrops[i] = 0;
      }
      rainDrops[i]++;
    }
  };

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  setInterval(drawRain, 35);
}

// Dashboard Chart Telemetry
function initDashboardChart() {
  const chartPath = document.getElementById("chart-path");
  const chartArea = document.getElementById("chart-area");
  const statusText = document.getElementById("dash-telemetry-status");
  let points = [160, 140, 170, 130, 150, 100];
  
  // Continuously animate the SVG path points slightly to simulate real-time metrics
  setInterval(() => {
    // Generate new coordinates slightly varied
    points = points.map((p, idx) => {
      const variance = Math.floor(Math.random() * 20) - 10;
      let newP = p + variance;
      // Clamp values
      if (newP < 30) newP = 30;
      if (newP > 185) newP = 185;
      return newP;
    });
    
    // Draw Bezier curves through coordinates
    const dPath = `M 0 ${points[0]} Q 75 ${points[1]} 150 ${points[2]} T 300 ${points[3]} T 450 ${points[4]} T 500 ${points[5]}`;
    const dArea = `${dPath} L 500 200 L 0 200 Z`;
    
    chartPath.setAttribute("d", dPath);
    chartArea.setAttribute("d", dArea);
    
    // Change scan status wording dynamically
    const words = ["SECURITY SYSTEM ONLINE", "NETWORK ROUTING STEADY", "TELEMETRY SYNCHRONIZED", "INTRUSION PROBABILITY LOW", "MONITORING NODES..."];
    statusText.innerText = words[Math.floor(Math.random() * words.length)];
  }, 1800);
}
