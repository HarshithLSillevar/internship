// CYBERSIM PRO - RECONNAISSANCE & NMAP PORT SCANNER ENGINE

const ReconModule = (() => {
  let ipInput, scanTypeSelect, runScanBtn, terminalBody, scanOverlay;
  let networkMapSvg, nodeDb, nodeTarget, auditEmpty, auditDetails;
  let auditIp, auditOS, auditRisk, auditVulns, auditPortsBody;
  
  let isScanned = false;
  let activeNodeId = null;

  function init() {
    ipInput = document.getElementById("recon-ip-input");
    scanTypeSelect = document.getElementById("recon-scan-type");
    runScanBtn = document.getElementById("btn-run-scan");
    terminalBody = document.getElementById("recon-terminal-log");
    scanOverlay = document.getElementById("recon-scan-overlay");
    networkMapSvg = document.getElementById("network-map-svg");
    
    nodeDb = document.getElementById("node-db");
    nodeTarget = document.getElementById("node-target");
    
    auditEmpty = document.getElementById("recon-audit-empty");
    auditDetails = document.getElementById("recon-audit-details");
    auditIp = document.getElementById("recon-audit-ip");
    auditOS = document.getElementById("recon-audit-os");
    auditRisk = document.getElementById("recon-audit-risk");
    auditVulns = document.getElementById("recon-audit-vulns");
    auditPortsBody = document.getElementById("recon-audit-ports-body");

    // Scan trigger
    runScanBtn.addEventListener("click", executeScan);

    // Node selections
    document.getElementById("node-workstation").addEventListener("click", () => selectNode("workstation"));
    nodeDb.addEventListener("click", () => selectNode("dbServer"));
    nodeTarget.addEventListener("click", () => selectNode("target"));

    // Make ReconModule available globally
    window.ReconModule = {
      reset,
      isScanned: () => isScanned
    };
  }

  function executeScan() {
    const ip = ipInput.value.trim();
    const scanType = scanTypeSelect.value;

    if (!ip) {
      alert("Please enter a valid Target IP address.");
      return;
    }

    // Lock UI and show scanner pulse overlay
    scanOverlay.classList.add("active");
    runScanBtn.disabled = true;
    
    // Reset terminal panel
    terminalBody.innerHTML = "<span class='txt-cyan'>[SecOps] Initiating Nmap socket mapping...</span><br>";
    
    // Fetch logs from static DB
    const scanLines = CYBER_DATA.nmapScanOutputs[scanType] || CYBER_DATA.nmapScanOutputs["-sS"];
    let lineIdx = 0;

    // Stream lines mimicking live console
    const interval = setInterval(() => {
      if (lineIdx < scanLines.length) {
        const line = scanLines[lineIdx];
        let styleClass = "";
        
        if (line.includes("Discovered open port") || line.includes("Host is up") || line.includes("open ")) {
          styleClass = "success";
        } else if (line.includes("Starting Nmap") || line.includes("Completed SYN")) {
          styleClass = "info";
        }
        
        terminalBody.innerHTML += `<div class="terminal-line ${styleClass}"><span class="txt-muted">$</span> ${line}</div>`;
        terminalBody.scrollTop = terminalBody.scrollHeight;
        lineIdx++;
      } else {
        clearInterval(interval);
        
        // Scan completed processes
        scanOverlay.classList.remove("active");
        runScanBtn.disabled = false;
        isScanned = true;
        
        // Update completions
        AppState.completions.recon = true;
        logSessionAction("Recon Lab", "Nmap Scan Completed", `Scan type: ${scanType} on ${ip}`);
        updateGlobalScore();
        
        // Activate DB and Webapp nodes on the SVG graph
        activateNetworkNodes();
        
        // Auto-select target node details
        selectNode("target");
      }
    }, 450); // Fast line printing
  }

  function activateNetworkNodes() {
    // Light up nodes with CSS class triggers
    nodeDb.classList.add("active");
    nodeTarget.classList.add("active");
    
    document.getElementById("node-circle-db").setAttribute("stroke", "var(--warning)");
    document.getElementById("node-circle-target").setAttribute("stroke", "var(--rose)");
    
    // Draw connection pulse lines
    document.getElementById("net-line-1").setAttribute("stroke", "var(--cyan)");
    document.getElementById("net-line-2").setAttribute("stroke", "var(--cyan)");
    document.getElementById("net-line-3").setAttribute("stroke", "var(--cyan)");
  }

  function selectNode(nodeKey) {
    if (!isScanned && nodeKey !== "workstation") {
      alert("Target subnet is unscanned. Run an Nmap scan first to map the hosts.");
      return;
    }

    // Set active class visual style
    const nodes = ["workstation", "dbServer", "target"];
    nodes.forEach(n => {
      const el = document.getElementById(`node-${n}`);
      if (n === nodeKey) {
        el.classList.add("active-node");
      } else {
        el.classList.remove("active-node");
      }
    });

    activeNodeId = nodeKey;
    const nodeProfile = CYBER_DATA.nodes[nodeKey];
    
    if (!nodeProfile) return;

    // Load details to panel drawer
    auditEmpty.classList.add("hidden");
    auditDetails.classList.remove("hidden");

    auditIp.innerText = nodeProfile.ip;
    auditOS.innerText = nodeProfile.os;
    
    // Configure badge risk levels
    auditRisk.className = `badge ${nodeKey === 'workstation' ? 'badge-green' : nodeKey === 'dbServer' ? 'badge-warning' : 'badge-danger'}`;
    auditRisk.innerText = nodeProfile.risk;
    auditVulns.innerText = nodeProfile.vulns;

    // Render open ports table
    auditPortsBody.innerHTML = "";
    nodeProfile.ports.forEach(port => {
      const row = document.createElement("tr");
      
      const portTd = document.createElement("td");
      portTd.innerHTML = `<span class="txt-cyan font-bold">${port.port}</span>`;
      
      const serviceTd = document.createElement("td");
      serviceTd.innerText = port.service;
      
      const statusTd = document.createElement("td");
      statusTd.innerHTML = `<span class="badge ${port.status === 'open' ? 'badge-danger' : 'badge-sec'}">${port.status.toUpperCase()}</span>`;
      
      const suggTd = document.createElement("td");
      suggTd.className = "txt-muted";
      suggTd.innerHTML = port.sugg;
      
      row.appendChild(portTd);
      row.appendChild(serviceTd);
      row.appendChild(statusTd);
      row.appendChild(suggTd);
      
      auditPortsBody.appendChild(row);
    });
  }

  function reset() {
    isScanned = false;
    activeNodeId = null;
    ipInput.value = "192.168.4.15";
    scanTypeSelect.selectedIndex = 0;
    terminalBody.innerHTML = "<span class='terminal-prompt'>$</span> Enter target IP and click 'Execute Scan' above to scan the host...";
    
    // Reset SVG node colors and classes
    const nodes = ["workstation", "dbServer", "target"];
    nodes.forEach(n => {
      document.getElementById(`node-${n}`).classList.remove("active-node");
    });
    
    nodeDb.classList.remove("active");
    nodeTarget.classList.remove("active");
    document.getElementById("node-circle-db").setAttribute("stroke", "var(--border-color)");
    document.getElementById("node-circle-target").setAttribute("stroke", "var(--border-color)");

    document.getElementById("net-line-1").setAttribute("stroke", "var(--border-color)");
    document.getElementById("net-line-2").setAttribute("stroke", "var(--border-color)");
    document.getElementById("net-line-3").setAttribute("stroke", "var(--border-color)");

    // Show empty drawer details
    auditEmpty.classList.remove("hidden");
    auditDetails.classList.add("hidden");
  }

  document.addEventListener("DOMContentLoaded", init);

})();
