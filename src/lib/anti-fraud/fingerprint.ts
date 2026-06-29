interface FingerprintComponents {
  userAgent: string;
  language: string;
  languages: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  timezone: string;
  timezoneOffset: number;
  cookiesEnabled: boolean;
  touchPoints: number;
  webglVendor: string;
  webglRenderer: string;
  canvasFingerprint: string;
  installedFonts: string[];
  audioFingerprint: string;
  plugins: string;
}

class FingerprintManager {
  async generateFingerprint(): Promise<string> {
    const components = await this.collectComponents();
    return this.hashComponents(components);
  }

  private async collectComponents(): Promise<FingerprintComponents> {
    const canvas = this.getCanvasFingerprint();
    const audio = await this.getAudioFingerprint();
    const webgl = this.getWebGLInfo();
    const fonts = this.getInstalledFonts();

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages?.join(",") ?? "",
      platform: (navigator as any).platform ?? "",
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory ?? null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      cookiesEnabled: navigator.cookieEnabled,
      touchPoints: navigator.maxTouchPoints,
      webglVendor: webgl.vendor,
      webglRenderer: webgl.renderer,
      canvasFingerprint: canvas,
      installedFonts: fonts,
      audioFingerprint: audio,
      plugins: this.getPlugins(),
    };
  }

  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(0, 0, 100, 50);
      ctx.fillStyle = "#069";
      ctx.fillText("CT Wallet", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Fingerprint", 4, 35);

      return canvas.toDataURL();
    } catch {
      return "";
    }
  }

  private async getAudioFingerprint(): Promise<string> {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const analyser = ctx.createAnalyser();
      oscillator.connect(analyser);
      oscillator.type = "triangle";
      oscillator.frequency.value = 0.1;
      oscillator.start(0);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const hash = Array.from(dataArray.slice(0, 20))
        .map((b) => b.toString(16))
        .join("");

      oscillator.stop();
      ctx.close();
      return hash;
    } catch {
      return "";
    }
  }

  private getWebGLInfo(): { vendor: string; renderer: string } {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") ||
        (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
      if (!gl) return { vendor: "", renderer: "" };

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (!debugInfo) return { vendor: "", renderer: "" };

      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) ?? "",
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? "",
      };
    } catch {
      return { vendor: "", renderer: "" };
    }
  }

  private getInstalledFonts(): string[] {
    const fonts = [
      "Arial", "Helvetica", "Times New Roman", "Courier New",
      "Verdana", "Georgia", "Palatino", "Garamond",
      "Comic Sans MS", "Trebuchet MS", "Impact", "Lucida Console",
      "Tahoma", "Segoe UI", "Roboto", "Open Sans",
    ];

    const available: string[] = [];
    const baseWidth = this.measureText("mmmmmmmmmmlli", "monospace", 72);

    for (const font of fonts) {
      const width = this.measureText("mmmmmmmmmmlli", `monospace, ${font}`, 72);
      if (width !== baseWidth) {
        available.push(font);
      }
    }

    return available;
  }

  private measureText(text: string, font: string, size: number): number {
    const el = document.createElement("span");
    el.textContent = text;
    el.style.font = `${size}px ${font}`;
    el.style.position = "absolute";
    el.style.visibility = "hidden";
    document.body.appendChild(el);
    const width = el.offsetWidth;
    document.body.removeChild(el);
    return width;
  }

  private getPlugins(): string {
    try {
      const pluginNames: string[] = [];
      for (let i = 0; i < navigator.plugins.length; i++) {
        pluginNames.push(navigator.plugins[i].name);
      }
      return pluginNames.join(",");
    } catch {
      return "";
    }
  }

  private async hashComponents(components: FingerprintComponents): Promise<string> {
    const raw = Object.values(components).join("|||");
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async checkConsistency(
    currentFingerprint: string,
    storedFingerprint?: string
  ): Promise<boolean> {
    if (!storedFingerprint) return true;
    return currentFingerprint === storedFingerprint;
  }

  getDeviceSummary(): string {
    const os = this.getOS();
    const browser = this.getBrowser();
    return `${os} - ${browser} - ${screen.width}x${screen.height}`;
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac OS")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iOS") || ua.includes("iPhone")) return "iOS";
    return "Unknown";
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Edg")) return "Edge";
    return "Unknown";
  }
}

export { FingerprintManager };
export type { FingerprintComponents };
