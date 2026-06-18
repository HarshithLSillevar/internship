// CYBERSIM PRO - SIMULATED CLI TERMINAL UTILITY

const TerminalModule = (() => {
  let shellInput, consoleBody;
  
  const welcomeBanner = `
  ____      _                 ____  _             ____
 / ___|   _| |__   ___ _ __  / ___|(_)_ __ ___   |  _ \\ _ __ ___
| |  | | | | '_ \\ / _ \\ '__| \\___ \\| | '_ \` _ \\  | |_) | '__/ _ \\
| |__| |_| | |_) |  __/ |     ___) | | | | | | | |  __/| | | (_) |
 \\____\\__, |_.__/ \___|_|    |____/|_|_| |_| |_| |_|   |_|  \\___/
      |___/
  `;

  function init() {
    shellInput = document.getElementById("cli-shell-input");
    consoleBody = document.getElementById("cli-console-body");

    if (!shellInput || !consoleBody) return;

    // Command listener
    shellInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cmdText = shellInput.value.trim();
        shellInput.value = "";
        
        if (cmdText) {
          processCommand(cmdText);
        }
      }
    });

    // Auto-focus input when clicking inside console
    consoleBody.addEventListener("click", () => {
      shellInput.focus();
    });

    // Make available globally
    window.TerminalModule = {
      clear: () => {
        consoleBody.innerHTML = "";
        printWelcome();
      }
    };
  }

  function printWelcome() {
    consoleBody.innerHTML = `
      <div class="terminal-welcome-text">
        <pre class="font-mono text-xs txt-green">${welcomeBanner}</pre>
        <p class="mt-sm">Welcome to Kali Linux Simulation Shell. Type <span class="txt-cyan">help</span> to view lists of utility tools.</p>
        <p class="txt-muted text-xs mt-xs">Tip: You can query 'nmap', 'whois', 'hydra', or 'cat' commands here.</p>
        <br>
      </div>
    `;
  }

  function printLine(text, type = "") {
    const line = document.createElement("div");
    line.className = `terminal-line ${type}`;
    line.innerHTML = text;
    consoleBody.appendChild(line);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  function processCommand(rawCmd) {
    // Print input echo first
    printLine(`<span class="terminal-prompt-prefix txt-cyan">root@kali:~#</span> ${escapeHTML(rawCmd)}`);

    const tokens = rawCmd.split(/\s+/);
    const primary = tokens[0].toLowerCase();
    
    logSessionAction("CLI Terminal", "Command Run", rawCmd);

    switch (primary) {
      case "help":
        runHelp();
        break;
      case "clear":
        consoleBody.innerHTML = "";
        break;
      case "nmap":
        runNmap(tokens);
        break;
      case "whois":
        runWhois(tokens);
        break;
      case "hydra":
        runHydra(tokens);
        break;
      case "cat":
        runCat(tokens);
        break;
      default:
        printLine(`bash: ${escapeHTML(primary)}: command not found. Type <span class='txt-cyan'>help</span> for valid commands.`, "error");
    }
  }

  function runHelp() {
    printLine("CyberSim CLI Tools Directory - Available utilities:", "info");
    printLine("  <span class='txt-cyan'>nmap [IP]</span>             Scan host network ports (e.g. nmap 192.168.4.15)");
    printLine("  <span class='txt-cyan'>whois [domain/IP]</span>     Fetch registration ownership records");
    printLine("  <span class='txt-cyan'>hydra [options]</span>       Simulate dictionary credential attacks (Type 'hydra help' for options)");
    printLine("  <span class='txt-cyan'>cat [filename]</span>        View files (e.g. cat cheat_sheet.txt)");
    printLine("  <span class='txt-cyan'>clear</span>                  Clear the terminal console history");
    printLine("  <span class='txt-cyan'>help</span>                   Print this instruction sheet");
    printLine("");
  }

  function runNmap(tokens) {
    if (tokens.length < 2) {
      printLine("nmap: missing target IP parameter. Usage: nmap [target_ip]", "error");
      return;
    }
    const target = tokens[1];
    printLine(`Starting Nmap scan against host ${escapeHTML(target)}...`, "info");
    
    setTimeout(() => {
      if (target === "192.168.4.15") {
        printLine("Nmap scan report for 192.168.4.15", "success");
        printLine("PORT     STATE SERVICE");
        printLine("80/tcp   open  http (Apache 2.4.52)");
        printLine("MAC Address: 08:00:27:E5:A9:A7 (VirtualBox NIC)");
      } else if (target === "192.168.4.12") {
        printLine("Nmap scan report for 192.168.4.12", "success");
        printLine("PORT     STATE SERVICE");
        printLine("22/tcp   open  ssh");
        printLine("3306/tcp open  mysql");
      } else {
        printLine(`Nmap scan report for ${escapeHTML(target)}`, "success");
        printLine("All 1000 scanned ports are closed (reset).");
      }
    }, 400);
  }

  function runWhois(tokens) {
    if (tokens.length < 2) {
      printLine("whois: missing domain or IP parameter. Usage: whois [host]", "error");
      return;
    }
    const target = tokens[1];
    printLine(`Querying WHOIS database for ${escapeHTML(target)}...`, "info");
    
    setTimeout(() => {
      printLine(`% WHOIS lookup details for: ${escapeHTML(target)}`);
      printLine("Registrar: SECUREOPS-LOCAL-NIC");
      printLine("Organization: CyberSim Training Laboratory Infrastructure");
      printLine("NetRange: 192.168.4.0 - 192.168.4.255");
      printLine("CIDR: 192.168.4.0/24");
      printLine("Status: ACTIVE / DEMO SUBNET");
      printLine("Record Updated: 2026-06-18");
    }, 300);
  }

  function runHydra(tokens) {
    if (tokens.length > 1 && tokens[1] === "help") {
      printLine("Hydra usage example: <span class='txt-cyan'>hydra -l admin -P wordlist.txt ssh://192.168.4.12</span>", "info");
      return;
    }

    printLine("Hydra v9.2 (c) 2026 by van Hauser/THC - Starting dictionary attack...", "info");
    printLine("[DATA] attacking ssh://192.168.4.12:22/");
    
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      if (counter < 4) {
        printLine(`[STATUS] attack ongoing: tested ${counter * 25} logins...`);
      } else {
        clearInterval(interval);
        printLine("[22][ssh] host: 192.168.4.12 login: admin password: password -> <span class='txt-green font-bold'>SUCCESS</span>", "success");
        printLine("1 of 1 target successfully completed, 1 valid password found.", "info");
      }
    }, 400);
  }

  function runCat(tokens) {
    if (tokens.length < 2) {
      printLine("cat: missing filename. Usage: cat [filename] (e.g. cat cheat_sheet.txt)", "error");
      return;
    }

    const filename = tokens[1].toLowerCase();
    
    if (filename === "cheat_sheet.txt") {
      printLine("===== SECURITY CHEAT SHEET: TERMINOLOGY =====", "info");
      CYBER_DATA.cheatSheet.forEach(item => {
        printLine(`<strong>${item.term}</strong>: ${item.definition}`);
      });
      printLine("=============================================", "info");
    } else {
      printLine(`cat: ${escapeHTML(tokens[1])}: No such file or directory.`, "error");
    }
  }

  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  document.addEventListener("DOMContentLoaded", init);

})();
