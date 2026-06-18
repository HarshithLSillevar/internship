// CYBER OPS SECURE LAB - APPLICATION STATE ENGINE

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initClock();
  initTerminal();
  initWireshark();
  initSOC();
  initPasswordAnalyzer();
  initGlossaryAndQuiz();
  initReportGenerator();
});

// ==========================================
// 1. NAVIGATION & GENERAL CONTROLS
// ==========================================
function initTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabViews = document.querySelectorAll('.tab-view');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      
      navItems.forEach(nav => nav.classList.remove('active'));
      tabViews.forEach(view => view.classList.remove('active'));
      
      item.classList.add('active');
      const targetView = document.getElementById(`tab-${targetTab}`);
      if (targetView) targetView.classList.add('active');
      
      // Auto scroll terminal input into focus if switching to terminal
      if (targetTab === 'recon') {
        const input = document.getElementById('terminal-input');
        if (input) setTimeout(() => input.focus(), 100);
      }
    });
  });
}

function initClock() {
  const clockEl = document.getElementById('live-clock');
  function updateTime() {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hrs}:${mins}:${secs}`;
  }
  updateTime();
  setInterval(updateTime, 1000);
}

// ==========================================
// 2. INTERACTIVE RECONNAISSANCE TERMINAL
// ==========================================
let termInput, termBody;
const terminalHistory = [];
let historyIndex = -1;

function initTerminal() {
  termInput = document.getElementById('terminal-input');
  termBody = document.getElementById('term-body');
  
  if (!termInput || !termBody) return;
  
  termInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const command = termInput.value.trim();
      if (command) {
        handleTerminalCommand(command);
        terminalHistory.push(command);
        historyIndex = terminalHistory.length;
      }
      termInput.value = '';
    } else if (e.key === 'ArrowUp') {
      if (historyIndex > 0) {
        historyIndex--;
        termInput.value = terminalHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex < terminalHistory.length - 1) {
        historyIndex++;
        termInput.value = terminalHistory[historyIndex];
      } else {
        historyIndex = terminalHistory.length;
        termInput.value = '';
      }
    }
  });

  // Focus input anywhere on body click
  termBody.addEventListener('click', () => {
    termInput.focus();
  });
}

function prefillTerminal(command) {
  const navItem = document.querySelector('[data-tab="recon"]');
  if (navItem) navItem.click();
  termInput.value = command;
  termInput.focus();
}

function appendTerminalLine(text, className = '') {
  const line = document.createElement('div');
  line.className = 'term-line ' + className;
  line.textContent = text;
  
  // Insert before the input line
  const inputLine = termBody.querySelector('.term-input-line');
  termBody.insertBefore(line, inputLine);
  
  // Scroll to bottom
  termBody.scrollTop = termBody.scrollHeight;
}

function showTerminalTyping(lines, index = 0) {
  if (index >= lines.length) {
    termInput.disabled = false;
    termInput.focus();
    return;
  }
  
  termInput.disabled = true;
  appendTerminalLine(lines[index].text, lines[index].class || '');
  
  setTimeout(() => {
    showTerminalTyping(lines, index + 1);
  }, lines[index].delay || 200);
}

function handleTerminalCommand(command) {
  // Echo command
  appendTerminalLine(`analyst@secops:~$ ${command}`, 'term-prompt');
  
  const tokens = command.split(/\s+/);
  const cmd = tokens[0].toLowerCase();
  
  if (cmd === 'help') {
    const lines = [
      { text: 'Available Simulation Terminal Commands:', class: 'term-line' },
      { text: '  nmap [options] <ip>   - Port and service scanner', class: 'term-line' },
      { text: '  nikto -h <host>       - Web server vulnerability scanner', class: 'term-line' },
      { text: '  clear                 - Clear screen buffer', class: 'term-line' },
      { text: '  ls                    - List home folder structures', class: 'term-line' },
      { text: '  cat [file]            - Read file configurations', class: 'term-line' },
      { text: '  help                  - Show this guidance documentation', class: 'term-line' }
    ];
    showTerminalTyping(lines);
  } else if (cmd === 'clear') {
    const lines = termBody.querySelectorAll('.term-line');
    lines.forEach(l => l.remove());
  } else if (cmd === 'ls') {
    appendTerminalLine('report_notes.txt  target_scans/  lab_instructions.pdf');
  } else if (cmd === 'cat') {
    if (tokens[1] === 'report_notes.txt') {
      appendTerminalLine('Recon notes: Host target 10.0.8.45 has HTTP running. Potential credentials are leaked in plaintext inside subnets. Investigate using Wireshark.');
    } else {
      appendTerminalLine('Usage: cat report_notes.txt');
    }
  } else if (cmd === 'nmap') {
    handleNmapCommand(tokens);
  } else if (cmd === 'nikto') {
    handleNiktoCommand(tokens);
  } else {
    appendTerminalLine(`bash: ${cmd}: command not found. Try "help" to view options.`, 'term-line');
  }
}

function handleNmapCommand(tokens) {
  const fullCommand = tokens.join(' ');
  
  // Nmap logic
  if (tokens.length < 2) {
    appendTerminalLine('Usage: nmap [flags] <IP_Address>', 'term-line');
    appendTerminalLine('Examples: nmap -sS -p 80,443 10.0.8.45 | nmap -sV -O 10.0.8.45', 'term-line');
    return;
  }
  
  // Check target IP
  const targetIp = tokens[tokens.length - 1];
  if (targetIp !== '10.0.8.45' && targetIp !== '127.0.0.1' && targetIp !== 'localhost') {
    appendTerminalLine(`[!] Target IP: "${targetIp}" is out of safe range. For safety, only target local host "10.0.8.45" during this laboratory.`, 'term-line');
    return;
  }
  
  appendTerminalLine('Starting Nmap 7.92 ( https://nmap.org ) at ' + new Date().toLocaleString());
  
  // Scenario 1: SYN stealth scan nmap -sS
  if (fullCommand.includes('-sS')) {
    const lines = [
      { text: 'Initiating ARP Ping Scan against 10.0.8.45...', delay: 400 },
      { text: 'Completed ARP Ping Scan (0.12s, 1 host up)', delay: 200 },
      { text: 'Initiating Parallel DNS resolution...', delay: 300 },
      { text: 'Initiating SYN Stealth Scan against 10.0.8.45...', delay: 600 },
      { text: 'Scanning 10.0.8.45 [1000 ports]...', delay: 800 },
      { text: 'Nmap scan report for 10.0.8.45', class: 'term-prompt', delay: 100 },
      { text: 'Host is up (0.045s latency).', delay: 100 },
      { text: 'Not shown: 996 closed tcp ports (reset)', delay: 100 },
      { text: 'PORT     STATE SERVICE', class: 'term-prompt', delay: 100 },
      { text: '22/tcp   open  ssh', delay: 100 },
      { text: '80/tcp   open  http', delay: 100 },
      { text: '443/tcp  open  https', delay: 100 },
      { text: '8080/tcp open  http-proxy', delay: 100 },
      { text: 'MAC Address: 00:0C:29:43:2F:12 (VMware)', delay: 100 },
      { text: 'Nmap done: 1 IP address (1 host up) scanned in 2.65 seconds', class: 'term-prompt', delay: 100 }
    ];
    showTerminalTyping(lines);
  }
  // Scenario 2: Service/OS scan nmap -sV -O
  else if (fullCommand.includes('-sV') || fullCommand.includes('-O')) {
    const lines = [
      { text: 'Initiating SYN Stealth Scan against 10.0.8.45...', delay: 400 },
      { text: 'Initiating Service scan against 10.0.8.45...', delay: 800 },
      { text: 'Initiating OS detection (try 1) against 10.0.8.45...', delay: 600 },
      { text: 'Nmap scan report for 10.0.8.45', class: 'term-prompt', delay: 100 },
      { text: 'PORT     STATE SERVICE   VERSION', class: 'term-prompt', delay: 100 },
      { text: '22/tcp   open  ssh       OpenSSH 8.2p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux)', delay: 100 },
      { text: '80/tcp   open  http      Apache httpd 2.4.41 ((Ubuntu))', delay: 100 },
      { text: '443/tcp  open  ssl/http  Apache httpd 2.4.41 ((Ubuntu))', delay: 100 },
      { text: '8080/tcp open  http      Apache Tomcat 9.0.31', delay: 100 },
      { text: 'Device type: general purpose', delay: 100 },
      { text: 'Running: Linux 4.X|5.X', delay: 100 },
      { text: 'OS details: Linux 4.15 - 5.6', delay: 100 },
      { text: 'Network Distance: 1 hop', delay: 100 },
      { text: 'OS and Service detection performed. Please note service versions for vulnerabilities.', class: 'term-prompt', delay: 100 }
    ];
    showTerminalTyping(lines);
  }
  // Scenario 3: Aggressive all ports nmap -A -p-
  else if (fullCommand.includes('-A') || fullCommand.includes('-p-')) {
    const lines = [
      { text: 'Warning: Comprehensive scans (all ports -p-) take significant time in real systems...', delay: 400 },
      { text: 'Scanning 65535 ports...', delay: 1000 },
      { text: 'Nmap scan report for 10.0.8.45', class: 'term-prompt', delay: 100 },
      { text: 'PORT     STATE SERVICE  VERSION', class: 'term-prompt', delay: 100 },
      { text: '22/tcp   open  ssh      OpenSSH 8.2p1', delay: 100 },
      { text: '80/tcp   open  http     Apache 2.4.41', delay: 100 },
      { text: '| http-methods: GET HEAD POST OPTIONS', delay: 50 },
      { text: '|_http-title: VulnApp Web System Login', delay: 50 },
      { text: '443/tcp  open  ssl/http Apache 2.4.41', delay: 100 },
      { text: '8080/tcp open  http     Apache Tomcat 9.0.31', delay: 100 },
      { text: 'No other ports responded to SYN probes.', delay: 100 }
    ];
    showTerminalTyping(lines);
  } 
  // Simple default scan
  else {
    const lines = [
      { text: 'Nmap scan report for 10.0.8.45', class: 'term-prompt', delay: 200 },
      { text: 'PORT    STATE SERVICE', class: 'term-prompt', delay: 100 },
      { text: '22/tcp  open  ssh', delay: 100 },
      { text: '80/tcp  open  http', delay: 100 },
      { text: '443/tcp open  https', delay: 100 },
      { text: 'Hint: Run with flags "-sV -O" to fetch software versions and OS footprints.', class: 'term-prompt', delay: 100 }
    ];
    showTerminalTyping(lines);
  }
}

function handleNiktoCommand(tokens) {
  const fullCommand = tokens.join(' ');
  
  if (!fullCommand.includes('-h')) {
    appendTerminalLine('Usage: nikto -h <host_url>', 'term-line');
    appendTerminalLine('Example: nikto -h http://10.0.8.45', 'term-line');
    return;
  }
  
  appendTerminalLine('- Nikto v2.1.6');
  appendTerminalLine('---------------------------------------------------------------------------');
  
  const lines = [
    { text: '+ Target IP:          10.0.8.45', delay: 200 },
    { text: '+ Target Hostname:    10.0.8.45', delay: 100 },
    { text: '+ Target Port:        80', delay: 100 },
    { text: '---------------------------------------------------------------------------', delay: 100 },
    { text: '+ OSVDB-3092: /login.php: HTTP password leakage found in cleartext logs.', class: 'term-prompt', delay: 500 },
    { text: '+ OSVDB-3268: /cgi-bin/: Apache status directory readable (CGI configuration audit recommended).', class: 'term-prompt', delay: 400 },
    { text: '+ OSVDB-3233: /admin/: Admin console panel accessible with blank parameters.', class: 'term-prompt', delay: 400 },
    { text: '+ Road map: /tomcat-manager: Tomcat manager script located on port 8080.', delay: 300 },
    { text: '+ 7544 items checked - 4 items found on target host.', class: 'term-prompt', delay: 100 },
    { text: '---------------------------------------------------------------------------', delay: 100 },
    { text: '+ Scan termination: Completed Nikto run on 10.0.8.45.', class: 'term-prompt', delay: 100 }
  ];
  showTerminalTyping(lines);
}

// ==========================================
// 3. WIRESHARK PACKET ANALYZER
// ==========================================
let activeStream = 'auth';
let selectedPacketIndex = -1;

const mockPacketData = {
  auth: [
    { no: 1, time: "0.000000", src: "192.168.1.102", dest: "10.0.8.45", proto: "TCP", len: 60, info: "49152 → 80 [SYN] Seq=0 Win=64240 Len=0 MSS=1460",
      headers: {
        frame: "Frame 1: 60 bytes on wire, 60 bytes captured",
        eth: "Ethernet II, Src: Intel_2e:12:a2 (00:1a:2b:2e:12:a2), Dst: VMware_43:2f:12 (00:0c:29:43:2f:12)",
        ip: "Internet Protocol Version 4, Src: 192.168.1.102, Dst: 10.0.8.45\n  Header Length: 20 bytes\n  Time to Live: 64\n  Protocol: TCP (6)",
        tcp: "Transmission Control Protocol, Src Port: 49152, Dst Port: 80, Seq: 0, Len: 0\n  Flags: 0x002 (SYN)\n  Window Size: 64240"
      },
      hex: [
        "0000  00 0c 29 43 2f 12 00 1a 2b 2e 12 a2 08 00 45 00  ..)C/...+.....E.",
        "0010  00 2e 00 00 40 00 40 06 b6 b1 c0 a8 01 66 0a 00  ....@.@......f..",
        "0020  08 2d c0 00 00 50 00 00 00 00 00 00 00 00 50 02  .-...P........P.",
        "0030  fa f0 00 00 00 00                                ......"
      ]
    },
    { no: 2, time: "0.002145", src: "10.0.8.45", dest: "192.168.1.102", proto: "TCP", len: 60, info: "80 → 49152 [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0",
      headers: {
        frame: "Frame 2: 60 bytes on wire, 60 bytes captured",
        eth: "Ethernet II, Src: VMware_43:2f:12 (00:0c:29:43:2f:12), Dst: Intel_2e:12:a2 (00:1a:2b:2e:12:a2)",
        ip: "Internet Protocol Version 4, Src: 10.0.8.45, Dst: 192.168.1.102\n  Header Length: 20 bytes\n  Time to Live: 128\n  Protocol: TCP (6)",
        tcp: "Transmission Control Protocol, Src Port: 80, Dst Port: 49152, Seq: 0, Ack: 1, Len: 0\n  Flags: 0x012 (SYN, ACK)\n  Window Size: 65535"
      },
      hex: [
        "0000  00 1a 2b 2e 12 a2 00 0c 29 43 2f 12 08 00 45 00  ..+.....)C/...E.",
        "0010  00 2e 00 00 40 00 80 06 76 b1 0a 00 08 2d c0 a8  ....@...v....-..",
        "0020  01 66 00 50 c0 00 00 00 00 00 00 00 00 01 50 12  .f.P..........P.",
        "0030  ff ff 00 00 00 00                                ......"
      ]
    },
    { no: 3, time: "0.004812", src: "192.168.1.102", dest: "10.0.8.45", proto: "TCP", len: 54, info: "49152 → 80 [ACK] Seq=1 Ack=1 Win=64240 Len=0",
      headers: {
        frame: "Frame 3: 54 bytes on wire, 54 bytes captured",
        eth: "Ethernet II, Src: Intel_2e:12:a2 (00:1a:2b:2e:12:a2), Dst: VMware_43:2f:12 (00:0c:29:43:2f:12)",
        ip: "Internet Protocol Version 4, Src: 192.168.1.102, Dst: 10.0.8.45\n  Header Length: 20 bytes\n  Time to Live: 64\n  Protocol: TCP (6)",
        tcp: "Transmission Control Protocol, Src Port: 49152, Dst Port: 80, Seq: 1, Ack: 1, Len: 0\n  Flags: 0x010 (ACK)\n  Window Size: 64240"
      },
      hex: [
        "0000  00 0c 29 43 2f 12 00 1a 2b 2e 12 a2 08 00 45 00  ..)C/...+.....E.",
        "0010  00 28 00 00 40 00 40 06 b6 b7 c0 a8 01 66 0a 00  .(..@.@......f..",
        "0020  08 2d c0 00 00 50 00 00 00 01 00 00 00 01 50 10  .-...P........P.",
        "0030  fa f0 00 00                                      ...."
      ]
    },
    { no: 4, time: "0.012580", src: "192.168.1.102", dest: "10.0.8.45", proto: "HTTP", len: 165, info: "POST /login.php HTTP/1.1 (application/x-www-form-urlencoded)",
      headers: {
        frame: "Frame 4: 165 bytes on wire, 165 bytes captured",
        eth: "Ethernet II, Src: Intel_2e:12:a2 (00:1a:2b:2e:12:a2), Dst: VMware_43:2f:12 (00:0c:29:43:2f:12)",
        ip: "Internet Protocol Version 4, Src: 192.168.1.102, Dst: 10.0.8.45\n  Header Length: 20 bytes\n  Time to Live: 64\n  Protocol: TCP (6)",
        tcp: "Transmission Control Protocol, Src Port: 49152, Dst Port: 80, Seq: 1, Ack: 1, Len: 111\n  Flags: 0x018 (PSH, ACK)\n  Window Size: 64240",
        http: "Hypertext Transfer Protocol\n  POST /login.php HTTP/1.1\\r\\n\n  Host: 10.0.8.45\\r\\n\n  Content-Length: 43\\r\\n\n  Content-Type: application/x-www-form-urlencoded\\r\\n  \\r\\n\n  HTML Form URL Encoded: username=admin&password=cyber_guardian_2026"
      },
      hex: [
        "0000  50 4f 53 54 20 2f 6c 6f 67 69 6e 2e 70 68 70 20  POST /login.php ",
        "0010  48 54 54 50 2f 31 2e 31 0d 0a 48 6f 73 74 3a 20  HTTP/1.1..Host: ",
        "0020  31 30 2e 30 2e 38 2e 34 35 0d 0a 43 6f 6e 74 65  10.0.8.45..Conte",
        "0030  6e 74 2d 4c 65 6e 67 74 68 3a 20 34 33 0d 0a 0d  nt-Length: 43...",
        "0040  0a 75 73 65 72 6e 61 6d 65 3d 61 64 6d 69 6e 26  .username=admin&",
        "0050  70 61 73 73 77 6f 72 64 3d 63 79 62 65 72 5f 67  password=cyber_g",
        "0060  75 61 72 64 69 61 6e 5f 32 30 32 36              uardian_2026"
      ]
    },
    { no: 5, time: "0.024901", src: "10.0.8.45", dest: "192.168.1.102", proto: "HTTP", len: 120, info: "HTTP/1.1 200 OK (text/html)",
      headers: {
        frame: "Frame 5: 120 bytes on wire, 120 bytes captured",
        eth: "Ethernet II, Src: VMware_43:2f:12 (00:0c:29:43:2f:12), Dst: Intel_2e:12:a2 (00:1a:2b:2e:12:a2)",
        ip: "Internet Protocol Version 4, Src: 10.0.8.45, Dst: 192.168.1.102\n  Header Length: 20 bytes\n  Time to Live: 128\n  Protocol: TCP (6)",
        tcp: "Transmission Control Protocol, Src Port: 80, Dst Port: 49152, Seq: 1, Ack: 112, Len: 66\n  Flags: 0x018 (PSH, ACK)\n  Window Size: 65535",
        http: "Hypertext Transfer Protocol\n  HTTP/1.1 200 OK\\r\\n\n  Server: Apache/2.4.41\\r\\n\n  Content-Length: 18\\r\\n  \\r\\n\n  Response Data: Login Successful"
      },
      hex: [
        "0000  48 54 54 50 2f 31 2e 31 20 32 30 30 20 4f 4b 0d  HTTP/1.1 200 OK.",
        "0010  0a 53 65 72 76 65 72 3a 20 41 70 61 63 68 65 2f  .Server: Apache/",
        "0020  32 2e 34 2e 34 31 0d 0a 43 6f 6e 74 65 6e 74 2d  2.4.41..Content-",
        "0030  4c 65 6e 67 74 68 3a 20 31 38 0d 0a 0d 0a 4c 6f  Length: 18....Lo",
        "0040  67 69 6e 20 53 75 63 63 65 73 73 66 75 6c        gin Successful"
      ]
    }
  ],
  sqli: [
    { no: 1, time: "0.000000", src: "203.0.113.88", dest: "10.0.8.45", proto: "TCP", len: 60, info: "58221 → 80 [SYN] Seq=0 Win=29200 Len=0 MSS=1460",
      headers: {
        frame: "Frame 1: 60 bytes on wire",
        eth: "Ethernet II, Src: Router_1c:22 (00:0e:2d:1c:22:11), Dst: VMware_43:2f:12 (00:0c:29:43:2f:12)",
        ip: "Internet Protocol Version 4, Src: 203.0.113.88, Dst: 10.0.8.45",
        tcp: "Transmission Control Protocol, Src Port: 58221, Dst Port: 80, Seq: 0"
      },
      hex: ["0000  00 0c 29 43 2f 12 00 0e 2d 1c 22 11 08 00 45 00  ..)C/...-.\"...E."]
    },
    { no: 2, time: "0.012550", src: "203.0.113.88", dest: "10.0.8.45", proto: "HTTP", len: 240, info: "GET /products.php?id=1'+OR+1=1-- HTTP/1.1",
      headers: {
        frame: "Frame 2: 240 bytes on wire",
        eth: "Ethernet II",
        ip: "Internet Protocol Version 4, Src: 203.0.113.88, Dst: 10.0.8.45",
        tcp: "Transmission Control Protocol, Src Port: 58221, Dst Port: 80, Len: 186",
        http: "Hypertext Transfer Protocol\n  GET /products.php?id=1'+OR+1=1-- HTTP/1.1\\r\\n\n  Host: 10.0.8.45\\r\\n\n  User-Agent: sqlmap/1.4.1"
      },
      hex: [
        "0000  47 45 54 20 2f 70 72 6f 64 75 63 74 73 2e 70 68  GET /products.ph",
        "0010  70 3f 69 64 3d 31 27 2b 4f 52 2b 31 3d 31 2d 2d  p?id=1'+OR+1=1--",
        "0020  20 48 54 54 50 2f 31 2e 31 0d 0a 48 6f 73 74 3a  HTTP/1.1..Host:",
        "0030  20 31 30 2e 30 2e 38 2e 34 35 0d 0a 55 73 65 72   10.0.8.45..User",
        "0040  2d 41 67 65 6e 74 3a 20 73 71 6c 6d 61 70 2f 31  -Agent: sqlmap/1"
      ]
    }
  ],
  ddos: [
    { no: 1, time: "0.000000", src: "192.168.1.185", dest: "10.0.8.45", proto: "TCP", len: 60, info: "61221 → 80 [SYN] Seq=0 Win=1024 Len=0",
      headers: { frame: "Frame 1", eth: "Ethernet II", ip: "IP, Src: 192.168.1.185, Dst: 10.0.8.45", tcp: "TCP, Src Port: 61221, Dst Port: 80, Flags: SYN" },
      hex: ["0000  00 0c 29 43 2f 12 00 22 15 a2 a5 f1 08 00 45 00  ..)C/..\"......E."] }
  ]
};

// Generate randomized DDoS packets dynamically to show a heavy load simulation
for (let i = 2; i <= 30; i++) {
  const time = (i * 0.00142).toFixed(6);
  const src = "192.168.1.185";
  const port = 61220 + i;
  mockPacketData.ddos.push({
    no: i,
    time: time,
    src: src,
    dest: "10.0.8.45",
    proto: "TCP",
    len: 60,
    info: `${port} → 80 [SYN] Seq=0 Win=1024 Len=0`,
    headers: {
      frame: `Frame ${i}: 60 bytes on wire`,
      eth: "Ethernet II",
      ip: `Internet Protocol Version 4, Src: ${src}, Dst: 10.0.8.45`,
      tcp: `Transmission Control Protocol, Src Port: ${port}, Dst Port: 80, Flags: SYN`
    },
    hex: ["0000  00 0c 29 43 2f 12 00 22 15 a2 a5 f1 08 00 45 00  ..)C/..\"......E."]
  });
}

function initWireshark() {
  // Load default stream
  loadPacketStream('auth');
}

function loadPacketStream(streamName) {
  activeStream = streamName;
  selectedPacketIndex = -1;
  
  // Update buttons
  const buttons = document.querySelectorAll('.wireshark-toolbar .wireshark-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active-ws');
    if (btn.textContent.toLowerCase().includes(streamName === 'auth' ? 'credentials' : streamName === 'sqli' ? 'sqli' : 'ddos')) {
      btn.classList.add('active-ws');
    }
  });
  
  // Render packet list
  const packetBody = document.getElementById('wireshark-packet-body');
  if (!packetBody) return;
  packetBody.innerHTML = '';
  
  const packets = mockPacketData[streamName];
  packets.forEach((pkt, index) => {
    const row = document.createElement('tr');
    row.className = `packet-row proto-${pkt.proto.toLowerCase()}`;
    row.dataset.index = index;
    row.innerHTML = `
      <td>${pkt.no}</td>
      <td>${pkt.time}</td>
      <td>${pkt.src}</td>
      <td>${pkt.dest}</td>
      <td>${pkt.proto}</td>
      <td>${pkt.len}</td>
      <td style="font-family: monospace;">${pkt.info}</td>
    `;
    
    row.addEventListener('click', () => selectPacket(index));
    packetBody.appendChild(row);
  });
  
  // Reset details and hex panes
  const treePane = document.getElementById('wireshark-tree-pane');
  const hexPane = document.getElementById('wireshark-hex-pane');
  treePane.innerHTML = `<div style="color: var(--text-muted); font-style: italic;">Select a packet to view decoded header breakdown fields...</div>`;
  hexPane.innerHTML = `<div style="color: var(--text-muted); font-style: italic;">Select a packet to inspect binary hex structure representation...</div>`;
}

function selectPacket(index) {
  selectedPacketIndex = index;
  
  // Highlight row
  const rows = document.querySelectorAll('#wireshark-packet-body tr');
  rows.forEach(r => r.classList.remove('selected'));
  
  const selectedRow = document.querySelector(`#wireshark-packet-body tr[data-index="${index}"]`);
  if (selectedRow) selectedRow.classList.add('selected');
  
  const pkt = mockPacketData[activeStream][index];
  
  // 1. Render decoded header tree pane
  const treePane = document.getElementById('wireshark-tree-pane');
  treePane.innerHTML = '';
  
  const layers = [
    { id: 'frame', title: pkt.headers.frame || 'Frame Details', text: pkt.headers.frame },
    { id: 'eth', title: pkt.headers.eth || 'Ethernet II (MAC Headers)', text: pkt.headers.eth },
    { id: 'ip', title: pkt.headers.ip ? 'Internet Protocol Version 4' : null, text: pkt.headers.ip },
    { id: 'tcp', title: pkt.headers.tcp ? 'Transmission Control Protocol' : null, text: pkt.headers.tcp },
    { id: 'http', title: pkt.headers.http ? 'Hypertext Transfer Protocol' : null, text: pkt.headers.http }
  ];
  
  layers.forEach(layer => {
    if (!layer.title || !layer.text) return;
    
    const node = document.createElement('div');
    node.className = 'detail-node';
    
    const nodeTitle = document.createElement('div');
    nodeTitle.className = 'detail-node-title';
    nodeTitle.textContent = layer.title;
    
    const nodeContent = document.createElement('div');
    nodeContent.className = 'detail-node-content';
    nodeContent.innerHTML = layer.text.replace(/\n/g, '<br>').replace(/  /g, '&nbsp;&nbsp;');
    
    nodeTitle.addEventListener('click', () => {
      node.classList.toggle('expanded');
    });
    
    node.appendChild(nodeTitle);
    node.appendChild(nodeContent);
    treePane.appendChild(node);
  });
  
  // 2. Render hex representation dump
  const hexPane = document.getElementById('wireshark-hex-pane');
  hexPane.innerHTML = '';
  
  if (pkt.hex && pkt.hex.length > 0) {
    const table = document.createElement('div');
    table.className = 'hex-dump-table';
    
    pkt.hex.forEach(line => {
      const row = document.createElement('div');
      row.className = 'hex-dump-row';
      
      const offsetStr = line.substring(0, 4);
      const hexStr = line.substring(6, 47);
      const asciiStr = line.substring(48);
      
      // Let's check if it's the credentials payload to highlight it
      let hexHtml = hexStr;
      let asciiHtml = asciiStr;
      
      if (pkt.proto === 'HTTP' && activeStream === 'auth' && line.includes('cyber_g')) {
        // Highlight cyber_g hex and ascii
        hexHtml = hexStr.replace(/(63 79 62 65 72 5f 67|75 61 72 64 69 61 6e 5f 32 30 32 36)/g, '<span class="hex-highlight">$1</span>');
        asciiHtml = asciiStr.replace(/(cyber_g|uardian_2026)/g, '<span class="hex-highlight">$1</span>');
      }
      
      row.innerHTML = `
        <span class="hex-offset">${offsetStr}</span>
        <span class="hex-bytes">${hexHtml}</span>
        <span class="hex-ascii">${asciiHtml}</span>
      `;
      table.appendChild(row);
    });
    hexPane.appendChild(table);
  } else {
    hexPane.innerHTML = `<div style="color: var(--text-muted); font-style: italic;">No hex payload bytes available for control frames.</div>`;
  }
}

function checkChallengeFlag() {
  const input = document.getElementById('challenge-flag-input').value.trim();
  if (input === 'admin:cyber_guardian_2026') {
    alert('🎉 EXCELLENT WORK! Credentials located and verified. You have completed this analysis challenge! Flag registered.');
  } else {
    alert('❌ Incorrect flag. Verify you have located the unencrypted HTTP POST login payload in packet 4 and check the username:password values.');
  }
}

// ==========================================
// 4. SIEM LOG ANALYSIS & SOC DASHBOARD
// ==========================================
let socAlerts = [];
let activeIncidentIndex = -1;
let firewallRules = [];

function initSOC() {
  // Mock alerts base
  socAlerts = [
    { id: 101, title: "SSH Brute-Force Authentication Attempt", srcIp: "192.168.1.185", destHost: "10.0.8.45", severity: "critical", time: "23:42:01", status: "unresolved",
      desc: "Repetitive failed logins detected on port 22. Multiple attempts in 5 seconds suggesting daemon dictionary brute force attacks.",
      payload: '{\n  "event": "sshd_failed_login",\n  "src_ip": "192.168.1.185",\n  "port": 22,\n  "attempts_count": 87,\n  "user_targets": ["admin", "root", "support"],\n  "auth_method": "password_auth"\n}'
    },
    { id: 102, title: "SQL Injection Probe String Detected", srcIp: "203.0.113.88", destHost: "10.0.8.45", severity: "high", time: "23:44:12", status: "unresolved",
      desc: "Web Application firewall detected typical SQL syntax queries (' OR 1=1 --) targeting resource URI '/products.php?id='.",
      payload: '{\n  "event": "waf_uri_alert",\n  "src_ip": "203.0.113.88",\n  "uri": "/products.php?id=1%27+OR+1%3D1--",\n  "user_agent": "sqlmap/1.4.1",\n  "method": "GET"\n}'
    },
    { id: 103, title: "Aggressive Stealth Port Footprinting Scan", srcIp: "192.168.1.120", destHost: "10.0.8.45", severity: "medium", time: "23:44:50", status: "unresolved",
      desc: "Intrusion Detection System triggered on SYN packet bursts targeting sequential ports 1 to 1024 in brief durations.",
      payload: '{\n  "event": "ids_port_scan",\n  "src_ip": "192.168.1.120",\n  "ports_touched": 1024,\n  "flags_active": "SYN",\n  "scan_signature": "Nmap_Stealth_SYN"\n}'
    },
    { id: 104, title: "Apache Server Configuration Directory Probe", srcIp: "198.51.100.4", destHost: "10.0.8.45", severity: "low", time: "23:45:05", status: "unresolved",
      desc: "Client requested URI '/cgi-bin/' triggering default configurations probe notification alerts.",
      payload: '{\n  "event": "http_resource_probe",\n  "src_ip": "198.51.100.4",\n  "uri": "/cgi-bin/",\n  "response_code": 403\n}'
    }
  ];
  
  renderSOCAlerts();
  updateSOCCounters();
}

function renderSOCAlerts() {
  const alertFeed = document.getElementById('siem-alert-feed');
  if (!alertFeed) return;
  alertFeed.innerHTML = '';
  
  socAlerts.forEach((alert, index) => {
    const item = document.createElement('div');
    item.className = `alert-item ${alert.status === 'unresolved' ? 'unresolved' : 'resolved'} severity-${alert.severity}`;
    if (activeIncidentIndex === index) item.classList.add('selected');
    
    item.innerHTML = `
      <div class="alert-meta">
        <span class="alert-name">${alert.title}</span>
        <span class="alert-ip-time">SRC: ${alert.srcIp} | TIME: ${alert.time}</span>
      </div>
      <span class="alert-badge badge-${alert.severity}">${alert.severity}</span>
    `;
    
    item.addEventListener('click', () => selectSOCAlert(index));
    alertFeed.appendChild(item);
  });
}

function selectSOCAlert(index) {
  activeIncidentIndex = index;
  renderSOCAlerts();
  
  const alert = socAlerts[index];
  const detailsBox = document.getElementById('incident-details-box');
  
  detailsBox.innerHTML = `
    <div class="incident-info-row">
      <span class="label">Incident ID:</span>
      <span class="value">#INC-${alert.id}</span>
    </div>
    <div class="incident-info-row">
      <span class="label">Alert Name:</span>
      <span class="value" style="color:#fff; font-weight:700;">${alert.title}</span>
    </div>
    <div class="incident-info-row">
      <span class="label">Source IP:</span>
      <span class="value">${alert.srcIp}</span>
    </div>
    <div class="incident-info-row">
      <span class="label">Destination:</span>
      <span class="value">${alert.destHost}</span>
    </div>
    <div class="incident-info-row">
      <span class="label">Severity:</span>
      <span class="value text-${alert.severity}" style="text-transform: uppercase;">${alert.severity}</span>
    </div>
    <div class="incident-info-row" style="margin-top: 15px;">
      <span class="label">Incident Log:</span>
      <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 6px; line-height: 1.4;">${alert.desc}</p>
    </div>
    <div class="incident-info-row" style="margin-top: 15px;">
      <span class="label">Raw Payload:</span>
      <div class="incident-payload">${alert.payload}</div>
    </div>
  `;
  
  // Enable incident mitigation action controls
  const blockIpBtn = document.getElementById('btn-block-ip');
  const isolateBtn = document.getElementById('btn-isolate-host');
  const resolveBtn = document.getElementById('btn-resolve-alert');
  
  if (alert.status === 'unresolved') {
    blockIpBtn.disabled = false;
    isolateBtn.disabled = false;
    resolveBtn.disabled = false;
  } else {
    blockIpBtn.disabled = true;
    isolateBtn.disabled = true;
    resolveBtn.disabled = true;
  }
}

// Setup Event Listeners for SOC incident buttons
document.getElementById('btn-block-ip').addEventListener('click', () => {
  if (activeIncidentIndex === -1) return;
  const alert = socAlerts[activeIncidentIndex];
  
  // Add firewall rule
  const rule = `iptables -A INPUT -s ${alert.srcIp} -j DROP`;
  if (!firewallRules.includes(rule)) {
    firewallRules.push(rule);
    renderFirewallRules();
  }
  
  alert.status = 'resolved';
  resolveIncidentAction(alert, 'Block rule deployed');
});

document.getElementById('btn-isolate-host').addEventListener('click', () => {
  if (activeIncidentIndex === -1) return;
  const alert = socAlerts[activeIncidentIndex];
  
  // Contain victim
  const rule = `contain-host --ip ${alert.destHost} --reject-all`;
  if (!firewallRules.includes(rule)) {
    firewallRules.push(rule);
    renderFirewallRules();
  }
  
  alert.status = 'resolved';
  resolveIncidentAction(alert, 'Victim host isolated');
});

document.getElementById('btn-resolve-alert').addEventListener('click', () => {
  if (activeIncidentIndex === -1) return;
  const alert = socAlerts[activeIncidentIndex];
  alert.status = 'resolved';
  resolveIncidentAction(alert, 'Incident acknowledged & marked clean');
});

function resolveIncidentAction(alert, statusText) {
  alert.status = 'resolved';
  renderSOCAlerts();
  
  // Re-render desk view in inactive state
  selectSOCAlert(activeIncidentIndex);
  
  updateSOCCounters();
  
  // Display brief alert response confirmation banner
  alert(`[+] Alert Mitigated: ${statusText}. System state updated.`);
}

function renderFirewallRules() {
  const fwBox = document.getElementById('firewall-rules-list');
  if (!fwBox) return;
  
  if (firewallRules.length === 0) {
    fwBox.innerHTML = `<div class="firewall-rule" style="color: var(--text-muted); font-style: italic;">No active blocks. Firewall policies are default ACCEPT.</div>`;
    return;
  }
  
  fwBox.innerHTML = '';
  firewallRules.forEach(rule => {
    const el = document.createElement('div');
    el.className = 'firewall-rule';
    el.innerHTML = `<span>${rule}</span><span style="color:var(--critical);">ACTIVE DROP</span>`;
    fwBox.appendChild(el);
  });
}

function updateSOCCounters() {
  // Recalculate severities based on active alerts list
  const activeAlerts = socAlerts.filter(a => a.status === 'unresolved');
  
  const crit = activeAlerts.filter(a => a.severity === 'critical').length;
  const high = activeAlerts.filter(a => a.severity === 'high').length;
  const med = activeAlerts.filter(a => a.severity === 'medium').length;
  const low = activeAlerts.filter(a => a.severity === 'low').length;
  
  document.getElementById('count-critical').textContent = crit;
  document.getElementById('count-high').textContent = high;
  document.getElementById('count-medium').textContent = med;
  document.getElementById('count-low').textContent = low + 45; // baseline noise log counter
  
  // Status check top bar
  const indicator = document.getElementById('sys-status-indicator');
  const text = document.getElementById('sys-status-text');
  
  if (activeAlerts.length > 0) {
    indicator.className = 'system-status alerted';
    text.textContent = `ALERT: ${activeAlerts.length} UNMITIGATED INTRUSIONS DEPLOYED`;
  } else {
    indicator.className = 'system-status';
    text.textContent = 'SECURE: SYSTEM STATUS NORMAL';
  }
}

// ==========================================
// 5. PASSWORD HARDENING SIMULATOR
// ==========================================
function initPasswordAnalyzer() {
  const input = document.getElementById('pwd-input-field');
  if (!input) return;
  
  input.addEventListener('input', () => {
    analyzePassword(input.value);
  });
}

function togglePasswordVisibility() {
  const input = document.getElementById('pwd-input-field');
  const btn = document.getElementById('pwd-toggle-visibility');
  if (!input) return;
  
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  } else {
    input.type = 'password';
    btn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}

function analyzePassword(password) {
  const feedbackPanel = document.getElementById('pwd-feedback-panel');
  const meterFill = document.getElementById('pwd-meter-fill');
  const meterDesc = document.getElementById('pwd-meter-desc');
  const entropyScore = document.getElementById('pwd-entropy-score');
  
  const charCountEl = document.getElementById('pwd-character-count');
  const keyspaceEl = document.getElementById('pwd-keyspace-size');
  
  if (!password || password.length === 0) {
    meterFill.style.width = '0%';
    meterDesc.textContent = 'Strength: Enter a password';
    entropyScore.textContent = '0 Bits';
    charCountEl.textContent = '0';
    keyspaceEl.textContent = '0';
    feedbackPanel.innerHTML = '<li>Enter a password containing lowercase, uppercase, digits, and special characters.</li>';
    return;
  }
  
  const len = password.length;
  charCountEl.textContent = len;
  
  // Calculate Keyspace
  let keyspace = 0;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  if (hasLower) keyspace += 26;
  if (hasUpper) keyspace += 26;
  if (hasDigit) keyspace += 10;
  if (hasSpecial) keyspace += 32; // Standard special characters pool
  
  keyspaceEl.textContent = keyspace;
  
  // Standard Shannon Entropy calculation: E = L * log2(Keyspace)
  let entropy = len * Math.log2(keyspace || 1);
  
  // Penalty check for common sequential matches or dictionary keys
  const lowerPwd = password.toLowerCase();
  const patterns = ['123456', 'qwerty', 'password', 'admin', 'secops', 'welcome', '12345678', 'password123'];
  let hasPatterns = false;
  
  patterns.forEach(pat => {
    if (lowerPwd.includes(pat)) {
      entropy = Math.max(0, entropy - 20); // subtract 20 bits penalty
      hasPatterns = true;
    }
  });
  
  entropy = Math.round(entropy);
  entropyScore.textContent = `${entropy} Bits`;
  
  // Determine Strength Levels
  let strengthClass = 'critical';
  let strengthText = 'Very Weak';
  let percent = 20;
  let color = 'var(--critical)';
  
  if (entropy < 30) {
    strengthClass = 'critical'; strengthText = 'Very Weak'; percent = 20; color = 'var(--critical)';
  } else if (entropy >= 30 && entropy < 50) {
    strengthClass = 'high'; strengthText = 'Weak'; percent = 40; color = 'var(--high)';
  } else if (entropy >= 50 && entropy < 70) {
    strengthClass = 'medium'; strengthText = 'Moderate'; percent = 60; color = 'var(--medium)';
  } else if (entropy >= 70 && entropy < 90) {
    strengthClass = 'low'; strengthText = 'Strong'; percent = 80; color = 'var(--primary)';
  } else {
    strengthClass = 'low'; strengthText = 'Fort Knox Grade'; percent = 100; color = 'var(--low)';
  }
  
  meterFill.style.width = `${percent}%`;
  meterFill.style.backgroundColor = color;
  meterDesc.textContent = `Strength: ${strengthText}`;
  meterDesc.style.color = color;
  
  // Calculate Crack Times
  calculateCrackTimes(entropy);
  
  // Render feedback guidelines
  feedbackPanel.innerHTML = '';
  
  if (len < 12) {
    feedbackPanel.innerHTML += `<li>⚠️ Length: Increase length to 12+ characters to defend against brute force attempts (currently: ${len}).</li>`;
  }
  if (!hasUpper) {
    feedbackPanel.innerHTML += '<li>💡 Complexity: Add uppercase letters to increase character keyspace.</li>';
  }
  if (!hasDigit) {
    feedbackPanel.innerHTML += '<li>💡 Complexity: Add numerical digits (0-9).</li>';
  }
  if (!hasSpecial) {
    feedbackPanel.innerHTML += '<li>💡 Complexity: Include special symbols (e.g. !, @, #, $, %).</li>';
  }
  if (hasPatterns) {
    feedbackPanel.innerHTML += '<li>⚠️ Common Words: Avoid dictionary sequences like "qwerty" or "password".</li>';
  }
  if (entropy >= 70 && !hasPatterns) {
    feedbackPanel.innerHTML += '<li>🚀 EXCELLENT! High entropy passphrase. This password meets corporate compliance standards.</li>';
  }
}

function calculateCrackTimes(entropy) {
  // Speed bounds
  const speeds = {
    gpu: 100000000000,    // 100 GH/s
    botnet: 10000000000000, // 10 TH/s
    super: 500000000000000, // 500 TH/s
    quantum: 100000000000000000 // 100 PH/s
  };
  
  // Combos = 2^entropy
  const combinations = Math.pow(2, entropy);
  
  const computeTimeStr = (speed) => {
    const secs = combinations / speed;
    if (secs < 0.1) return 'Instant';
    if (secs < 60) return '< 1 minute';
    
    const mins = secs / 60;
    if (mins < 60) return `${Math.round(mins)} minutes`;
    
    const hrs = mins / 60;
    if (hrs < 24) return `${Math.round(hrs)} hours`;
    
    const days = hrs / 24;
    if (days < 365) return `${Math.round(days)} days`;
    
    const years = days / 365;
    if (years < 1000) return `${Math.round(years)} years`;
    if (years < 1000000) return `${Math.round(years / 1000)}k years`;
    
    return `${Math.round(years / 1000000)}M years`;
  };
  
  document.getElementById('time-gpu').textContent = computeTimeStr(speeds.gpu);
  document.getElementById('time-botnet').textContent = computeTimeStr(speeds.botnet);
  document.getElementById('time-super').textContent = computeTimeStr(speeds.super);
  document.getElementById('time-quantum').textContent = computeTimeStr(speeds.quantum);
  
  // Set severity colors on table rows
  const adjustRowClass = (id, entropyThreshold) => {
    const row = document.getElementById(id);
    if (!row) return;
    row.className = '';
    if (entropy < entropyThreshold) {
      row.className = 'critical';
    } else if (entropy < entropyThreshold + 20) {
      row.className = 'high';
    } else {
      row.className = 'low';
    }
  };
  
  adjustRowClass('row-crack-gpu', 40);
  adjustRowClass('row-crack-botnet', 55);
  adjustRowClass('row-crack-super', 70);
  adjustRowClass('row-crack-quantum', 85);
}

// ==========================================
// 6. GLOSSARY FLASHCARDS & QUIZ SYSTEM
// ==========================================
const glossaryTerms = [
  { term: "Phishing", def: "A social engineering attack where malicious links are emailed to trick recipients into revealing sensitive data or executing malware." },
  { term: "SIEM", def: "Security Information and Event Management: A system that aggregates and analyzes network server log data for real-time security tracking." },
  { term: "Ransomware", def: "A type of malware that encrypts files, demanding payment (ransom) in cryptocurrency in exchange for the decryption key." },
  { term: "Exploit", def: "A piece of software, chunk of data, or sequence of commands that takes advantage of a software vulnerability to cause unintended behavior." },
  { term: "Port Scanning", def: "Reconnaissance process sending client requests to range of port addresses to map open listening ports on victim servers." },
  { term: "Man-in-the-Middle", def: "MITM attack: Where an attacker intercepts, relays, and potentially alters communications between two trusting hosts without detection." },
  { term: "Zero-Day", def: "A software vulnerability that is actively exploited in the wild before the developer or vendor becomes aware or issues a patch." },
  { term: "Salt", def: "Random data added to passwords prior to cryptographic hashing to defend stored hashes from precomputed Rainbow Table cracking." },
  { term: "Threat Actor", def: "An individual, group, or entity (state-sponsored, hacktivist) that intends to launch cyber attacks against digital systems." },
  { term: "Firewall", def: "A network security control device that monitors incoming and outgoing packets to filter traffic based on security policies." },
  { term: "CVE", def: "Common Vulnerabilities and Exposures: A public database cataloging standardized identifiers for known information security vulnerabilities." },
  { term: "Honeypot", def: "A decoy system or network designed to attract hackers, allowing defenders to track intrusion strategies safely." },
  { term: "IDS / IPS", def: "Intrusion Detection/Prevention Systems: Monitors traffic for malicious signatures, signaling alert notifications or actively blocking actions." },
  { term: "Cryptography", def: "Methods of securing communications through encryption systems, preventing unauthorized third parties from reading plaintext contents." },
  { term: "Cryptographic Hash", def: "A one-way function that maps data of arbitrary size to a fixed-size bit array (e.g. SHA-256), used for integrity checks." },
  { term: "SQL Injection", def: "SQLi: Input validation error where query strings are injected into forms, manipulating back-end database operations." },
  { term: "Cross-Site Scripting", def: "XSS: Injecting malicious client-side script payloads into web browser templates viewed by other site visitors." },
  { term: "Buffer Overflow", def: "Anomaly where program writes data beyond allocated memory stack bounds, altering execution paths and executing code shell commands." },
  { term: "Social Engineering", def: "Manipulating individuals to compromise standard authentication rules or reveal access keys through emotional leverage." },
  { term: "IAM", def: "Identity and Access Management: Policies defining individual profiles and associated digital system privileges." }
];

const quizQuestions = [
  {
    q: "Which Nmap command flag option permits identifying specific running software versions on open ports?",
    opts: ["nmap -sS", "nmap -sV", "nmap -O", "nmap -p-"],
    ans: 1,
    exp: "Correct! The -sV version detection flag probes open ports to query server software details and build version strings."
  },
  {
    q: "Why is plaintext HTTP vulnerable to credential theft in transit?",
    opts: ["It encrypts data with weak algorithms", "It sends passwords in raw ASCII readability easily viewable by sniffers", "It blocks packet transmission over secure routers", "It requires complex administrative keys to log in"],
    ans: 1,
    exp: "Correct! HTTP transmits details in standard unencrypted text packets, making sniffing tools like Wireshark highly effective for credential theft."
  },
  {
    q: "Which component of a SIEM system aggregates host details and firewall alerts into a central security console?",
    opts: ["Network Intrusion Shield", "Log Aggregator / Collector", "Spam filter proxy", "DNS Server resolver"],
    ans: 1,
    exp: "Correct! Log collectors aggregate events from firewall, OS, and server databases to build security incident databases."
  },
  {
    q: "How does adding random 'Salt' protect password database hashes?",
    opts: ["It limits character entries to 8 bytes", "It makes hash output calculations larger than standard memory bounds", "It alters matching output signatures preventing rainbow tables from matching target pass hashes", "It encrypts passwords into plain text files"],
    ans: 2,
    exp: "Correct! Hashing the password along with a random salt yields unique hash values even for identical passwords, neutralizing precomputed rainbow lists."
  },
  {
    q: "Which scan option triggers web application vulnerability scans for old CGI scripts and configuration issues?",
    opts: ["Nmap port scans", "Nikto vulnerability scanner", "Wireshark sniffing captures", "IP block listings"],
    ans: 1,
    exp: "Correct! Nikto is a specialized web server vulnerability assessment tool highlighting configuration directories, default backups, and CGI scripts."
  },
  {
    q: "What is an active 'Zero-Day' vulnerability?",
    opts: ["A exploit with zero severity limits", "A vulnerability that is actively exploited before developers have created a security fix", "A vulnerability discovered exactly on the start of a year", "A secure policy with zero open ports"],
    ans: 1,
    exp: "Correct! A zero-day refers to security flaws known to hackers before security developers can produce or deploy patches."
  },
  {
    q: "What is the primary function of a network Intrusion Prevention System (IPS) relative to an Intrusion Detection System (IDS)?",
    opts: ["IDS logs alerts, whereas IPS actively drops traffic containing matching intrusion signatures", "IDS encrypts data, while IPS scans ports", "IPS runs client scripts, and IDS blocks ports", "Both perform identical tasks with different labels"],
    ans: 0,
    exp: "Correct! While an IDS detects and logs, an IPS takes active inline steps to terminate connection sessions containing threat payloads."
  },
  {
    q: "What vulnerability occurs when a web application prints unfiltered script inputs back into user browsers?",
    opts: ["SQL Injection", "Cross-Site Scripting (XSS)", "Buffer Overflow", "Ransomware"],
    ans: 1,
    exp: "Correct! XSS exploits occur when script files or tags submitted by attackers run in the browsers of visitors."
  },
  {
    q: "What key metric measures password randomness and structural resistance to guess calculations?",
    opts: ["Network throughput", "Shannon Entropy Bits", "Port scan rates", "Database indexes"],
    ans: 1,
    exp: "Correct! Shannon Entropy bits determine keyspace combinations, calculating resistance to brute force guessing."
  },
  {
    q: "Which firewall command rule statement matches a standard block policy on a source IP?",
    opts: ["iptables -A INPUT -s [IP] -j DROP", "iptables -A OUTPUT -d [IP] -j ACCEPT", "iptables -E FORWARD -s [IP] -j LISTEN", "netstat -ano -IP"],
    ans: 0,
    exp: "Correct! Deployed block rules typically use -j DROP policies on incoming source matches to prevent server connection handshakes."
  }
];

let quizCurrentIndex = 0;
let quizScore = 0;
let quizAnswered = false;

function initGlossaryAndQuiz() {
  renderGlossaryCards();
}

function switchGlossarySubtab(sub) {
  const glossarySub = document.getElementById('subtab-glossary');
  const quizSub = document.getElementById('subtab-quiz');
  
  const glossaryBtn = document.getElementById('toggle-glossary-view');
  const quizBtn = document.getElementById('toggle-quiz-view');
  
  if (sub === 'glossary') {
    glossarySub.style.display = 'block';
    quizSub.style.display = 'none';
    glossaryBtn.className = 'btn btn-primary';
    quizBtn.className = 'btn btn-outline';
    document.getElementById('glossary-search-bar').style.visibility = 'visible';
  } else {
    glossarySub.style.display = 'none';
    quizSub.style.display = 'block';
    glossaryBtn.className = 'btn btn-outline';
    quizBtn.className = 'btn btn-primary';
    document.getElementById('glossary-search-bar').style.visibility = 'hidden';
    startQuiz();
  }
}

function renderGlossaryCards() {
  const container = document.getElementById('flashcard-grid-container');
  if (!container) return;
  container.innerHTML = '';
  
  glossaryTerms.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'flashcard';
    card.innerHTML = `
      <div class="flashcard-inner">
        <div class="flashcard-front">
          <h3>${item.term}</h3>
          <span style="font-size: 0.65rem; color: var(--primary); margin-top: 10px; text-transform: uppercase;">Click to Flip</span>
        </div>
        <div class="flashcard-back">
          <h4>${item.term}</h4>
          <p>${item.def}</p>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
    
    container.appendChild(card);
  });
}

function filterGlossaryCards() {
  const query = document.getElementById('glossary-search-bar').value.toLowerCase();
  const cards = document.querySelectorAll('#flashcard-grid-container .flashcard');
  
  cards.forEach((card, index) => {
    const term = glossaryTerms[index].term.toLowerCase();
    const def = glossaryTerms[index].def.toLowerCase();
    
    if (term.includes(query) || def.includes(query)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Quiz Core
function startQuiz() {
  quizCurrentIndex = 0;
  quizScore = 0;
  
  document.getElementById('quiz-active-screen').style.display = 'block';
  document.getElementById('quiz-result-screen').style.display = 'none';
  
  loadQuizQuestion();
}

function loadQuizQuestion() {
  quizAnswered = false;
  
  const qObj = quizQuestions[quizCurrentIndex];
  
  document.getElementById('quiz-question-number').textContent = quizCurrentIndex + 1;
  document.getElementById('quiz-score-indicator').textContent = quizScore;
  
  const fill = document.getElementById('quiz-progress-fill-bar');
  fill.style.width = `${((quizCurrentIndex) / quizQuestions.length) * 100}%`;
  
  document.getElementById('quiz-question-text').textContent = qObj.q;
  
  const optionsWrapper = document.getElementById('quiz-options-wrapper');
  optionsWrapper.innerHTML = '';
  
  const feedbackBox = document.getElementById('quiz-feedback-box');
  feedbackBox.className = 'quiz-feedback';
  feedbackBox.style.display = 'none';
  
  qObj.opts.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => selectQuizOption(index, btn));
    optionsWrapper.appendChild(btn);
  });
  
  document.getElementById('quiz-submit-next-btn').textContent = (quizCurrentIndex === quizQuestions.length - 1) ? "Finish Quiz" : "Next Question";
}

function selectQuizOption(selectedIndex, btnEl) {
  if (quizAnswered) return;
  quizAnswered = true;
  
  const qObj = quizQuestions[quizCurrentIndex];
  const options = document.querySelectorAll('#quiz-options-wrapper .quiz-option');
  
  options.forEach((opt, index) => {
    if (index === qObj.ans) {
      opt.classList.add('correct');
    }
    if (index === selectedIndex && index !== qObj.ans) {
      opt.classList.add('incorrect');
    }
  });
  
  const feedbackBox = document.getElementById('quiz-feedback-box');
  if (selectedIndex === qObj.ans) {
    quizScore++;
    document.getElementById('quiz-score-indicator').textContent = quizScore;
    feedbackBox.className = 'quiz-feedback correct';
    feedbackBox.textContent = qObj.exp;
  } else {
    feedbackBox.className = 'quiz-feedback incorrect';
    feedbackBox.textContent = `Incorrect. ${qObj.exp}`;
  }
}

function handleQuizNext() {
  if (!quizAnswered) {
    alert('Please choose an answer option before moving to the next section.');
    return;
  }
  
  if (quizCurrentIndex < quizQuestions.length - 1) {
    quizCurrentIndex++;
    loadQuizQuestion();
  } else {
    showQuizResults();
  }
}

function showQuizResults() {
  document.getElementById('quiz-active-screen').style.display = 'none';
  document.getElementById('quiz-result-screen').style.display = 'block';
  
  document.getElementById('quiz-final-score').textContent = `${quizScore} / ${quizQuestions.length}`;
  const pct = Math.round((quizScore / quizQuestions.length) * 100);
  document.getElementById('quiz-final-percentage').textContent = `${pct}%`;
  
  const fb = document.getElementById('quiz-pass-feedback');
  fb.className = '';
  
  if (pct >= 80) {
    fb.style.background = 'rgba(48, 209, 88, 0.1)';
    fb.style.border = '1px solid rgba(48, 209, 88, 0.3)';
    fb.style.color = 'var(--low)';
    fb.innerHTML = '<strong>CONGRATULATIONS ANALYST!</strong> You have successfully qualified for the SOC Defense certification badge. You demonstrated high competence with active scans, network packet dumps, and SIEM security configurations.';
  } else {
    fb.style.background = 'rgba(255, 59, 48, 0.1)';
    fb.style.border = '1px solid rgba(255, 59, 48, 0.3)';
    fb.style.color = 'var(--critical)';
    fb.innerHTML = '<strong>ATTENTION!</strong> You did not reach the 80% passing threshold. Review the terms glossary flashcards and terminal scanners commands, then try the assessment again to earn certification.';
  }
}

function restartQuiz() {
  startQuiz();
}

// ==========================================
// 7. VULNERABILITY REPORT GENERATOR
// ==========================================
function initReportGenerator() {
  updateReportPreview();
}

function updateReportPreview() {
  const target = document.getElementById('rep-target').value || '10.0.8.45';
  const scanType = document.getElementById('rep-scan-type').value;
  
  const crit = parseInt(document.getElementById('rep-critical').value);
  const high = parseInt(document.getElementById('rep-high').value);
  const med = parseInt(document.getElementById('rep-medium').value);
  const low = parseInt(document.getElementById('rep-low').value);
  
  document.getElementById('val-critical').textContent = crit;
  document.getElementById('val-high').textContent = high;
  document.getElementById('val-medium').textContent = med;
  document.getElementById('val-low').textContent = low;
  
  const findings = document.getElementById('rep-findings').value;
  const recs = document.getElementById('rep-recs').value;
  
  // Format Recommendations list
  const recLines = recs.split('\n').filter(line => line.trim().length > 0);
  let recsListHtml = '';
  recLines.forEach(line => {
    recsListHtml += `<li>${line.replace(/^[0-9]+\.\s*/, '')}</li>`;
  });
  
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const previewSheet = document.getElementById('print-sheet-preview');
  previewSheet.innerHTML = `
    <div class="report-doc-header">
      <div class="report-doc-title">
        <h2>Executive Security Scan Report</h2>
        <p>Lab Vulnerability Scan Assessment Output</p>
      </div>
      <div style="font-family: monospace; font-size: 0.75rem; text-align: right; color:#718096;">
        DOC_ID: SEC-${Math.floor(Math.random() * 90000) + 10000}<br>
        CLASSIFIED: INTERNAL USE ONLY
      </div>
    </div>
    
    <div class="report-meta-grid">
      <div class="report-meta-col">
        <span><span class="lbl">Target System:</span><span class="val">${target}</span></span><br>
        <span><span class="lbl">Scan Method:</span><span class="val">${scanType}</span></span>
      </div>
      <div class="report-meta-col">
        <span><span class="lbl">Date Generated:</span><span class="val">${today}</span></span><br>
        <span><span class="lbl">Analyst:</span><span class="val">analyst_sec_01</span></span>
      </div>
    </div>
    
    <div class="report-section-title">Vulnerability Severity Distribution</div>
    <div class="severity-meter-grid">
      <div class="sev-box sev-critical">
        <span>${crit}</span>Critical
      </div>
      <div class="sev-box sev-high">
        <span>${high}</span>High
      </div>
      <div class="sev-box sev-medium">
        <span>${med}</span>Medium
      </div>
      <div class="sev-box sev-low">
        <span>${low}</span>Low
      </div>
    </div>
    
    <div class="report-section-title">Executive Summary Findings</div>
    <div class="findings-text">${findings}</div>
    
    <div class="report-section-title">Required Remediation Actions</div>
    <ol class="rec-list">
      ${recsListHtml || '<li>No mitigation actions specified. Target host environment marked safe.</li>'}
    </ol>
    
    <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 0.7rem; color: #a0aec0; text-align: center;">
      This security report is simulated for educational purposes in the Cybersecurity Operations Center Sandbox.
    </div>
  `;
}

function printReportDocument() {
  window.print();
}
