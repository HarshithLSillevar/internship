// State variables
let activeTab = 'dashboard';
let learningTerms = [];
let tutorials = [];
let currentTutorialId = 'intro';
let siemLogs = [];
let packetList = [];
let selectedPacketId = null;

// Chart references
let severityChart = null;
let timelineChart = null;

// Quiz State
let quizIndex = 0;
const quizData = [
  {
    question: "Which TCP handshake flag sequence establishes a standard socket connection between a client and a host?",
    options: [
      "SYN → SYN-ACK → ACK",
      "ACK → SYN → FIN",
      "SYN → PSH → FIN-ACK",
      "RST → SYN → ACK"
    ],
    answer: 0,
    explanation: "Correct! The three-way handshake requires SYN from client, SYN-ACK from server, and ACK from client to complete."
  },
  {
    question: "If an Nmap vulnerability scan (-sV --script) identifies open port 445 on a Windows server as 'VULNERABLE (EternalBlue)', what CVE is associated with it?",
    options: [
      "CVE-2011-2523",
      "CVE-2017-0144",
      "CVE-2018-15473",
      "CVE-2017-9798"
    ],
    answer: 1,
    explanation: "Correct! EternalBlue (MS17-010) corresponds to CVE-2017-0144, allowing remote execution over SMBv1."
  },
  {
    question: "What is the primary indicator of a DNS Tunneling attack when analyzing captured network frames?",
    options: [
      "Unusual flags on transport layer TCP packets",
      "A massive influx of SYN requests without follow-up replies",
      "Frequent queries containing base64 encoded strings in subdomain prefixes",
      "A mismatch in MAC addresses on the local link layer"
    ],
    answer: 2,
    explanation: "Correct! Attackers use base64 encoded strings in DNS subdomains to tunnel information out of secure environments."
  }
];

// Switch Tabs/Views
function switchTab(tabId) {
  document.getElementById(`tab-${activeTab}`).classList.add('hidden');
  document.getElementById(`nav-${activeTab}`).classList.remove('sidebar-active');

  activeTab = tabId;

  document.getElementById(`tab-${activeTab}`).classList.remove('hidden');
  document.getElementById(`nav-${activeTab}`).classList.add('sidebar-active');

  // Update Page Title in header
  const titleMap = {
    'dashboard': 'SIEM Security Operations Center',
    'scan': 'Simulated Network Scanning Lab',
    'packets': 'Interactive Packet Stream Analyzer',
    'chat': 'AI Security Lab Assistant',
    'learning': 'Cybersecurity Learning Center'
  };
  document.getElementById('page-title').innerText = titleMap[tabId];

  // Refresh tab-specific configurations
  if (tabId === 'dashboard') {
    initCharts();
    loadSiemLogs();
  }
}

// Toggle Accordions inside Packet Inspector
function toggleAccordion(id) {
  const panel = document.getElementById(id);
  if (panel.classList.contains('hidden')) {
    panel.classList.remove('hidden');
  } else {
    panel.classList.add('hidden');
  }
}

// --- NETWORK SCANNER LAB LOGIC ---

function startSimulatedScan() {
  const target = document.getElementById('scan-target').value.trim();
  const scanType = document.querySelector('input[name="scan-type"]:checked').value;
  const terminal = document.getElementById('scan-terminal-output');
  const portsBody = document.getElementById('scan-ports-table-body');

  if (!target) {
    terminal.innerHTML = '<span class="text-cyberRed">[ERROR] Target cannot be empty.</span>';
    return;
  }

  terminal.innerHTML = `[INFO] Initializing scan sequence on: ${target}...\n[INFO] Mode Selected: ${scanType.toUpperCase()}\n`;
  portsBody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-500">Scanning in progress... Please wait.</td></tr>`;

  // Start animated terminal typing simulation
  let dots = 0;
  const interval = setInterval(() => {
    dots++;
    terminal.innerHTML += '.';
    if (dots > 15) {
      clearInterval(interval);
      fetchScanResults(target, scanType);
    }
  }, 100);
}

function fetchScanResults(target, scanType) {
  const terminal = document.getElementById('scan-terminal-output');
  const portsBody = document.getElementById('scan-ports-table-body');

  fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, scan_type: scanType })
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => { throw new Error(err.detail || 'Scan failed') });
    }
    return res.json();
  })
  .then(data => {
    // Print Nmap console output inside terminal container
    terminal.innerHTML = `<span class="text-white">${data.nmap_output}</span>`;
    
    // Update threat stats in header
    const threatIndicator = document.getElementById('threat-indicator');
    const alertCounter = document.getElementById('active-alert-counter');

    threatIndicator.innerText = `${data.threat_level} RISK TARGET`;
    if (data.threat_level === 'High') {
      threatIndicator.className = 'text-xs font-bold text-cyberRed alert-pulse';
      alertCounter.innerText = '3 Incidents Detected';
    } else if (data.threat_level === 'Medium') {
      threatIndicator.className = 'text-xs font-bold text-cyberOrange';
      alertCounter.innerText = '1 Incident Detected';
    } else {
      threatIndicator.className = 'text-xs font-bold text-cyberGreen';
      alertCounter.innerText = '0 Incidents';
    }

    // Populateports lists
    portsBody.innerHTML = '';
    data.ports.forEach(item => {
      let badgeClass = 'bg-cyberGreen/10 text-cyberGreen border border-cyberGreen/30';
      if (item.risk === 'Medium') badgeClass = 'bg-cyberOrange/10 text-cyberOrange border border-cyberOrange/30';
      if (item.risk === 'High' || item.risk === 'Critical') badgeClass = 'bg-cyberRed/10 text-cyberRed border border-cyberRed/30';

      portsBody.innerHTML += `
        <tr class="border-b border-cyberBlue/10 hover:bg-cyberBlue/5 transition">
          <td class="py-3 px-3 font-mono text-white font-semibold">${item.port}</td>
          <td class="py-3 px-3 font-semibold">${item.service}</td>
          <td class="py-3 px-3"><span class="text-cyberGreen font-semibold">${item.state}</span></td>
          <td class="py-3 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}">${item.risk}</span></td>
          <td class="py-3 px-3 font-mono text-slate-400">${item.cve}</td>
          <td class="py-3 px-3 text-slate-300 leading-normal max-w-xs">${item.desc}</td>
        </tr>
      `;
    });
  })
  .catch(err => {
    terminal.innerHTML = `<span class="text-cyberRed">[CRITICAL ERROR] ${err.message}</span>`;
    portsBody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-cyberRed">Failed to retrieve ports database.</td></tr>`;
  });
}


// --- PACKET ANALYZER LAB LOGIC ---

function loadPacketScenario() {
  const scenario = document.getElementById('packet-scenario-select').value;
  const listContainer = document.getElementById('packet-list');

  // Reset decoders
  document.getElementById('packet-detail-instructions').classList.remove('hidden');
  document.getElementById('packet-headers-container').classList.add('hidden');
  document.getElementById('packet-interpretation').innerText = 'No packet selected. Use the left panel stream flow logs to highlight a frame.';

  fetch(`/api/packets?scenario=${scenario}`)
    .then(res => res.json())
    .then(data => {
      packetList = data;
      listContainer.innerHTML = '';

      data.forEach(pkt => {
        let borderClass = 'border-cyberBlue/20 hover:border-cyberCyan/50';
        let statusBadge = '';

        if (pkt.suspicious) {
          borderClass = 'border-cyberRed/30 bg-cyberRed/5 hover:border-cyberRed/60';
          statusBadge = '<span class="px-1.5 py-0.5 rounded bg-cyberRed/20 text-cyberRed text-[9px] font-bold border border-cyberRed/40">SUSPICIOUS</span>';
        }

        listContainer.innerHTML += `
          <div onclick="selectPacket(${pkt.id})" id="pkt-card-${pkt.id}" class="p-3 bg-cyberCard rounded-xl border ${borderClass} cursor-pointer transition flex flex-col gap-2">
            <div class="flex items-center justify-between text-[10px] text-slate-400">
              <span class="font-mono">No: ${pkt.id} | Time: ${pkt.time}</span>
              ${statusBadge}
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-cyberGreen">${pkt.source}</span>
              <span class="text-slate-500">→</span>
              <span class="font-semibold text-cyberRed">${pkt.destination}</span>
            </div>
            <div class="flex justify-between items-center mt-1">
              <span class="px-2 py-0.5 bg-cyberBlue/10 border border-cyberBlue/35 text-[9px] text-cyberCyan font-bold rounded">${pkt.protocol}</span>
              <span class="text-[10px] font-mono text-slate-500">Length: ${pkt.length}B</span>
            </div>
            <div class="text-[10px] font-mono text-slate-300 truncate bg-cyberDark/50 p-1.5 rounded">${pkt.info}</div>
          </div>
        `;
      });
    });
}

function selectPacket(pktId) {
  // Clear past active styles
  if (selectedPacketId !== null) {
    const prev = document.getElementById(`pkt-card-${selectedPacketId}`);
    if (prev) prev.classList.remove('ring-1', 'ring-cyberCyan');
  }

  selectedPacketId = pktId;
  const card = document.getElementById(`pkt-card-${pktId}`);
  if (card) card.classList.add('ring-1', 'ring-cyberCyan');

  const pkt = packetList.find(x => x.id === pktId);
  if (!pkt) return;

  // Show container, hide placeholder instruction
  document.getElementById('packet-detail-instructions').classList.add('hidden');
  document.getElementById('packet-headers-container').classList.remove('hidden');

  // Fill Header Elements
  // Ethernet
  document.getElementById('eth-dst').innerText = pkt.details.ethernet.dst;
  document.getElementById('eth-src').innerText = pkt.details.ethernet.src;
  document.getElementById('eth-type').innerText = pkt.details.ethernet.type;

  // IP
  document.getElementById('ip-ver').innerText = pkt.details.ip.version;
  document.getElementById('ip-hdrlen').innerText = pkt.details.ip.hdr_len;
  document.getElementById('ip-tos').innerText = pkt.details.ip.tos;
  document.getElementById('ip-ttl').innerText = pkt.details.ip.ttl;
  document.getElementById('ip-proto').innerText = pkt.details.ip.proto;
  document.getElementById('ip-src').innerText = pkt.details.ip.src;
  document.getElementById('ip-dst').innerText = pkt.details.ip.dst;

  // Transport Layer (TCP or UDP)
  const isTCP = pkt.protocol !== 'UDP' && pkt.protocol !== 'DNS';
  document.getElementById('transport-title').innerText = isTCP 
    ? 'Transport Protocol Layer: Transmission Control Protocol (TCP)' 
    : 'Transport Protocol Layer: User Datagram Protocol (UDP)';

  if (isTCP) {
    document.getElementById('port-src').innerText = pkt.details.tcp.src_port;
    document.getElementById('port-dst').innerText = pkt.details.tcp.dst_port;
    document.getElementById('tcp-flags-container').classList.remove('hidden');
    
    // Flag highlighting
    const syn = pkt.details.tcp.flags_detail.SYN;
    const ack = pkt.details.tcp.flags_detail.ACK;
    const psh = pkt.details.tcp.flags_detail.PSH;

    const synEl = document.getElementById('flag-syn');
    const ackEl = document.getElementById('flag-ack');
    const pshEl = document.getElementById('flag-psh');

    synEl.className = syn ? 'py-1 px-2 border rounded border-cyberCyan bg-cyberCyan/10 text-cyberCyan font-bold' : 'py-1 px-2 border rounded border-slate-700 text-slate-500';
    ackEl.className = ack ? 'py-1 px-2 border rounded border-cyberGreen bg-cyberGreen/10 text-cyberGreen font-bold' : 'py-1 px-2 border rounded border-slate-700 text-slate-500';
    pshEl.className = psh ? 'py-1 px-2 border rounded border-cyberOrange bg-cyberOrange/10 text-cyberOrange font-bold' : 'py-1 px-2 border rounded border-slate-700 text-slate-500';
  } else {
    document.getElementById('port-src').innerText = pkt.details.udp.src_port;
    document.getElementById('port-dst').innerText = pkt.details.udp.dst_port;
    document.getElementById('tcp-flags-container').classList.add('hidden');
  }

  // Application / Payload Data
  const payloadBox = document.getElementById('payload-raw');
  if (pkt.details.data) {
    payloadBox.value = pkt.details.data;
  } else {
    payloadBox.value = "[NO APPLICATION DATA / EMPTY PACKET BODY]";
  }

  // Expert AI interpretation
  const explanationBox = document.getElementById('packet-interpretation');
  explanationBox.innerHTML = `
    <div class="flex items-center gap-2 mb-1">
      <span class="w-1.5 h-1.5 rounded-full ${pkt.suspicious ? 'bg-cyberRed' : 'bg-cyberBlue'}"></span>
      <span class="font-bold text-white">${pkt.suspicious ? 'Threat Highlight' : 'Normal Operations Analysis'}</span>
    </div>
    <p class="text-slate-300 leading-normal">${pkt.explanation}</p>
  `;
}


// --- SIEM EVENTS LOGIC ---

function loadSiemLogs() {
  const filter = document.getElementById('siem-severity-filter').value;
  const search = document.getElementById('siem-search').value.trim();
  const tbody = document.getElementById('siem-log-table-body');

  let url = '/api/siem/events?';
  if (filter) url += `severity=${filter}&`;
  if (search) url += `search=${encodeURIComponent(search)}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      tbody.innerHTML = '';
      
      let criticalCount = 0;
      let warningCount = 0;

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-slate-500">No events found matching current filter query.</td></tr>';
        return;
      }

      data.forEach(item => {
        let badgeColor = 'bg-cyberGreen/10 text-cyberGreen border border-cyberGreen/30';
        if (item.severity === 'Warning') {
          badgeColor = 'bg-cyberOrange/10 text-cyberOrange border border-cyberOrange/30';
          warningCount++;
        }
        if (item.severity === 'Critical') {
          badgeColor = 'bg-cyberRed/10 text-cyberRed border border-cyberRed/30';
          criticalCount++;
        }

        tbody.innerHTML += `
          <tr class="border-b border-cyberBlue/10 hover:bg-cyberBlue/5 transition">
            <td class="py-3 px-4 font-mono text-slate-400">${item.timestamp}</td>
            <td class="py-3 px-4 font-semibold text-cyberGreen">${item.source}</td>
            <td class="py-3 px-4 font-semibold text-cyberRed">${item.destination}</td>
            <td class="py-3 px-4 text-white font-semibold">${item.event}</td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${badgeColor}">${item.severity}</span>
            </td>
            <td class="py-3 px-4 text-slate-400 font-mono text-[10px] leading-relaxed max-w-xs truncate" title="${item.details}">${item.details}</td>
          </tr>
        `;
      });
    });
}


// --- AI LAB ASSISTANT CHAT LOGIC ---

function sendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const msgText = input.value.trim();
  if (!msgText) return;

  const chatContainer = document.getElementById('chat-messages');

  // Append user message
  chatContainer.innerHTML += `
    <div class="flex gap-3 max-w-[80%] ml-auto justify-end">
      <div class="p-4 bg-cyberBlue/15 border border-cyberBlue/30 rounded-2xl rounded-tr-none text-xs text-white leading-relaxed">
        ${msgText}
      </div>
      <div class="w-8 h-8 rounded-full bg-cyberCyan/20 border border-cyberCyan/40 text-cyberCyan flex items-center justify-center shrink-0">
        <i data-lucide="user" class="w-4 h-4"></i>
      </div>
    </div>
  `;
  
  // Clear input field and scroll to bottom
  input.value = '';
  chatContainer.scrollTop = chatContainer.scrollHeight;
  lucide.createIcons();

  // Show loading indicator
  const loadId = 'chat-loading-' + Date.now();
  chatContainer.innerHTML += `
    <div class="flex gap-3 max-w-[80%]" id="${loadId}">
      <div class="w-8 h-8 rounded-full bg-cyberBlue/20 border border-cyberBlue/40 text-cyberBlue flex items-center justify-center shrink-0">
        <i data-lucide="bot" class="w-4 h-4"></i>
      </div>
      <div class="p-4 bg-cyberCard border border-cyberBlue/20 rounded-2xl rounded-tl-none text-xs text-slate-400">
        Analyzing inquiry...
      </div>
    </div>
  `;
  chatContainer.scrollTop = chatContainer.scrollHeight;
  lucide.createIcons();

  // Call Chat API
  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history: [], message: msgText })
  })
  .then(res => res.json())
  .then(data => {
    // Replace typing indicator with real message
    const loader = document.getElementById(loadId);
    if (loader) loader.remove();

    chatContainer.innerHTML += `
      <div class="flex gap-3 max-w-[80%]">
        <div class="w-8 h-8 rounded-full bg-cyberBlue/20 border border-cyberBlue/40 text-cyberBlue flex items-center justify-center shrink-0">
          <i data-lucide="bot" class="w-4 h-4"></i>
        </div>
        <div class="p-4 bg-cyberCard border border-cyberBlue/20 rounded-2xl rounded-tl-none text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
          ${data.reply}
        </div>
      </div>
    `;
    chatContainer.scrollTop = chatContainer.scrollHeight;
    lucide.createIcons();
  })
  .catch(() => {
    const loader = document.getElementById(loadId);
    if (loader) loader.remove();
    chatContainer.innerHTML += `
      <div class="flex gap-3 max-w-[80%]">
        <div class="w-8 h-8 rounded-full bg-cyberRed/20 border border-cyberRed/40 text-cyberRed flex items-center justify-center shrink-0">
          <i data-lucide="alert-triangle" class="w-4 h-4"></i>
        </div>
        <div class="p-4 bg-cyberCard border border-cyberRed/20 rounded-2xl rounded-tl-none text-xs text-cyberRed">
          Could not communicate with AI engine. Ensure your FastAPI server is online.
        </div>
      </div>
    `;
    chatContainer.scrollTop = chatContainer.scrollHeight;
    lucide.createIcons();
  });
}


// --- LEARNING CENTER & TUTS LOGIC ---

function selectTutorial(tutId) {
  // Clear active styles on buttons
  ['intro', 'nmap', 'wireshark'].forEach(id => {
    const btn = document.getElementById(`btn-tut-${id}`);
    if (btn) {
      btn.className = 'px-4 py-2 border border-cyberBlue/20 bg-cyberCard text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition';
    }
  });

  const selectedBtn = document.getElementById(`btn-tut-${tutId}`);
  if (selectedBtn) {
    selectedBtn.className = 'px-4 py-2 border border-cyberBlue/20 bg-cyberBlue/10 text-xs font-semibold rounded-lg text-white';
  }

  const tut = tutorials.find(x => x.id === tutId);
  if (!tut) return;

  const contentBox = document.getElementById('tutorial-content');
  let stepsHtml = '';
  tut.steps.forEach((step, idx) => {
    stepsHtml += `
      <div class="flex gap-3 items-start">
        <div class="w-5 h-5 rounded bg-cyberCyan/10 border border-cyberCyan/40 text-cyberCyan font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">${idx+1}</div>
        <p class="text-xs text-slate-300 leading-relaxed">${step}</p>
      </div>
    `;
  });

  contentBox.innerHTML = `
    <div>
      <h4 class="text-sm font-bold text-white mb-1">${tut.title}</h4>
      <p class="text-xs text-slate-400 mb-4">${tut.description}</p>
    </div>
    <div class="space-y-3 pt-2">
      ${stepsHtml}
    </div>
  `;
}

function initLearningCenter() {
  fetch('/api/learning')
    .then(res => res.json())
    .then(data => {
      learningTerms = data.terms;
      tutorials = data.tutorials;

      // Populate dictionary list
      const container = document.getElementById('learning-terms-container');
      container.innerHTML = '';
      data.terms.forEach(item => {
        container.innerHTML += `
          <div class="p-4 bg-cyberCard/50 border border-cyberBlue/10 rounded-xl hover:border-cyberCyan/30 transition">
            <h4 class="text-xs font-extrabold text-cyberCyan tracking-wider uppercase mb-1.5">${item.term}</h4>
            <p class="text-[10px] leading-relaxed text-slate-400">${item.definition}</p>
          </div>
        `;
      });

      // Load first tutorial
      selectTutorial('intro');
    });
}


// --- KNOWLEDGE ASSESSMENT QUIZ ---

function loadQuizQuestion() {
  const current = quizData[quizIndex];
  document.getElementById('quiz-question-num').innerText = `Question ${quizIndex + 1} of ${quizData.length}`;
  document.getElementById('quiz-question-text').innerText = current.question;
  document.getElementById('quiz-feedback').innerText = '';

  const optsContainer = document.getElementById('quiz-options');
  optsContainer.innerHTML = '';
  
  current.options.forEach((opt, idx) => {
    optsContainer.innerHTML += `
      <button onclick="submitQuizAnswer(${idx})" class="w-full text-left p-3 bg-cyberCard border border-cyberBlue/15 rounded-xl hover:bg-cyberBlue/10 transition text-xs text-slate-300 font-medium">
        ${opt}
      </button>
    `;
  });
}

function submitQuizAnswer(optIdx) {
  const current = quizData[quizIndex];
  const feedback = document.getElementById('quiz-feedback');
  
  if (optIdx === current.answer) {
    feedback.innerText = 'Correct Answer!';
    feedback.className = 'text-xs font-bold text-cyberGreen';
  } else {
    feedback.innerText = 'Incorrect. Try again!';
    feedback.className = 'text-xs font-bold text-cyberRed';
  }
}

function nextQuizQuestion() {
  quizIndex = (quizIndex + 1) % quizData.length;
  loadQuizQuestion();
}


// --- SIEM CHARTS (CHART.JS) LOGIC ---

function initCharts() {
  // Severity Distribution Chart
  const ctxSev = document.getElementById('siemSeverityChart');
  if (severityChart) severityChart.destroy();
  
  severityChart = new Chart(ctxSev, {
    type: 'doughnut',
    data: {
      labels: ['Critical Alerts', 'Warning Events', 'Info Messages'],
      datasets: [{
        data: [3, 2, 2],
        backgroundColor: ['#ff3366', '#ff9900', '#4facfe'],
        borderColor: '#0a0e17',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#8b9bb4', font: { family: 'Outfit', size: 10 } }
        }
      }
    }
  });

  // Incident Timeline Chart
  const ctxTimeline = document.getElementById('siemTimelineChart');
  if (timelineChart) timelineChart.destroy();

  timelineChart = new Chart(ctxTimeline, {
    type: 'line',
    data: {
      labels: ['21:35', '21:36', '21:37', '21:38', '21:39', '21:40'],
      datasets: [
        {
          label: 'Total Logs Intake',
          data: [1, 2, 0, 1, 1, 2],
          borderColor: '#00f2fe',
          backgroundColor: 'rgba(0, 242, 254, 0.05)',
          fill: true,
          tension: 0.4,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(79, 172, 254, 0.05)' }, ticks: { color: '#8b9bb4', font: { size: 9 } } },
        y: { grid: { color: 'rgba(79, 172, 254, 0.05)' }, ticks: { color: '#8b9bb4', font: { size: 9 }, stepSize: 1 } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}


// --- INITIAL STARTUP HANDLER ---

window.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icon tags
  lucide.createIcons();

  // Load SIEM components
  loadSiemLogs();
  initCharts();

  // Load Packet Analyzer stream scenario
  loadPacketScenario();

  // Load Learning Modules
  initLearningCenter();

  // Load interactive assessment quiz
  loadQuizQuestion();
});
