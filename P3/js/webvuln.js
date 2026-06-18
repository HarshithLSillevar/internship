// CYBERSIM PRO - WEB VULNERABILITY LAB (DVWA & BURP PROXY)

const WebVulnModule = (() => {
  let btnBurpToggle, btnBurpForward, btnBurpDrop, burpRawEditor, burpStatus;
  let browserScreen, browserLock, loginForm, loginUser, loginPass, loginFeedback;
  let commentsForm, feedName, feedText, commentsFeed, btnLogout, webViewLogin, webViewComments;

  let isInterceptOn = false;
  let activeRequest = null; // Holds structured active request details

  // Default pre-populated comments
  const defaultComments = [
    { name: "SysAdmin", message: "Welcome to the SecureCorp feedback page. Please report any anomalies here." },
    { name: "DevTeam", message: "Updated feedback input field styles for better modern layout." }
  ];

  function init() {
    btnBurpToggle = document.getElementById("btn-burp-toggle");
    btnBurpForward = document.getElementById("btn-burp-forward");
    btnBurpDrop = document.getElementById("btn-burp-drop");
    burpRawEditor = document.getElementById("burp-raw-editor");
    burpStatus = document.getElementById("burp-status-badge");

    browserScreen = document.getElementById("webvuln-browser-screen");
    browserLock = document.getElementById("webvuln-browser-lock");
    
    webViewLogin = document.getElementById("web-view-login");
    webViewComments = document.getElementById("web-view-comments");
    
    loginForm = document.getElementById("form-dvwa-login");
    loginUser = document.getElementById("web-login-user");
    loginPass = document.getElementById("web-login-pass");
    loginFeedback = document.getElementById("web-login-feedback");
    
    commentsForm = document.getElementById("form-dvwa-feedback");
    feedName = document.getElementById("web-feed-name");
    feedText = document.getElementById("web-feed-text");
    commentsFeed = document.getElementById("web-comments-feed");
    btnLogout = document.getElementById("btn-logout-dvwa");

    // Event bindings
    btnBurpToggle.addEventListener("click", toggleIntercept);
    btnBurpForward.addEventListener("click", forwardRequest);
    btnBurpDrop.addEventListener("click", dropRequest);
    
    document.getElementById("btn-web-login-submit").addEventListener("click", submitLogin);
    document.getElementById("btn-web-feed-submit").addEventListener("click", submitComment);
    btnLogout.addEventListener("click", logout);

    // Initial render
    resetCommentsFeed();

    // Make WebVulnModule available globally
    window.WebVulnModule = {
      reset,
      injectMitigation: (type, active) => {
        if(type === 'sqli') AppState.mitigations.sqli = active;
        if(type === 'xss') AppState.mitigations.xss = active;
        updateGlobalScore();
      }
    };
  }

  // Toggle Intercept status
  function toggleIntercept() {
    isInterceptOn = !isInterceptOn;
    if (isInterceptOn) {
      btnBurpToggle.innerText = "Intercept On";
      btnBurpToggle.className = "btn btn-danger flex-1"; // Glower rose class
      burpStatus.innerText = "INTERCEPT IS ACTIVE";
      burpStatus.className = "badge badge-outline-rose";
    } else {
      btnBurpToggle.innerText = "Intercept Off";
      btnBurpToggle.className = "btn btn-outline-rose flex-1";
      burpStatus.innerText = "INTERCEPT IS OFF";
      burpStatus.className = "badge badge-outline-secondary";
      
      // If requests were pending, drop them
      if(activeRequest) dropRequest();
    }
  }

  // Intercept and load login form submit
  function submitLogin() {
    const user = loginUser.value;
    const pass = loginPass.value;
    loginFeedback.innerHTML = "&nbsp;";

    const requestDetails = {
      type: "login",
      method: "POST",
      url: "/dvwa/login.php",
      headers: {
        "Host": "192.168.4.15",
        "User-Agent": "Mozilla/5.0 (Kali; SecureOS)",
        "Accept": "text/html,application/xhtml+xml",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`
    };

    if (isInterceptOn) {
      captureRequest(requestDetails);
    } else {
      processLogin(user, pass);
    }
  }

  // Intercept and load comments form submit
  function submitComment() {
    const name = feedName.value.trim();
    const msg = feedText.value.trim();

    if(!name || !msg) {
      alert("Please fill out name and comment fields.");
      return;
    }

    const requestDetails = {
      type: "comment",
      method: "POST",
      url: "/dvwa/guestbook.php",
      headers: {
        "Host": "192.168.4.15",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `txtName=${encodeURIComponent(name)}&txtMsg=${encodeURIComponent(msg)}`
    };

    if (isInterceptOn) {
      captureRequest(requestDetails);
    } else {
      processComment(name, msg);
    }
  }

  // Write HTTP details into Burp raw editor
  function captureRequest(req) {
    activeRequest = req;
    
    // Lock Web client app view
    browserLock.classList.add("active");
    btnBurpForward.disabled = false;
    btnBurpDrop.disabled = false;

    // Generate HTTP envelope text
    let headerStr = `${req.method} ${req.url} HTTP/1.1\n`;
    for (const key in req.headers) {
      headerStr += `${key}: ${req.headers[key]}\n`;
    }
    headerStr += `Content-Length: ${req.body.length}\n\n`;
    headerStr += req.body;

    burpRawEditor.value = headerStr;
    burpRawEditor.readOnly = false;
    burpRawEditor.focus();
    
    logSessionAction("Burp Suite", "Request Intercepted", `${req.method} ${req.url}`);
  }

  // Forward request from Burp editor
  function forwardRequest() {
    if (!activeRequest) return;

    const rawText = burpRawEditor.value;
    
    // Parse the edited body parameters
    const splitIndex = rawText.indexOf("\n\n");
    const bodyStr = splitIndex !== -1 ? rawText.substring(splitIndex + 2).trim() : "";
    
    // Helper to extract values from URL Encoded string
    const getParam = (name) => {
      const regex = new RegExp(`(?:^|&)${name}=([^&]*)`);
      const match = bodyStr.match(regex);
      return match ? decodeURIComponent(match[1]) : "";
    };

    if (activeRequest.type === "login") {
      const user = getParam("username");
      const pass = getParam("password");
      processLogin(user, pass);
    } else if (activeRequest.type === "comment") {
      const name = getParam("txtName");
      const msg = getParam("txtMsg");
      processComment(name, msg);
    }

    clearProxyWindow();
  }

  // Drop pending request
  function dropRequest() {
    clearProxyWindow();
    loginFeedback.innerText = "Error: Connection dropped by proxy client.";
    logSessionAction("Burp Suite", "Request Dropped", "Packet discarded by auditor");
  }

  function clearProxyWindow() {
    activeRequest = null;
    burpRawEditor.value = "";
    burpRawEditor.readOnly = true;
    browserLock.classList.remove("active");
    btnBurpForward.disabled = true;
    btnBurpDrop.disabled = true;
  }

  // Process login credentials
  function processLogin(user, pass) {
    // Audit check: SQL Injection vulnerabilities
    // Standard bypass payload patterns: admin' OR '1'='1
    const hasSqliPattern = (str) => {
      const pattern = /'?\s*(or|and)\s*'?[0-9a-z]+'?\s*=\s*'?[0-9a-z]+/i;
      return pattern.test(str);
    };

    const isSqliBypass = hasSqliPattern(user) || hasSqliPattern(pass);

    if (isSqliBypass) {
      if (AppState.mitigations.sqli) {
        // SQL query mitigation active: prepared statements prevent this exploit
        loginFeedback.className = "text-xs font-mono text-center txt-rose mt-sm";
        loginFeedback.innerText = "Query Hardened: Parameters sanitized. Authentication Failed.";
        logSessionAction("Web Server", "SQLi Exploit Blocked", "Mitigation enabled: Prepared Statements");
        return;
      }

      // Successful login bypass exploit
      loginFeedback.className = "text-xs font-mono text-center txt-green mt-sm";
      loginFeedback.innerText = "Login Bypassed! Session loading...";
      logSessionAction("Web Server", "Authentication Bypass", "SQL Injection vulnerability exploited on Login");

      setTimeout(() => {
        // Transition to Comments database
        webViewLogin.classList.add("hidden");
        webViewComments.classList.remove("hidden");
        loginUser.value = "";
        loginPass.value = "";
        
        // Update milestone
        AppState.completions.webvuln = true;
        updateGlobalScore();
      }, 1200);

    } else if (user === "admin" && pass === "admin123") {
      // Valid credentials check (MD5 cracking target username credentials)
      loginFeedback.className = "text-xs font-mono text-center txt-green mt-sm";
      loginFeedback.innerText = "Authenticated! Welcome Admin.";
      logSessionAction("Web Server", "Admin Authenticated", "Logged in using cracked credentials");

      setTimeout(() => {
        webViewLogin.classList.add("hidden");
        webViewComments.classList.remove("hidden");
        loginUser.value = "";
        loginPass.value = "";
        
        AppState.completions.webvuln = true;
        updateGlobalScore();
      }, 1200);
    } else {
      loginFeedback.className = "text-xs font-mono text-center txt-rose mt-sm";
      loginFeedback.innerText = "Error: Invalid username or password credentials.";
      logSessionAction("Web Server", "Authentication Failed", `Attempted username: ${user}`);
    }
  }

  // Process comment submittals
  function processComment(name, msg) {
    // Check for Stored XSS Script tags
    const hasXssPattern = /<script.*?>.*?<\/script>/i.test(msg);

    if (hasXssPattern) {
      if (AppState.mitigations.xss) {
        // Output encoding sanitization active
        const safeMsg = escapeHTML(msg);
        addCommentToFeed(name, safeMsg);
        logSessionAction("Web Server", "XSS Payload Neutralized", "HTML entity encoding sanitization applied");
        return;
      }

      // Successful Stored XSS exploit
      logSessionAction("Web Server", "Stored XSS Injected", `Payload script stored: ${msg}`);
      
      // Trigger browser alert simulation
      setTimeout(() => {
        alert(`XSS Vulnerability Triggered!\nDocument cookies exposed: PHPSESSID=cybercomb2026sessionkeys\nExecuting Script Payload: alert('XSS')`);
        
        // Render comment highlighting script tags
        addCommentToFeed(name, `<span class="txt-rose font-bold">&lt;script&gt;alert('XSS')&lt;/script&gt;</span> (Exploit executed)`, true);
        
        feedText.value = "";
      }, 300);
    } else {
      addCommentToFeed(name, escapeHTML(msg));
      feedText.value = "";
    }
  }

  function addCommentToFeed(name, msg, isExploit = false) {
    const row = document.createElement("div");
    row.className = `feedback-comment-row ${isExploit ? 'bg-danger border-glass' : ''}`;
    row.innerHTML = `<span class="font-bold txt-cyan font-heading text-xs">${escapeHTML(name)}:</span> 
                     <span class="text-xs ${isExploit ? '' : 'txt-muted'}">${msg}</span>`;
    
    commentsFeed.appendChild(row);
    commentsFeed.scrollTop = commentsFeed.scrollHeight;
  }

  function resetCommentsFeed() {
    commentsFeed.innerHTML = "";
    defaultComments.forEach(c => addCommentToFeed(c.name, c.message));
  }

  function logout() {
    webViewComments.classList.add("hidden");
    webViewLogin.classList.remove("hidden");
    loginFeedback.innerHTML = "&nbsp;";
    resetCommentsFeed();
    logSessionAction("Web Server", "Admin Logout", "Session terminated");
  }

  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function reset() {
    if(isInterceptOn) toggleIntercept();
    clearProxyWindow();
    webViewComments.classList.add("hidden");
    webViewLogin.classList.remove("hidden");
    loginUser.value = "";
    loginPass.value = "";
    loginFeedback.innerHTML = "&nbsp;";
    resetCommentsFeed();
  }

  document.addEventListener("DOMContentLoaded", init);

})();
