/* MEMERZ: working per-sound download buttons */
(function () {
  "use strict";

  function urlOf(button) {
    const attr = button.getAttribute("onclick") || "";
    const match = attr.match(/playSound\(\s*(['"])(.*?)\1\s*\)/);
    if (!match) return null;
    try { return match[2].replace(/&amp;/g, "&"); } catch (_) { return match[2]; }
  }

  function rawUrl(url) {
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.hostname === "github.com") {
        const parts = parsed.pathname.split("/").filter(Boolean);
        const rawIndex = parts.indexOf("raw");
        if (rawIndex > 1) {
          const owner = parts[0], repo = parts[1];
          const filePath = parts.slice(rawIndex + 1);
          return "https://raw.githubusercontent.com/" + owner + "/" + repo + "/" + filePath.map(encodeURIComponent).join("/");
        }
      }
      return url;
    } catch (_) { return url; }
  }

  function blobPageUrl(url) {
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.hostname === "raw.githubusercontent.com") {
        const parts = parsed.pathname.split("/").filter(Boolean);
        const owner = parts.shift(), repo = parts.shift();
        return "https://github.com/" + owner + "/" + repo + "/raw/refs/heads/main/" + parts.map(encodeURIComponent).join("/");
      }
      if (parsed.hostname === "github.com" && parsed.pathname.includes("/raw/")) {
        return parsed.origin + parsed.pathname;
      }
      return url;
    } catch (_) { return url; }
  }

  function fileNameOf(url) {
    try {
      const path = new URL(url, window.location.href).pathname;
      return decodeURIComponent(path.split("/").pop() || "sound");
    } catch (_) { return "sound"; }
  }

  async function saveFile(url, name, button) {
    button.classList.add("dl-busy");
    button.setAttribute("aria-busy", "true");
    try {
      const response = await fetch(rawUrl(url));
      if (!response.ok) throw new Error("Download failed: " + response.status);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = name || fileNameOf(url);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (error) {
      console.warn("Direct download unavailable; opening the file page instead.", error);
      window.open(blobPageUrl(url), "_blank", "noopener,noreferrer");
    } finally {
      button.classList.remove("dl-busy");
      button.removeAttribute("aria-busy");
    }
  }

  function build() {
    document.querySelectorAll(".soundboard-grid button[onclick*='playSound(']").forEach((button) => {
      if (button.closest(".sound-item")) return;
      const url = urlOf(button);
      if (!url) return;

      button.classList.add("sound-btn");
      const wrap = document.createElement("div");
      wrap.className = "sound-item";
      button.parentNode.insertBefore(wrap, button);
      wrap.appendChild(button);

      const name = (button.textContent || "sound").trim();
      const download = document.createElement("button");
      download.type = "button";
      download.className = "dl-btn dl-desktop";
      download.title = "Download " + name;
      download.setAttribute("aria-label", "Download " + name);
      download.innerHTML = '<i class="bx bx-arrow-to-bottom" aria-hidden="true"></i>';
      download.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        saveFile(url, fileNameOf(url), download);
      });
      wrap.appendChild(download);

      const mobile = document.createElement("a");
      mobile.className = "dl-btn dl-mobile";
      mobile.href = "#";
      mobile.title = "Download " + name;
      mobile.setAttribute("aria-label", "Download " + name);
      mobile.innerHTML = '<i class="bx bx-arrow-to-bottom" aria-hidden="true"></i>';
      mobile.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        saveFile(url, fileNameOf(url), mobile);
      });
      wrap.appendChild(mobile);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build, { once: true });
  } else {
    build();
  }
})();