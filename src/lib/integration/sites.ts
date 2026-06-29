export interface SiteConfig {
  hostname: string;
  name: string;
  selector: string;
  priceSelector: string;
  category: string;
  logo?: string;
}

export const SITES: Record<string, SiteConfig> = {
  "mercadolibre.com.mx": {
    hostname: "mercadolibre.com.mx",
    name: "Mercado Libre",
    selector: ".andes-form-control__field",
    priceSelector: ".andes-money-amount__fraction",
    category: "Compras",
  },
  "mercadolibre.com": {
    hostname: "mercadolibre.com",
    name: "Mercado Libre",
    selector: ".andes-form-control__field",
    priceSelector: ".andes-money-amount__fraction",
    category: "Compras",
  },
  "paypal.com": {
    hostname: "paypal.com",
    name: "PayPal",
    selector: "#payment-form",
    priceSelector: ".totalAmount",
    category: "Pagos",
  },
  "amazon.com.mx": {
    hostname: "amazon.com.mx",
    name: "Amazon México",
    selector: "#buy-now-button",
    priceSelector: ".a-price-whole",
    category: "Compras",
  },
  "amazon.com": {
    hostname: "amazon.com",
    name: "Amazon",
    selector: "#buy-now-button",
    priceSelector: ".a-price-whole",
    category: "Compras",
  },
  "shein.com.mx": {
    hostname: "shein.com.mx",
    name: "Shein",
    selector: ".product-price",
    priceSelector: ".product-price__current",
    category: "Moda",
  },
  "shein.com": {
    hostname: "shein.com",
    name: "Shein",
    selector: ".product-price",
    priceSelector: ".product-price__current",
    category: "Moda",
  },
  "liverpool.com.mx": {
    hostname: "liverpool.com.mx",
    name: "Liverpool",
    selector: ".add-to-cart-button",
    priceSelector: ".product-price",
    category: "Compras",
  },
  "walmart.com.mx": {
    hostname: "walmart.com.mx",
    name: "Walmart",
    selector: ".add-to-cart",
    priceSelector: ".price",
    category: "Compras",
  },
  "uber.com": {
    hostname: "uber.com",
    name: "Uber",
    selector: ".payment-method",
    priceSelector: ".trip-fare",
    category: "Servicios",
  },
  "rappi.com.mx": {
    hostname: "rappi.com.mx",
    name: "Rappi",
    selector: ".payment-button",
    priceSelector: ".total-price",
    category: "Servicios",
  },
  "didi.mx": {
    hostname: "didi.mx",
    name: "Didi",
    selector: ".payment-btn",
    priceSelector: ".price-amount",
    category: "Servicios",
  },
};

export const SITE_LIST = Object.keys(SITES).reduce<SiteConfig[]>((acc, key) => {
  const site = SITES[key];
  const exists = acc.find((s) => s.name === site.name);
  if (!exists) acc.push(site);
  return acc;
}, []);

export function findSiteByHostname(hostname: string): SiteConfig | null {
  for (const key of Object.keys(SITES)) {
    if (hostname.includes(key)) return SITES[key];
  }
  return null;
}
