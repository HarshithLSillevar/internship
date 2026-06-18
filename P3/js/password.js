// CYBERSIM PRO - PASSWORD LAB & HASHCAT SIMULATOR ENGINE

const PasswordLabModule = (() => {
  let strengthInput, toggleVisibleBtn, strengthBar, ratingText, entropyText, timeOnline, timeOffline;
  let hashSelect, hashOutput, crackMethod, crackWordlist, crackConsole, statTried, statSpeed, statTime;
  let startCrackBtn, stopCrackBtn;

  let crackAnimationId = null;
  let isCracking = false;
  let targetPassword = "password";

  function init() {
    strengthInput = document.getElementById("pass-strength-input");
    toggleVisibleBtn = document.getElementById("btn-toggle-pass-visible");
    strengthBar = document.getElementById("strength-meter-fill");
    ratingText = document.getElementById("pass-rating-text");
    entropyText = document.getElementById("pass-entropy-text");
    timeOnline = document.getElementById("pass-time-online");
    timeOffline = document.getElementById("pass-time-offline");
    
    hashSelect = document.getElementById("pass-hash-select");
    hashOutput = document.getElementById("pass-hash-output");
    
    crackMethod = document.getElementById("crack-method");
    crackWordlist = document.getElementById("crack-wordlist");
    crackConsole = document.getElementById("crack-console-lines");
    statTried = document.getElementById("crack-stat-tried");
    statSpeed = document.getElementById("crack-stat-speed");
    statTime = document.getElementById("crack-stat-time");
    
    startCrackBtn = document.getElementById("btn-start-crack");
    stopCrackBtn = document.getElementById("btn-stop-crack");

    // Event listeners
    strengthInput.addEventListener("input", auditPassword);
    toggleVisibleBtn.addEventListener("click", togglePasswordVisibility);
    hashSelect.addEventListener("change", syncHashOutput);
    
    startCrackBtn.addEventListener("click", launchCracker);
    stopCrackBtn.addEventListener("click", abortCracker);

    // Initial audit
    auditPassword();

    // Make available globally
    window.PasswordLabModule = {
      reset,
      syncHashOutput
    };
  }

  function togglePasswordVisibility() {
    const isText = strengthInput.type === "text";
    strengthInput.type = isText ? "password" : "text";
    toggleVisibleBtn.innerHTML = isText ? `<i data-lucide="eye-off" style="width:16px;"></i>` : `<i data-lucide="eye" style="width:16px;"></i>`;
    lucide.createIcons();
  }

  // Pure JavaScript MD5 Implementation
  function md5(string) {
    function rotateLeft(lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX, lY) {
      const lX8 = lX & 0x80000000;
      const lY8 = lY & 0x80000000;
      const lX4 = lX & 0x40000000;
      const lY4 = lY & 0x40000000;
      const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
      if (lX4 | lY4) {
        if (lResult & 0x40000000) return lResult ^ 0xC0000000 ^ lX8 ^ lY8;
        return lResult ^ 0x40000000 ^ lX8 ^ lY8;
      }
      return lResult ^ lX8 ^ lY8;
    }
    function F(x, y, z) { return (x & y) | (~x & z); }
    function G(x, y, z) { return (x & z) | (y & ~z); }
    function H(x, y, z) { return x ^ y ^ z; }
    function I(x, y, z) { return y ^ (x | ~z); }
    function FF(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function convertToWordArray(string) {
      let lWordCount;
      const lMessageLength = string.length;
      const lNumberOfWordsTemp1 = lMessageLength + 8;
      const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
      const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
      const lWordArray = Array(lNumberOfWords);
      let lBytePosition = 0;
      let lByteCount = 0;
      while (lByteCount < lMessageLength) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition);
        lByteCount++;
      }
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
    }
    function wordToHex(lValue) {
      let wordToHexValue = "", wordToHexValueTemp = "", lByte, lCount;
      for (lCount = 0; lCount <= 3; lCount++) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        wordToHexValueTemp = "0" + lByte.toString(16);
        wordToHexValue = wordToHexValue + wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
      }
      return wordToHexValue;
    }
    function utf8Encode(string) {
      string = string.replace(/\r\n/g, "\n");
      let utftext = "";
      for (let n = 0; n < string.length; n++) {
        const c = string.charCodeAt(n);
        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if (c > 127 && c < 2048) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }
      return utftext;
    }
    let x = [];
    let k, AA, BB, CC, DD, a, b, c, d;
    const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    const S41 = 6, S42 = 10, S43 = 15, S44 = 21;
    string = utf8Encode(string);
    x = convertToWordArray(string);
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
    for (k = 0; k < x.length; k += 16) {
      AA = a; BB = b; CC = c; DD = d;
      a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
      d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
      b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
      a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
      d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
      b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
      d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
      b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
      d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
      b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
      a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
      d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
      b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
      a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
      d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
      c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
      b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
      d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
      c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
      b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
      a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
      d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
      c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
      b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
      a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
      d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
      b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
      d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
      b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
      d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
      c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
      b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
      a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
      d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
      b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
      a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
      d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
      b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
      d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
      b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
      d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
      b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
      d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
      b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
      a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
    }
    return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  }

  // Calculate Shannon-like password entropy
  function auditPassword() {
    targetPassword = strengthInput.value;
    
    // Evaluate character pool size (R)
    let poolSize = 0;
    if (/[a-z]/.test(targetPassword)) poolSize += 26;
    if (/[A-Z]/.test(targetPassword)) poolSize += 26;
    if (/[0-9]/.test(targetPassword)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(targetPassword)) poolSize += 33; // standard ASCII symbols

    const length = targetPassword.length;
    let entropy = 0;
    if (length > 0 && poolSize > 0) {
      entropy = length * Math.log2(poolSize);
    }

    entropyText.innerText = `${entropy.toFixed(1)} bits`;
    
    // Update hash output field
    syncHashOutput();

    // Map ratings and crack times
    let rating, fillWidth, fillClass, timeTextOnline, timeTextOffline;

    if (length === 0) {
      rating = "N/A";
      fillWidth = 0;
      fillClass = "bg-danger";
      timeTextOnline = "--";
      timeTextOffline = "--";
    } else if (entropy < 28) {
      rating = "WEAK";
      fillWidth = 25;
      fillClass = "bg-danger";
      timeTextOnline = "< 1 sec";
      timeTextOffline = "< 1 sec";
    } else if (entropy < 50) {
      rating = "MODERATE";
      fillWidth = 55;
      fillClass = "bg-warning";
      timeTextOnline = "~3 hours";
      timeTextOffline = "< 1 sec";
    } else if (entropy < 80) {
      rating = "STRONG";
      fillWidth = 85;
      fillClass = "bg-success";
      timeTextOnline = "~8 months";
      timeTextOffline = "~3 hours";
    } else {
      rating = "SECURE";
      fillWidth = 100;
      fillClass = "bg-cyan";
      timeTextOnline = "Centuries";
      timeTextOffline = "Years";
    }

    // Apply UI updates
    ratingText.innerText = rating;
    ratingText.className = `font-bold ${fillClass.replace('bg-', 'txt-')}`;
    
    strengthBar.style.width = `${fillWidth}%`;
    strengthBar.className = `strength-meter-fill ${fillClass}`;
    
    timeOnline.innerText = timeTextOnline;
    timeOnline.className = fillClass.replace('bg-', 'txt-');
    timeOffline.innerText = timeTextOffline;
    timeOffline.className = fillClass.replace('bg-', 'txt-');
  }

  // Cryptographic Hashing selectors
  function syncHashOutput() {
    const pass = strengthInput.value;
    const algorithm = hashSelect.value;
    
    if (!pass) {
      hashOutput.value = "";
      return;
    }

    if (algorithm === "MD5") {
      hashOutput.value = md5(pass);
    } else if (algorithm === "SHA256") {
      // Mock SHA-256 (64 hex characters) using MD5 padded
      const md5Hex = md5(pass);
      hashOutput.value = md5Hex + md5(md5Hex);
    } else if (algorithm === "BCRYPT") {
      // Mock Bcrypt format
      const salt = "R9h/cIPz0gi.UR3RYyV0Vu";
      const hash = md5(pass).substring(0, 31);
      hashOutput.value = `$2a$12$${salt}${hash}`;
    }
  }

  // Attack simulator launcher
  function launchCracker() {
    if (isCracking) return;
    
    const pass = strengthInput.value.trim();
    if (!pass) {
      alert("Test password target cannot be empty.");
      return;
    }

    isCracking = true;
    startCrackBtn.disabled = true;
    stopCrackBtn.disabled = false;
    
    const method = crackMethod.value;
    const wordlistKey = crackWordlist.value;
    const algorithm = hashSelect.value;

    crackConsole.innerHTML = `<span class="txt-cyan">[SecOps] Initializing Hashcat v6.2.5...</span><br>`;
    crackConsole.innerHTML += `<span class="txt-cyan">[SecOps] Hashing target: ${pass} (${algorithm})</span><br>`;

    let processedCount = 0;
    const startTime = Date.now();
    let durationSeconds = 0;

    // Determine simulation cracking stats based on hashing selection
    let speedHashesPerSec = 4500;
    if (algorithm === "SHA256") speedHashesPerSec = 2200;
    if (algorithm === "BCRYPT") speedHashesPerSec = 1; // adaptive stretches slow calculation

    statSpeed.innerText = speedHashesPerSec.toLocaleString();

    // Pull wordlists from data.js
    const list = CYBER_DATA.passwords[wordlistKey];

    // Animation frame tick
    const tick = () => {
      if (!isCracking) return;

      durationSeconds = (Date.now() - startTime) / 1000;
      statTime.innerText = `${durationSeconds.toFixed(1)}s`;

      if (method === "dictionary") {
        // DICTIONARY ATTACK SIMULATION
        if (algorithm === "BCRYPT") {
          // Slow progress rendering due to bcrypt work costs
          processedCount++;
          statTried.innerText = processedCount;
          const currentGuess = list[processedCount % list.length];
          crackConsole.innerHTML += `Comparing: $2a$12$... vs ${currentGuess}<br>`;
          crackConsole.scrollTop = crackConsole.scrollHeight;

          if (currentGuess === pass) {
            crackSuccess(pass, durationSeconds);
            return;
          }
          
          if (processedCount >= 20) { // Limit Bcrypt attempts to prevent infinite freeze
            crackFailed();
            return;
          }

          setTimeout(() => {
            crackAnimationId = requestAnimationFrame(tick);
          }, 1000); // 1 trial per second

        } else {
          // MD5 / SHA-256 Dictionary (Runs fast)
          const batchSize = 3;
          for (let i = 0; i < batchSize; i++) {
            if (processedCount < list.length) {
              const currentGuess = list[processedCount];
              processedCount++;
              statTried.innerText = processedCount;

              const mockTargetHash = hashOutput.value;
              let mockGuessHash = "";
              if (algorithm === "MD5") mockGuessHash = md5(currentGuess);
              else mockGuessHash = md5(currentGuess) + md5(md5(currentGuess));

              crackConsole.innerHTML += `<div class="text-xs">Trying word #${processedCount}: ${currentGuess} -> <span class="txt-muted">${mockGuessHash.substring(0, 16)}...</span></div>`;
              crackConsole.scrollTop = crackConsole.scrollHeight;

              // Check match
              if (currentGuess === pass) {
                crackSuccess(pass, durationSeconds);
                return;
              }
            } else {
              crackFailed();
              return;
            }
          }

          setTimeout(() => {
            crackAnimationId = requestAnimationFrame(tick);
          }, 60);
        }

      } else {
        // BRUTE FORCE ATTACK SIMULATION
        if (algorithm === "BCRYPT") {
          crackConsole.innerHTML += `<span class="txt-rose">Brute force attack blocked: Cost index too high. Aborting.</span><br>`;
          crackFailed("Cost Overload");
          return;
        }

        const batchSize = 5;
        const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < batchSize; i++) {
          processedCount += 85;
          statTried.innerText = processedCount.toLocaleString();

          // Generate random strings mimicking combinations
          let randomGuess = "";
          const guessLen = Math.floor(Math.random() * 4) + 3; // 3 to 6 chars
          for (let c = 0; c < guessLen; c++) {
            randomGuess += alphabet[Math.floor(Math.random() * alphabet.length)];
          }

          crackConsole.innerHTML += `<div class="text-2xs">Brute: ${randomGuess} -> Checking collision matches...</div>`;
          crackConsole.scrollTop = crackConsole.scrollHeight;

          // Artificial bypass check to resolve brute force animation loop
          if (processedCount > 1200 || randomGuess === pass) {
            crackSuccess(pass, durationSeconds);
            return;
          }
        }

        setTimeout(() => {
          crackAnimationId = requestAnimationFrame(tick);
        }, 80);
      }
    };

    // Run tick loop
    crackAnimationId = requestAnimationFrame(tick);
  }

  function crackSuccess(pass, duration) {
    isCracking = false;
    startCrackBtn.disabled = false;
    stopCrackBtn.disabled = true;
    cancelAnimationFrame(crackAnimationId);

    crackConsole.innerHTML += `<br><span class="txt-green font-bold">[SUCCESS] HASH CRACKED SUCCESSFULLY!</span><br>`;
    crackConsole.innerHTML += `<span class="txt-green">Plaintext password resolved: <strong>${pass}</strong></span><br>`;
    crackConsole.scrollTop = crackConsole.scrollHeight;

    // Update session completions
    AppState.completions.password = true;
    logSessionAction("Password Lab", "Hash Decryption Succeeded", `Resolved password '${pass}' in ${duration.toFixed(1)}s`);
    updateGlobalScore();
  }

  function crackFailed(reason = "Wordlist Exhausted") {
    isCracking = false;
    startCrackBtn.disabled = false;
    stopCrackBtn.disabled = true;
    cancelAnimationFrame(crackAnimationId);

    crackConsole.innerHTML += `<br><span class="txt-rose font-bold">[FAILURE] Attack failed: ${reason}. Target hash secured.</span><br>`;
    crackConsole.scrollTop = crackConsole.scrollHeight;
    logSessionAction("Password Lab", "Decryption Attack Failed", `Reason: ${reason}`);
  }

  function abortCracker() {
    if (!isCracking) return;
    isCracking = false;
    startCrackBtn.disabled = false;
    stopCrackBtn.disabled = true;
    cancelAnimationFrame(crackAnimationId);

    crackConsole.innerHTML += `<br><span class="txt-warning">[WARN] Process aborted by analyst.</span><br>`;
    crackConsole.scrollTop = crackConsole.scrollHeight;
    logSessionAction("Password Lab", "Cracker Interrupted", "Process stopped");
  }

  function reset() {
    abortCracker();
    strengthInput.value = "admin123";
    strengthInput.type = "text";
    toggleVisibleBtn.innerHTML = `<i data-lucide="eye" style="width:16px;"></i>`;
    hashSelect.selectedIndex = 0;
    
    crackMethod.selectedIndex = 0;
    crackWordlist.selectedIndex = 0;
    crackConsole.innerHTML = "[Hashcat Engine Idle] Click 'Launch Attack' to initiate decryption.";
    
    statTried.innerText = "0";
    statSpeed.innerText = "0";
    statTime.innerText = "--:--";

    auditPassword();
    lucide.createIcons();
  }

  document.addEventListener("DOMContentLoaded", init);

})();
