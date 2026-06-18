// CYBERSIM PRO - AI SECURITY ADVISOR CHAT CONTEXT

const AiAdvisor = (() => {
  let isPaneOpen = false;
  let chatBody, chatInput, sendBtn, toggleBtn, floatingBadge, assistantPane;

  // Local context hints based on active navigation tab
  const labHints = {
    dashboard: "Welcome to the Operations command. Click on the <strong>Recon & Nmap Lab</strong> tab in the navigation bar to start mapping the active target services on the subnet.",
    
    recon: "<strong>Reconnaissance Hint:</strong> Set target IP to <code>192.168.4.15</code>, choose <code>-sV</code> (Service detection) or <code>-A</code> (Aggressive scan) and execute. Once completed, <strong>double-click the Web Server node</strong> on the interactive node graph to view open ports and proceed to Web App Sec.",
    
    webvuln: "<strong>Web Auditing Hint:</strong> Toggle <strong>'Intercept On'</strong> in the Burp Proxy panel. In the browser target login, input username <code>admin' OR '1'='1</code> with any password, and click Authenticate. View and edit the request envelope in the proxy pane, and click <strong>'Forward'</strong> to bypass login via SQL Injection. For XSS, logout of admin, navigate to Feedbacks, and submit comment <code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code> with Intercept On.",
    
    password: "<strong>Cryptography Lab Hint:</strong> Input a weak password (like <code>admin123</code>), inspect its low entropy, and see MD5 hash outputs. In the Hashcat cracker panel, choose <strong>'Dictionary Wordlist Attack'</strong> and click <strong>'Launch Decryption'</strong>. To harden, switch Storage function to <strong>'BCrypt'</strong> and notice how offline attacks are mitigated.",
    
    siem: "<strong>SIEM Log Monitor Hint:</strong> Filter logs by <strong>'CRIT'</strong>. Identify SSH brute-force attempts from IP <code>203.0.113.88</code>. Click the <strong>'Apply IP Block'</strong> mitigation button in the Incident board to secure the port 22 access. Mitigate other active threats (SQLi, XSS, Weak Hash) as they are resolved in previous labs.",
    
    tools: "<strong>CLI Console Hint:</strong> Try typing commands like <code>nmap 192.168.4.15</code>, <code>whois 192.168.4.15</code>, <code>hydra -l admin -P wordlist.txt ssh://192.168.4.12</code>, or <code>cat cheat_sheet.txt</code> to read the cybersecurity definition guidelines.",
    
    reports: "<strong>Reporting Sheet Hint:</strong> Fill out the client company name and your notes. Check the box summaries of discovered threats, click <strong>'Compile Audit Portfolio'</strong>, then click <strong>'Print Portfolio (PDF)'</strong> to save your report."
  };

  // Pre-configured concept QA dictionary
  const chatReplies = [
    {
      keywords: /(what is|explain) (sqli|sql injection)/i,
      reply: "<strong>SQL Injection (SQLi)</strong> occurs when an application takes user input and uses it to construct a database query without proper validation or parameterization. This allows an attacker to inject SQL commands (like <code>' OR 1=1--</code>), bypassing login screens, or dumping tables. Fix it by using <strong>Prepared Statements / Parameterized Queries</strong>."
    },
    {
      keywords: /(what is|explain) (xss|cross site scripting)/i,
      reply: "<strong>Cross-Site Scripting (XSS)</strong> happens when an application includes untrusted data in a web page without proper escaping or encoding. The script executes in the victim's browser, potentially stealing cookies, redirecting sessions, or defacing sites. Fix it by applying <strong>context-aware HTML entity encoding</strong> and setting a strong <strong>Content Security Policy (CSP)</strong>."
    },
    {
      keywords: /(what is|explain) (nmap|port scan)/i,
      reply: "<strong>Nmap (Network Mapper)</strong> is an open-source security tool used to scan subnets. It determines what hosts are active, what port numbers are open (SSH, HTTP, Database), and what service versions/Operating Systems are running, helping identify possible entry vectors."
    },
    {
      keywords: /(what is|explain) (siem|splunk)/i,
      reply: "<strong>SIEM (Security Information & Event Management)</strong> platforms aggregate logs from hosts, firewalls, and servers in real-time. Analysts query logs to build timelines, flag correlation alerts (like a brute-force pattern of multiple login failures), and coordinate response containment plans."
    },
    {
      keywords: /(what is|explain) (bcrypt|hashing|salting)/i,
      reply: "<strong>Bcrypt</strong> is a slow password hashing algorithm that utilizes key-stretching (cost factor) to slow down offline password cracking. It incorporates a random <strong>Salt</strong> automatically, which prevents rainbow table pre-computed lookups. Weak hashes like MD5 or SHA1 can be cracked in seconds."
    },
    {
      keywords: /(what is|explain) (burp|burpsuite|proxy)/i,
      reply: "<strong>Burp Suite Intercepting Proxy</strong> sits between your web browser and the target server. It intercepts HTTP requests, allowing security auditors to view headers, parameters, cookies, and alter payloads before forwarding them, revealing how the server handles manipulated packets."
    },
    {
      keywords: /(cheat sheet|glossary|definition|vocabulary)/i,
      reply: "You can find all 20 terminology definitions in the **Report Generator** or by checking our active CLI terminal commands list. Type <code>cat cheat_sheet.txt</code> in the Kali Terminal tab for a quick read!"
    },
    {
      keywords: /(hello|hi|hey|greetings)/i,
      reply: "Greetings SecOps Agent! Ask me details about SQL Injection, XSS, Bcrypt hashing, SIEM logs, Nmap commands, or how to pass the active lab milestone."
    }
  ];

  // Initialize event bindings
  function init() {
    chatBody = document.getElementById("assistant-chat-body");
    chatInput = document.getElementById("assistant-chat-input");
    sendBtn = document.getElementById("btn-assistant-send");
    toggleBtn = document.getElementById("btn-toggle-assistant");
    floatingBadge = document.getElementById("btn-floating-assistant");
    assistantPane = document.getElementById("app-assistant-pane");

    // Click handler to open/close pane
    floatingBadge.addEventListener("click", openPane);
    toggleBtn.addEventListener("click", closePane);

    // Chat sending handlers
    sendBtn.addEventListener("click", handleUserMessage);
    chatInput.addEventListener("keypress", (e) => {
      if(e.key === "Enter") handleUserMessage();
    });

    // Make AiAdvisor available globally
    window.AiAdvisor = {
      welcomeMessage,
      updateLabContext,
      openPane
    };
  }

  function openPane() {
    isPaneOpen = true;
    assistantPane.classList.remove("closed");
    floatingBadge.classList.add("hidden");
    chatInput.focus();
  }

  function closePane() {
    isPaneOpen = false;
    assistantPane.classList.add("closed");
    floatingBadge.classList.remove("hidden");
  }

  function welcomeMessage() {
    addMessage("Hello Agent! I've loaded your lab dashboard. Let me know if you need any assistance by typing concept questions here (e.g. 'what is SQL injection?' or 'how to bypass login').");
  }

  // Update advisor's context when switching tabs
  function updateLabContext(tabName) {
    if (labHints[tabName]) {
      addSystemMessage(labHints[tabName]);
      
      // Flash dot badge on floating icon if assistant pane is closed
      if(!isPaneOpen) {
        const badgeDot = floatingBadge.querySelector(".chat-badge-dot");
        badgeDot.classList.add("pulse-tag");
        badgeDot.style.display = "block";
      }
    }
  }

  function addMessage(text, sender = "assistant") {
    const msg = document.createElement("div");
    msg.className = `chat-message chat-${sender}`;
    msg.innerHTML = sender === "assistant" ? text : `<strong>You:</strong> ${escapeHTML(text)}`;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function addSystemMessage(htmlText) {
    const msg = document.createElement("div");
    msg.className = "chat-message chat-system";
    msg.innerHTML = htmlText;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function handleUserMessage() {
    const query = chatInput.value.trim();
    if(!query) return;

    addMessage(query, "user");
    chatInput.value = "";

    // Generate response with brief delay
    setTimeout(() => {
      let foundReply = false;
      for (const item of chatReplies) {
        if(item.keywords.test(query)) {
          addMessage(item.reply);
          foundReply = true;
          break;
        }
      }

      if(!foundReply) {
        addMessage("Understood, analyst. For details on that topic, I suggest checking standard industry resources like OWASP or MITRE ATT&CK frameworks. Let me know if you want hints regarding our active simulations!");
      }
    }, 600);
  }

  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Self-execute bindings
  document.addEventListener("DOMContentLoaded", init);

})();
