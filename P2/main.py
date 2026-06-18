import re
import random
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

app = FastAPI(
    title="CyberGuard AI - Educational API",
    description="Backend API for simulated cybersecurity learning scenarios.",
    version="1.0.0"
)

# --- MODELS ---

class ScanRequest(BaseModel):
    target: str
    scan_type: str  # "quick", "stealth", "vuln"

class ChatMessage(BaseModel):
    role: str       # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    history: List[ChatMessage]
    message: str

# --- CONSTANTS & SIMULATED DATA ---

TERMS = [
    {"term": "IP Address", "definition": "A unique string of numbers separated by periods that identifies each computer using the Internet Protocol to communicate over a network."},
    {"term": "Port", "definition": "A virtual point where network connections start and end, associated with a specific process or service (e.g., Port 80 for HTTP, Port 443 for HTTPS)."},
    {"term": "Nmap", "definition": "A free and open-source utility for network discovery and vulnerability scanning, commonly used to discover hosts and services on a computer network."},
    {"term": "Wireshark", "definition": "A popular open-source packet analyzer used for network troubleshooting, analysis, software and communications protocol development, and education."},
    {"term": "Packet", "definition": "A small segment of a larger message. Data sent over computer networks is broken up into packets, which are reassembled by the host that receives them."},
    {"term": "TCP Handshake", "definition": "A three-way process (SYN, SYN-ACK, ACK) used to establish a connection between a client and a server in a TCP/IP network."},
    {"term": "SIEM", "definition": "Security Information and Event Management. A system that aggregates and analyzes log data from various security and network devices to detect threats."},
    {"term": "Firewall", "definition": "A network security device that monitors and filters incoming and outgoing network traffic based on an organization's previously established security policies."},
    {"term": "IDS/IPS", "definition": "Intrusion Detection/Prevention System. Devices or applications that monitor network activities for malicious activities or policy violations."},
    {"term": "DNS", "definition": "Domain Name System. The phonebook of the Internet, which translates human-readable domain names (like example.com) into machine-readable IP addresses."},
    {"term": "Brute Force", "definition": "An activity that involves guessing usernames and passwords to gain unauthorized access to a system by systematically trying all possible combinations."},
    {"term": "SQL Injection", "definition": "A vulnerability that allows an attacker to interfere with the queries an application makes to its database, potentially exposing sensitive data."},
    {"term": "XSS (Cross-Site Scripting)", "definition": "A vulnerability that allows attackers to inject malicious client-side scripts into web pages viewed by other users."},
    {"term": "Phishing", "definition": "A fraudulent attempt to obtain sensitive information such as usernames, passwords, and credit card details by disguising oneself as a trustworthy entity."},
    {"term": "DDOS", "definition": "Distributed Denial of Service. A malicious attempt to disrupt normal traffic of a targeted server, service or network by overwhelming it with a flood of Internet traffic."},
    {"term": "Malware", "definition": "Malicious software. Any program or file that is harmful to a computer user, such as viruses, worms, Trojan horses, ransomware, and spyware."},
    {"term": "Ransomware", "definition": "A type of malware designed to deny access to a computer system or data until a sum of money (ransom) is paid."},
    {"term": "Metasploit", "definition": "A widely used penetration testing framework that helps security professionals find, exploit, and validate vulnerabilities."},
    {"term": "ARP Poisoning", "definition": "A type of cyber attack where an attacker sends falsified ARP (Address Resolution Protocol) messages over a local area network to link their MAC address with a legitimate IP."},
    {"term": "Vulnerability", "definition": "A weakness in an information system, security procedure, internal control, or implementation that can be exploited by a threat source."}
]

# Simulated Packet Scenarios
PACKET_SCENARIOS = {
    "http_clear": [
        {
            "id": 1,
            "time": "0.000000",
            "source": "192.168.1.45",
            "destination": "93.184.216.34",
            "protocol": "TCP",
            "length": 62,
            "info": "49201 → 80 [SYN] Seq=0 Win=64240 Len=0 MSS=1460 SACK_PERM=1",
            "details": {
                "ethernet": {"src": "00:0c:29:4f:8e:12", "dst": "00:50:56:e9:11:02", "type": "IPv4 (0x0800)"},
                "ip": {"version": 4, "hdr_len": "20 bytes", "tos": "0x00", "ttl": 128, "proto": "TCP (6)", "src": "192.168.1.45", "dst": "93.184.216.34"},
                "tcp": {"src_port": 49201, "dst_port": 80, "seq": 0, "ack": 0, "flags": "0x002 (SYN)", "flags_detail": {"SYN": 1, "ACK": 0, "RST": 0, "FIN": 0, "PSH": 0}, "window": 64240},
                "data": ""
            },
            "suspicious": False,
            "explanation": "This is the first packet of a TCP Three-Way Handshake. The client (192.168.1.45) is sending a SYN (Synchronize) packet to port 80 (HTTP) of the server to initiate a connection."
        },
        {
            "id": 2,
            "time": "0.012300",
            "source": "93.184.216.34",
            "destination": "192.168.1.45",
            "protocol": "TCP",
            "length": 62,
            "info": "80 → 49201 [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0 MSS=1460",
            "details": {
                "ethernet": {"src": "00:50:56:e9:11:02", "dst": "00:0c:29:4f:8e:12", "type": "IPv4 (0x0800)"},
                "ip": {"version": 4, "hdr_len": "20 bytes", "tos": "0x00", "ttl": 56, "proto": "TCP (6)", "src": "93.184.216.34", "dst": "192.168.1.45"},
                "tcp": {"src_port": 80, "dst_port": 49201, "seq": 0, "ack": 1, "flags": "0x012 (SYN, ACK)", "flags_detail": {"SYN": 1, "ACK": 1, "RST": 0, "FIN": 0, "PSH": 0}, "window": 65535},
                "data": ""
            },
            "suspicious": False,
            "explanation": "This is the second packet of the TCP Three-Way Handshake. The server acknowledges the SYN request and sends its own SYN request (SYN, ACK)."
        },
        {
            "id": 3,
            "time": "0.012500",
            "source": "192.168.1.45",
            "destination": "93.184.216.34",
            "protocol": "TCP",
            "length": 54,
            "info": "49201 → 80 [ACK] Seq=1 Ack=1 Win=64240 Len=0",
            "details": {
                "ethernet": {"src": "00:0c:29:4f:8e:12", "dst": "00:50:56:e9:11:02", "type": "IPv4 (0x0800)"},
                "ip": {"version": 4, "hdr_len": "20 bytes", "tos": "0x00", "ttl": 128, "proto": "TCP (6)", "src": "192.168.1.45", "dst": "93.184.216.34"},
                "tcp": {"src_port": 49201, "dst_port": 80, "seq": 1, "ack": 1, "flags": "0x010 (ACK)", "flags_detail": {"SYN": 0, "ACK": 1, "RST": 0, "FIN": 0, "PSH": 0}, "window": 64240},
                "data": ""
            },
            "suspicious": False,
            "explanation": "This completes the TCP Three-Way Handshake. The client acknowledges the server's response. The connection is now established and ready to transmit data."
        },
        {
            "id": 4,
            "time": "0.015000",
            "source": "192.168.1.45",
            "destination": "93.184.216.34",
            "protocol": "HTTP",
            "length": 150,
            "info": "POST /login HTTP/1.1",
            "details": {
                "ethernet": {"src": "00:0c:29:4f:8e:12", "dst": "00:50:56:e9:11:02", "type": "IPv4 (0x0800)"},
                "ip": {"version": 4, "hdr_len": "20 bytes", "tos": "0x00", "ttl": 128, "proto": "TCP (6)", "src": "192.168.1.45", "dst": "93.184.216.34"},
                "tcp": {"src_port": 49201, "dst_port": 80, "seq": 1, "ack": 1, "flags": "0x018 (PSH, ACK)", "flags_detail": {"SYN": 0, "ACK": 1, "RST": 0, "FIN": 0, "PSH": 1}, "window": 64240},
                "data": "POST /login HTTP/1.1\r\nHost: example.com\r\nContent-Length: 35\r\nContent-Type: application/x-www-form-urlencoded\r\n\r\nusername=admin&password=SuperSecure123"
            },
            "suspicious": True,
            "explanation": "CRITICAL RISK: Cleartext login credentials (username=admin, password=SuperSecure123) are sent via unencrypted HTTP. Any attacker sniffing this local network can read these credentials in plain text."
        }
    ],
    "syn_flood": [
        {
            "id": 1,
            "time": "0.000000",
            "source": "203.0.113.88",
            "destination": "192.168.1.100",
            "protocol": "TCP",
            "length": 62,
            "info": "1024 → 80 [SYN] Seq=0 Win=1024 Len=0",
            "details": {
                "ethernet": {"src": "00:11:22:33:44:55", "dst": "00:aa:bb:cc:dd:ee", "type": "IPv4 (0x0800)"},
                "ip": {"version": 4, "hdr_len": "20 bytes", "tos": "0x00", "ttl": 64, "proto": "TCP (6)", "src": "203.0.113.88", "dst": "192.168.1.100"},
                "tcp": {"src_port": 1024, "dst_port": 80, "seq": 0, "ack": 0, "flags": "0x002 (SYN)", "flags_detail": {"SYN": 1, "ACK": 0, "RST": 0, "FIN": 0, "PSH": 0}, "window": 1024},
                "data": ""
            },
            "suspicious": True,
            "explanation": "SYN Flood initiation. An external IP (possibly spoofed) is targeting the web server's HTTP port with standard connection requests, but ignoring the ACK replies, leaving connections half-open."
        },
        {
            "id": 2,
            "time": "0.000050",
            "source": "203.0.113.88",
            "destination": "192.168.1.100",
            "protocol": "TCP",
            "length": 62,
            "info": "1025 → 80 [SYN] Seq=0 Win=1024 Len=0",
            "details": {
                "ethernet": {"src": "00:11:22:33:44:55", "dst": "00:aa:bb:cc:dd:ee", "type": "IPv4 (0x0800)"},
                "ip": {"version": 4, "hdr_len": "20 bytes", "tos": "0x00", "ttl": 64, "proto": "TCP (6)", "src": "203.0.113.88", "dst": "192.168.1.100"},
                "tcp": {"src_port": 1025, "dst_port": 80, "seq": 0, "ack": 0, "flags": "0x002 (SYN)", "flags_detail": {"SYN": 1, "ACK": 0, "RST": 0, "FIN": 0, "PSH": 0}, "window": 1024},
                "data": ""
            },
            "suspicious": True,
            "explanation": "Another SYN packet in microsecond proximity from the same sender with a different source port. This pattern indicates automated script execution typical of a Denial of Service attack."
        },
        {
            "id": 3,
            "time": "0.000100",
            "source": "203.0.113.88",
            "destination": "192.168.1.100",
            "protocol": "TCP",
            "length": 62,
            "info": "1026 → 80 [SYN] Seq=0 Win=1024 Len=0",
            "details": {
                "ethernet": {"src": "00:11:22:33:44:55", "dst": "00:aa:bb:cc:dd:ee", "type": "IPv4 (0x0800)"},
                "ip": {"version": 4, "hdr_len": "20 bytes", "tos": "0x00", "ttl": 64, "proto": "TCP (6)", "src": "203.0.113.88", "dst": "192.168.1.100"},
                "tcp": {"src_port": 1026, "dst_port": 80, "seq": 0, "ack": 0, "flags": "0x002 (SYN)", "flags_detail": {"SYN": 1, "ACK": 0, "RST": 0, "FIN": 0, "PSH": 0}, "window": 1024},
                "data": ""
            },
            "suspicious": True,
            "explanation": "Third SYN packet in rapid succession. The server is forced to allocate memory resources for these incoming requests, eventually exhausting resources if the handshake is not completed."
        }
    ],
    "dns_anomaly": [
        {
            "id": 1,
            "time": "0.000000",
            "source": "192.168.1.10",
            "destination": "8.8.8.8",
            "protocol": "DNS",
            "length": 114,
            "info": "Standard query 0x1a2b A czN1cml0eS1hbm9tYWx5LXBhY2tldC1kYXRh.malicious-domain.com",
            "details": {
                "ethernet": {"src": "00:0c:29:ab:cd:ef", "dst": "00:50:56:88:99:aa", "type": "IPv4 (0x0800)"},
                "ip": {"version": 4, "hdr_len": "20 bytes", "tos": "0x00", "ttl": 128, "proto": "UDP (17)", "src": "192.168.1.10", "dst": "8.8.8.8"},
                "udp": {"src_port": 53201, "dst_port": 53, "len": 80},
                "dns": {"transaction_id": "0x1a2b", "flags": "0x0100 (Standard query)", "questions": 1, "answers": 0, "query": "czN1cml0eS1hbm9tYWx5LXBhY2tldC1kYXRh.malicious-domain.com", "type": "A"}
            },
            "suspicious": True,
            "explanation": "DNS Data Exfiltration (DNS Tunneling) attempt. The subdomain contains a base64 encoded payload: 'czN1cml0eS1hbm9tYWx5LXBhY2tldC1kYXRh' which decodes to 's3urity-anomaly-packet-data'. Attackers use DNS queries to sneak private data past local firewalls."
        }
    ]
}

# SIEM Mock Logs
SIEM_LOGS = [
    {"timestamp": "2026-06-17 21:35:12", "source": "192.168.1.45", "destination": "192.168.1.1", "event": "Port Scan Detected", "severity": "Warning", "details": "Sequential connection attempts to ports 21, 22, 23, 80, 443 within 1 second."},
    {"timestamp": "2026-06-17 21:36:00", "source": "203.0.113.88", "destination": "192.168.1.100", "event": "SYN Flood DoS Attack", "severity": "Critical", "details": "Received 500+ SYN packets on port 80 without ACK replies. High CPU utilization detected."},
    {"timestamp": "2026-06-17 21:36:44", "source": "192.168.1.10", "destination": "8.8.8.8", "event": "DNS Tunneling Detected", "severity": "Critical", "details": "Frequent queries containing base64 encoded string sequences in subdomains of 'malicious-domain.com'."},
    {"timestamp": "2026-06-17 21:38:10", "source": "192.168.1.15", "destination": "192.168.1.254", "event": "Successful SSH Login", "severity": "Info", "details": "User 'administrator' successfully authenticated via key from trusted IP."},
    {"timestamp": "2026-06-17 21:39:01", "source": "192.168.1.200", "destination": "192.168.1.201", "event": "Failed SSH Connection Attempt", "severity": "Info", "details": "Incorrect password for user 'root' from internal lab server."},
    {"timestamp": "2026-06-17 21:40:05", "source": "192.168.1.122", "destination": "93.184.216.34", "event": "HTTP Plaintext Credential Transmission", "severity": "Critical", "details": "Detected credentials transmitted inside HTTP POST query payload to login endpoint."},
    {"timestamp": "2026-06-17 21:40:15", "source": "192.168.1.122", "destination": "192.168.1.1", "event": "ARP Spoofing Detected", "severity": "Warning", "details": "Conflict detected: IP 192.168.1.1 is associated with two conflicting MAC addresses (00:0c:29:4f:8e:12 and 00:0c:29:ab:cd:ef)."}
]

# --- BACKEND ENDPOINTS ---

@app.get("/api/learning")
def get_learning_data():
    return {
        "terms": TERMS,
        "tutorials": [
            {
                "id": "intro",
                "title": "Introduction to Network Security",
                "description": "Learn the basics of IP addresses, ports, and how network packets carry information between nodes.",
                "steps": [
                    "Everything connected to a network has an IP Address.",
                    "Servers run applications bound to virtual gateways called Ports.",
                    "Information is split into small chunks called Packets which traverse routers to their destinations."
                ]
            },
            {
                "id": "nmap",
                "title": "Understanding Port Scanning",
                "description": "Discover how penetration testers identify active hosts and open interfaces using Nmap scans.",
                "steps": [
                    "Nmap sends packets (like SYN) to various ports on a target IP.",
                    "If the port responds with SYN-ACK, the port is open.",
                    "If the port responds with RST (Reset) or nothing, the port is closed or filtered.",
                    "Risk classification: Port 22 (SSH) could be Low/Medium depending on version, Port 21 (FTP) is often High risk due to cleartext transmission."
                ]
            },
            {
                "id": "wireshark",
                "title": "Analyzing Network Traffic",
                "description": "Dive deep into headers, flags, and data blocks using packet analyzers.",
                "steps": [
                    "Wireshark intercepts raw signals from the network adapter.",
                    "Packets have layers: Physical, Link (Ethernet), Network (IP), Transport (TCP/UDP), and Application.",
                    "Checking flags in TCP (SYN, ACK, PSH, RST, FIN) lets you track connection status."
                ]
            }
        ]
    }

@app.post("/api/scan")
def run_scan(req: ScanRequest):
    # Sanitize and validate IP address or domain format for simulation safety
    target = req.target.strip()
    if not target:
        raise HTTPException(status_code=400, detail="Target IP or Domain is required.")
    
    # Check if target format is valid (basic IP or hostname check)
    ip_pattern = re.compile(r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$")
    host_pattern = re.compile(r"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    
    if not (ip_pattern.match(target) or host_pattern.match(target) or target in ["localhost", "127.0.0.1"]):
        raise HTTPException(status_code=400, detail="Invalid target structure. Enter a valid IP (e.g. 192.168.1.1) or Domain (e.g. target.local).")

    # Generate simulation results based on scan type
    if req.scan_type == "quick":
        nmap_output = f"""
Starting Nmap 7.92 ( https://nmap.org ) at 2026-06-17 21:44 India Standard Time
Nmap scan report for {target}
Host is up (0.012s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
443/tcp  open  https

Nmap done: 1 IP address (1 host up) scanned in 0.45 seconds
"""
        ports = [
            {"port": 22, "service": "SSH", "state": "open", "risk": "Low", "desc": "Secure Shell service. Used for remote CLI administration. Safe if configured with public keys instead of passwords.", "cve": "None active"},
            {"port": 80, "service": "HTTP", "state": "open", "risk": "Medium", "desc": "Hypertext Transfer Protocol. Serves unencrypted web pages. Subject to credential sniffing.", "cve": "None active"},
            {"port": 443, "service": "HTTPS", "state": "open", "risk": "Low", "desc": "Hypertext Transfer Protocol Secure. Uses TLS to encrypt data transmission. Safe configuration.", "cve": "None active"}
        ]
        threat_level = "Low"

    elif req.scan_type == "stealth":
        nmap_output = f"""
Starting Nmap 7.92 ( https://nmap.org ) at 2026-06-17 21:45 India Standard Time
Nmap scan report for {target}
Host is up (0.025s latency).
Not shown: 996 filtered tcp ports (no-response)
PORT     STATE SERVICE
21/tcp   open  ftp
22/tcp   open  ssh
80/tcp   open  http
3389/tcp open  ms-wbt-server

Nmap done: 1 IP address (1 host up) scanned in 3.12 seconds
"""
        ports = [
            {"port": 21, "service": "FTP", "state": "open", "risk": "High", "desc": "File Transfer Protocol. Sends authentication passwords and file content in plain text. Highly insecure.", "cve": "None active"},
            {"port": 22, "service": "SSH", "state": "open", "risk": "Low", "desc": "Secure Shell service. Used for remote administration.", "cve": "None active"},
            {"port": 80, "service": "HTTP", "state": "open", "risk": "Medium", "desc": "Hypertext Transfer Protocol. Serves unencrypted web pages.", "cve": "None active"},
            {"port": 3389, "service": "RDP", "state": "open", "risk": "Medium", "desc": "Remote Desktop Protocol. Frequently targeted by brute-force bots on public interfaces.", "cve": "None active"}
        ]
        threat_level = "Medium"

    else:  # "vuln"
        nmap_output = f"""
Starting Nmap 7.92 ( https://nmap.org ) at 2026-06-17 21:46 India Standard Time
Nmap scan report for {target}
Host is up (0.015s latency).
Not shown: 995 closed tcp ports (reset)
PORT     STATE SERVICE    VERSION
21/tcp   open  ftp        vsftpd 2.3.4
22/tcp   open  ssh        OpenSSH 4.7p1
80/tcp   open  http       Apache httpd 2.2.8
139/tcp  open  netbios-ssn
445/tcp  open  microsoft-ds

Host script results:
|_smb-vuln-ms17-010: VULNERABLE (EternalBlue)
|  State: VULNERABLE
|  Risk: Critical
|  Description: Remote Code Execution vulnerability in Microsoft SMBv1 servers.
"""
        ports = [
            {"port": 21, "service": "FTP", "state": "open", "risk": "Critical", "desc": "vsftpd 2.3.4 contains a famous backdoor exploit triggered by entering a username ending with a smiley face :)", "cve": "CVE-2011-2523"},
            {"port": 22, "service": "SSH", "state": "open", "risk": "High", "desc": "OpenSSH 4.7p1 is outdated and vulnerable to username enumeration and specific memory leaks.", "cve": "CVE-2018-15473"},
            {"port": 80, "service": "HTTP", "state": "open", "risk": "Medium", "desc": "Apache HTTP Server version 2.2.8. Outdated web server interface.", "cve": "CVE-2017-9798"},
            {"port": 445, "service": "SMB", "state": "open", "risk": "Critical", "desc": "Microsoft Server Message Block service vulnerable to MS17-010 (EternalBlue) remote shell exploit.", "cve": "CVE-2017-0144"}
        ]
        threat_level = "High"

    return {
        "target": target,
        "scan_type": req.scan_type,
        "nmap_output": nmap_output,
        "ports": ports,
        "threat_level": threat_level
    }

@app.get("/api/packets")
def get_packets(scenario: str = "http_clear"):
    if scenario not in PACKET_SCENARIOS:
        raise HTTPException(status_code=400, detail="Invalid packet scenario.")
    return PACKET_SCENARIOS[scenario]

@app.get("/api/siem/events")
def get_siem_events(severity: Optional[str] = None, search: Optional[str] = None):
    results = SIEM_LOGS
    
    if severity and severity != "All":
        results = [x for x in results if x["severity"].lower() == severity.lower()]
        
    if search:
        search_lower = search.lower()
        results = [
            x for x in results 
            if search_lower in x["event"].lower() 
            or search_lower in x["source"].lower() 
            or search_lower in x["details"].lower()
        ]
        
    return results

@app.post("/api/chat")
def security_chat(req: ChatRequest):
    user_msg = req.message.lower().strip()
    
    # Pre-calculated response database representing simulated AI explanations
    response = ""
    
    if "nmap" in user_msg:
        response = (
            "**Nmap (Network Mapper)** is a tool used for discovering devices on a network and identifying "
            "which ports are open on those devices. \n\n"
            "**Key commands:**\n"
            "- `nmap -sS [target]`: Performs a Stealth (SYN) scan by not completing the 3-way handshake.\n"
            "- `nmap -sV [target]`: Runs version detection on discovered ports.\n"
            "- `nmap -A [target]`: Aggressive scan (OS detection, traceroute, script scanning)."
        )
    elif "wireshark" in user_msg or "packet" in user_msg:
        response = (
            "**Wireshark** is a packet analyzer. It intercepts network traffic and displays the "
            "raw contents of data frames. \n\n"
            "When analyzing packets, look at the **TCP Flags**:\n"
            "- **SYN**: Set to initiate a connection handshake.\n"
            "- **ACK**: Set to acknowledge receipt of packets.\n"
            "- **PSH**: Pushes buffered data directly to the application layer.\n"
            "- **RST**: Resets a connection immediately (often seen when trying to hit a closed port or when blocked by a firewall)."
        )
    elif "siem" in user_msg or "splunk" in user_msg:
        response = (
            "**SIEM** (Security Information and Event Management) collects and aggregates log data "
            "from all systems, servers, and routers. \n\n"
            "By analyzing these logs, SIEMs can alert security teams of suspicious patterns, such as "
            "a single IP address failing to log in 100 times in 10 seconds (Brute Force attack)."
        )
    elif "handshake" in user_msg or "tcp" in user_msg:
        response = (
            "The **TCP Three-Way Handshake** is the mechanism used to establish a reliable connection:\n"
            "1. **SYN**: Client sends a Synchronize packet to the server.\n"
            "2. **SYN-ACK**: Server responds with a Synchronize-Acknowledgment.\n"
            "3. **ACK**: Client sends an Acknowledgment back. \n\n"
            "After these three packets, the channel is open for bidirectional application data."
        )
    elif "dns tunneling" in user_msg or "dns anomaly" in user_msg:
        response = (
            "**DNS Tunneling** is a technique used to bypass network filters by encoding data "
            "into standard DNS queries (usually inside subdomains). \n\n"
            "For example, queries targeting `[Base64EncodedData].attacker-domain.com` allow compromised clients "
            "to exfiltrate network data over DNS port 53, which is usually left wide open by security firewalls."
        )
    elif "syn flood" in user_msg:
        response = (
            "A **SYN Flood** is a Denial-of-Service (DoS) attack. The attacker sends a barrage of SYN "
            "packets to a server but never responds to the server's SYN-ACK replies. \n\n"
            "This keeps the server's connection slots half-open, quickly exhausting its queue memory, "
            "making the system unavailable to legitimate users."
        )
    elif "eternalblue" in user_msg or "ms17-010" in user_msg:
        response = (
            "**EternalBlue (MS17-010)** is a vulnerability in Microsoft's implementation of the SMBv1 protocol. "
            "It allowed attackers to execute remote code simply by sending crafted packets to an open port 445.\n\n"
            "This exploit was leaked by the Shadow Brokers group in 2017 and was famously used to propagate "
            "the WannaCry ransomware worldwide."
        )
    else:
        response = (
            "Welcome to **CyberGuard AI Lab Assistant**! I am here to explain security terms, protocol layers, "
            "and alert signs in beginner-friendly language. \n\n"
            "You can ask me questions about:\n"
            "- How Nmap scans work\n"
            "- What a TCP three-way handshake is\n"
            "- How to identify SYN floods and DNS Tunneling\n"
            "- What a SIEM dashboard does"
        )
        
    return {
        "reply": response
    }

# Serve Frontend SPA
@app.get("/", response_class=HTMLResponse)
def index():
    try:
        with open("static/index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "<h3>CyberGuard AI Frontend Files are being initialized. Please refresh in a moment.</h3>"

app.mount("/", StaticFiles(directory="static"), name="static")
