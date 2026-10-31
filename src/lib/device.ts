/** "Chrome · Windows" — a coarse, human description of a browser from its User-Agent. No versions and nothing that identifies a person; it is only there so an admin can tell two sign-ins apart. */
export function describeDevice(ua: string): string {
  const u = ua || "";
  const browser = /Edg(e|A|iOS)?\//.test(u) ? "Edge" : /OPR\/|Opera/.test(u) ? "Opera" : /SamsungBrowser\//.test(u) ? "Samsung Internet" : /Firefox\/|FxiOS\//.test(u) ? "Firefox" : /Chrome\/|CriOS\//.test(u) ? "Chrome" : /Safari\//.test(u) && /Version\//.test(u) ? "Safari" : u ? "Browser" : "";
  const os = /Windows/.test(u) ? "Windows" : /iPhone|iPad|iPod/.test(u) ? "iOS" : /Android/.test(u) ? "Android" : /CrOS/.test(u) ? "ChromeOS" : /Mac OS X|Macintosh/.test(u) ? "macOS" : /Linux|X11/.test(u) ? "Linux" : "";
  return [browser, os].filter(Boolean).join(" · ") || "Unknown device";
}
