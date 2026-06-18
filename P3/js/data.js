// CYBERSIM PRO - STATIC DATABASES AND RAW SIMULATED ARRAYS

const CYBER_DATA = {
  // Cybersecurity Terminology Cheat Sheet (20 terms)
  cheatSheet: [
    { term: "Reconnaissance", definition: "The preparatory phase where an attacker gathers information about a target network before launching an attack." },
    { term: "Port Scanning", definition: "A technique used to identify open ports, active services, and operating systems on a network host (e.g., Nmap)." },
    { term: "SQL Injection (SQLi)", definition: "An exploit where malicious SQL statements are inserted into entry fields for execution, bypassing login or reading databases." },
    { term: "Cross-Site Scripting (XSS)", definition: "An attack where malicious scripts are injected into trusted websites, executing in the victim's browser context." },
    { term: "SIEM", definition: "Security Information and Event Management; systems that aggregate and analyze log data from networks, hosts, and applications to detect threats." },
    { term: "Brute Force Attack", definition: "A trial-and-error method used to decode encrypted data, passwords, or hashes by systematically checking all possible combinations." },
    { term: "Dictionary Attack", definition: "An exploit that cracks passwords by testing words from a pre-defined list (wordlist) against the target hash." },
    { term: "Cryptographic Hash", definition: "A mathematical function that converts input data into a fixed-size string of characters. It is a one-way process." },
    { term: "MD5", definition: "Message Digest 5; a widely used hash function that is now cryptographically broken and vulnerable to rapid collision and offline attacks." },
    { term: "Bcrypt", definition: "A secure password hashing function based on the Blowfish cipher. It incorporates salt and an adjustable work cost parameter." },
    { term: "Burp Suite", definition: "A popular graphical tool for testing Web Application security, acting as an intercepting proxy to audit HTTP parameters." },
    { term: "Nmap", definition: "Network Mapper; a free open-source utility used for network discovery, port scanning, and vulnerability auditing." },
    { term: "Wireshark", definition: "A network packet analysis tool that captures and displays packet data in real-time, helping trace network activity and payloads." },
    { term: "Firewall", definition: "A security system that monitors and controls incoming and outgoing network traffic based on predetermined rules." },
    { term: "Metasploit", definition: "A penetration testing framework that provides code and payloads to exploit known vulnerabilities on target systems." },
    { term: "IDS/IPS", definition: "Intrusion Detection/Prevention System; tools that monitor network traffic for malicious signatures and block threats automatically." },
    { term: "Encryption", definition: "The process of encoding data so that only authorized parties can read it, securing data in transit or at rest." },
    { term: "Vulnerability", definition: "A weakness in software, hardware, or network configuration that can be exploited by threat actors." },
    { term: "Salting", definition: "Adding random data to a password before hashing, ensuring identical passwords generate unique hashes, blocking rainbow table lookups." },
    { term: "Mitigation", definition: "Actionable defense protocols designed to eliminate vulnerabilities, contain attacks, or reduce system risk exposures." }
  ],

  // Target Node Vulnerability Profiles
  nodes: {
    workstation: {
      ip: "192.168.4.10",
      label: "Workstation (Linux Mint)",
      os: "Linux Mint 21.1",
      risk: "SECURE",
      vulns: "None detected",
      ports: [
        { port: "80/tcp", service: "http", status: "closed", sugg: "N/A" },
        { port: "22/tcp", service: "ssh", status: "closed", sugg: "N/A" }
      ]
    },
    dbServer: {
      ip: "192.168.4.12",
      label: "DB Server (MySQL)",
      os: "FreeBSD 13.1",
      risk: "HIGH RISK",
      vulns: "SSH Brute-Force Exposed",
      ports: [
        { port: "22/tcp", service: "ssh", status: "open", sugg: "Target is receiving brute-force requests. Block IP in SIEM." },
        { port: "3306/tcp", service: "mysql", status: "open", sugg: "Database listening. Require secure credential policies." }
      ]
    },
    target: {
      ip: "192.168.4.15",
      label: "Web Server (DVWA)",
      os: "Linux Ubuntu 22.04 LTS",
      risk: "CRITICAL RISK",
      vulns: "SQL Injection, Stored XSS, Weak admin hash storing",
      ports: [
        { port: "80/tcp", service: "http (Apache 2.4.52)", status: "open", sugg: "Interacts via Burp Proxy. Run SQL Injection on login." },
        { port: "22/tcp", service: "ssh", status: "closed", sugg: "N/A" },
        { port: "3306/tcp", service: "mysql", status: "closed", sugg: "N/A" }
      ]
    }
  },

  // Simulated Wordlists for Password lab
  passwords: {
    top100: [
      "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234567",
      "football", "princess", "admin", "welcome", "administrator", "guest", "root",
      "monkey", "shadow", "superman", "trustnoone", "dragon", "hacker", "password123",
      "iloveyou", "mustang", "cisco", "oracle", "database", "cyber", "security",
      "network", "access", "decrypt", "md5crack", "system", "secops", "admin123"
    ],
    top1000: [
      // Truncated list supplemented dynamically in password.js, but pre-populating with standard entries
      "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234567",
      "football", "princess", "admin", "welcome", "administrator", "guest", "root",
      "monkey", "shadow", "superman", "trustnoone", "dragon", "hacker", "password123",
      "iloveyou", "mustang", "cisco", "oracle", "database", "cyber", "security",
      "network", "access", "decrypt", "md5crack", "system", "secops", "admin123",
      "server123", "backdoor", "hackme", "matrix", "neo", "morpheus", "trinity",
      "agentmith", "zion", "sentinel", "oracle2026", "sparkintern", "p3project",
      "antigravity", "deepmind", "geminiflash", "cybersecurity", "vulnerability",
      "reconnaissance", "penetration", "metasploit", "wireshark", "splunklog"
    ]
  },

  // SIEM logs database stream pool
  siemLogs: {
    info: [
      "SecOpsAgent: Audit heartbeat received from node 192.168.4.10",
      "dhcpd: Assigned IP address 192.168.4.11 to user-laptop-03",
      "ntpd: Clock synchronized with time-a-g.nist.gov",
      "sshd: Connection closed by authenticating user guest 192.168.4.10 port 49210",
      "systemd: Started Periodic Command Scheduler.",
      "dockerd: Container proxy-gateway health check [OK]",
      "web_nginx: 192.168.4.10 - - [GET /index.html HTTP/1.1] 200 4821",
      "mysql_audit: Database check: 0 slow queries detected",
      "postfix: Queue daemon initialized; status=idle"
    ],
    warning: [
      "kernel: [194.21] TCP: Treasonous port-scan signature suspected from external IP",
      "web_nginx: 192.168.4.15 - - [GET /etc/passwd HTTP/1.1] 400 Bad Request",
      "syslogd: System audit logs reaching 80% maximum capacity buffer",
      "mysql_audit: Warning: SQL error code 1064 near 'OR 1=1' in login query",
      "web_nginx: Host 192.168.4.15 guestbook posted input containing '<script>' tags",
      "snmpd: SNMP request received from unauthorized public community manager",
      "firewall: Packet dropped on port 445 (SMB) from 192.168.4.88",
      "sshd: Invalid user administrator login attempt from 192.168.4.12 port 50122"
    ],
    critical: [
      "sshd: Brute Force SSH Attack detected from 203.0.113.88 on 192.168.4.12: 120 failed attempts in 30 seconds",
      "mysql_auth: Successful login bypass exploit! Session admin activated for IP 192.168.4.15",
      "web_feedback: Stored XSS Script injected successfully into guest database",
      "secur_aud: Critical Alert: Admin password hash MD5 matching cracked database dictionary entries",
      "firewall: Port scan flood trigger activated. 500 scans/sec blocked from 203.0.113.88",
      "kernel: [FATAL] Buffer overflow signature detected on active database daemon",
      "secur_aud: Database credential leak! Raw password dumped: admin123"
    ]
  },

  // Nmap console lines streamer template
  nmapScanOutputs: {
    "-sS": [
      "Starting Nmap 7.92 ( https://nmap.org ) at 2026-06-18 11:39 UTC",
      "Initiating SYN Stealth Scan against 192.168.4.15...",
      "Scanning 192.168.4.15 [1000 ports]",
      "Discovered open port 80/tcp on 192.168.4.15",
      "Completed SYN Stealth Scan against 192.168.4.15 in 1.45s (1000 ports)",
      "Nmap scan report for 192.168.4.15",
      "Host is up (0.0035s latency).",
      "Not shown: 998 closed tcp ports (reset)",
      "PORT     STATE SERVICE",
      "80/tcp   open  http",
      "MAC Address: 08:00:27:E5:A9:A7 (Oracle VirtualBox NIC)",
      "Nmap done: 1 IP address (1 host up) scanned in 2.12 seconds"
    ],
    "-sV": [
      "Starting Nmap 7.92 ( https://nmap.org ) at 2026-06-18 11:39 UTC",
      "Initiating SYN Stealth Scan against 192.168.4.15...",
      "Completed SYN Stealth Scan (1.40s)",
      "Initiating Service scan against open port...",
      "Scanning 1 service on 192.168.4.15",
      "Completed Service scan in 6.00s (1 port)",
      "Nmap scan report for 192.168.4.15",
      "Host is up (0.0031s latency).",
      "PORT     STATE SERVICE VERSION",
      "80/tcp   open  http    Apache httpd 2.4.52 ((Ubuntu))",
      "Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel",
      "Nmap done: 1 IP address (1 host up) scanned in 8.54 seconds"
    ],
    "-O": [
      "Starting Nmap 7.92 ( https://nmap.org ) at 2026-06-18 11:39 UTC",
      "Initiating OS scan against 192.168.4.15...",
      "Completed OS scan in 3.12s",
      "Nmap scan report for 192.168.4.15",
      "Host is up (0.0028s latency).",
      "PORT     STATE SERVICE",
      "80/tcp   open  http",
      "Device type: general purpose",
      "Running: Linux 5.X",
      "OS CPE: cpe:/o:linux:linux_kernel:5",
      "OS details: Linux 5.4 - 5.15 (Ubuntu)",
      "Network Distance: 1 hop",
      "OS detection performed.",
      "Nmap done: 1 IP address (1 host up) scanned in 5.48 seconds"
    ],
    "-A": [
      "Starting Nmap 7.92 ( https://nmap.org ) at 2026-06-18 11:39 UTC",
      "Initiating SYN Stealth Scan against 192.168.4.15...",
      "Completed SYN Stealth Scan (1.30s)",
      "Initiating Service scan against open port...",
      "Completed Service scan in 5.20s",
      "Initiating OS detection...",
      "Completed OS detection (2.85s)",
      "Initiating Traceroute scan...",
      "Completed Traceroute scan (0.12s)",
      "Nmap scan report for 192.168.4.15",
      "Host is up (0.0029s latency).",
      "PORT     STATE SERVICE VERSION",
      "80/tcp   open  http    Apache httpd 2.4.52 ((Ubuntu))",
      "|_http-title: DVWA - Damn Vulnerable Web Application",
      "|_http-server-header: Apache/2.4.52 (Ubuntu)",
      "Warning: OSScan results may be unreliable.",
      "Device type: general purpose",
      "Running: Linux 5.X",
      "OS details: Linux 5.4 - 5.15 (Ubuntu)",
      "TRACEROUTE (using port 80/tcp)",
      "HOP RTT     ADDRESS",
      "1   2.90 ms 192.168.4.15",
      "Nmap done: 1 IP address (1 host up) scanned in 10.15 seconds"
    ]
  }
};
