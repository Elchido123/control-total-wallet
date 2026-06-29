import { SITES, SITE_LIST } from "@/lib/integration/sites";

export interface BookmarkletConfig {
  appUrl?: string;
  userId?: string;
  theme?: "dark" | "light";
}

export class BookmarkletSDK {
  private config: BookmarkletConfig;

  constructor(config: BookmarkletConfig) {
    this.config = { ...config };
    if (!this.config.appUrl) {
      this.config.appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://control-total-wallet.vercel.app";
    }
  }

  generateCode(): string {
    const appUrl = this.config.appUrl;
    const theme = this.config.theme ?? "dark";

    return `javascript:(function(){
  var s=document.createElement("script");
  s.src="${appUrl}/bookmarklet.js?theme=${theme}&v=2";
  document.body.appendChild(s);
})();`;
  }

  getSupportedSites() {
    return SITE_LIST.map((s) => ({
      id: s.hostname.replace(/\./g, "-"),
      name: s.name,
      url: `https://www.${s.hostname}`,
      category: s.category,
    }));
  }

  getInstructions(): string[] {
    return [
      "1. Abre los marcadores de tu navegador",
      "2. Arrastra el botón de abajo a la barra de marcadores",
      '3. Ve a cualquier tienda soportada y haz clic en el marcador "Pagar con CT Wallet"',
      "4. Aparecerá un botón flotante para pagar",
      "5. El pago se procesa de forma segura sin compartir tus datos",
    ];
  }

  static validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
}
