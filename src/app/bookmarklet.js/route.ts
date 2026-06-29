import { NextResponse } from "next/server";

const BOOKMARKLET_JS = `(function () {
  "use strict";

  var SITES = {
    "mercadolibre.com.mx": { selector: ".andes-form-control__field", priceSelector: ".andes-money-amount__fraction", name: "Mercado Libre" },
    "mercadolibre.com": { selector: ".andes-form-control__field", priceSelector: ".andes-money-amount__fraction", name: "Mercado Libre" },
    "paypal.com": { selector: "#payment-form", priceSelector: ".totalAmount", name: "PayPal" },
    "amazon.com.mx": { selector: "#buy-now-button", priceSelector: ".a-price-whole", name: "Amazon México" },
    "amazon.com": { selector: "#buy-now-button", priceSelector: ".a-price-whole", name: "Amazon" },
    "shein.com.mx": { selector: ".product-price", priceSelector: ".product-price__current", name: "Shein" },
    "shein.com": { selector: ".product-price", priceSelector: ".product-price__current", name: "Shein" },
    "liverpool.com.mx": { selector: ".add-to-cart-button", priceSelector: ".product-price", name: "Liverpool" },
    "walmart.com.mx": { selector: ".add-to-cart", priceSelector: ".price", name: "Walmart" },
    "uber.com": { selector: ".payment-method", priceSelector: ".trip-fare", name: "Uber" },
    "didiglobal.com": { selector: ".payment-btn", priceSelector: ".price-amount", name: "Didi" },
    "didi.mx": { selector: ".payment-btn", priceSelector: ".price-amount", name: "Didi" },
    "rappi.com.mx": { selector: ".payment-button", priceSelector: ".total-price", name: "Rappi" },
    "rappi.com": { selector: ".payment-button", priceSelector: ".total-price", name: "Rappi" },
  };

  var siteKey = Object.keys(SITES).find(function (s) {
    return window.location.hostname.indexOf(s) !== -1;
  });
  if (!siteKey) {
    alert("Sitio no soportado por Control Total Wallet\\nSoportados: " + Object.keys(SITES).filter(function (k) { return k.split(".").length === 3; }).map(function (k) { return k.charAt(0).toUpperCase() + k.slice(1).split(".")[0]; }).join(", "));
    return;
  }

  var site = SITES[siteKey];
  var existingBtn = document.getElementById("ctw-pay-btn");
  if (existingBtn) return;

  var btn = document.createElement("button");
  btn.id = "ctw-pay-btn";
  btn.innerHTML = "💳 Pagar con CT Wallet";
  btn.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:999999;background:linear-gradient(135deg,#00D2FF,#3A7BD5);color:white;border:none;padding:14px 24px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,0.3);transition:transform 0.2s ease;font-family:sans-serif;";

  btn.onmouseenter = function () { btn.style.transform = "scale(1.05)"; };
  btn.onmouseleave = function () { btn.style.transform = "scale(1)"; };

  var priceEl = document.querySelector(site.priceSelector);
  var monto = priceEl ? priceEl.textContent.replace(/[^0-9.]/g, "") : "0";

  var badge = document.createElement("span");
  badge.textContent = "$" + monto;
  badge.style.cssText = "display:inline-block;background:rgba(255,255,255,0.2);border-radius:6px;padding:2px 8px;margin-left:8px;font-size:12px;";
  btn.appendChild(badge);

  var CTW_ORIGIN = "__CTW_ORIGIN__";

  btn.onclick = async function () {
    var iframe = document.createElement("iframe");
    iframe.src = CTW_ORIGIN + "/pay?monto=" + monto + "&site=" + encodeURIComponent(siteKey) + "&siteName=" + encodeURIComponent(site.name) + "&url=" + encodeURIComponent(window.location.href);
    iframe.style.cssText = "position:fixed;inset:0;z-index:9999999;width:100vw;height:100vh;border:none;background:rgba(0,0,0,0.7);";
    document.body.appendChild(iframe);

    var msgTimeout = setTimeout(function () {
      if (iframe.parentNode) { iframe.remove(); window.removeEventListener("message", handleMessage); }
    }, 120000);

    function handleMessage(e) {
      if (e.origin !== CTW_ORIGIN) return;
      if (e.data.type === "PAYMENT_RESULT") {
        clearTimeout(msgTimeout);
        iframe.remove();
        window.removeEventListener("message", handleMessage);
        alert(e.data.success ? "✅ Pago exitoso - Control Total Wallet" : "❌ Pago rechazado - Control Total Wallet");
      }
    }
    window.addEventListener("message", handleMessage);
    window.addEventListener("pagehide", function () {
      clearTimeout(msgTimeout);
      window.removeEventListener("message", handleMessage);
      if (iframe.parentNode) iframe.remove();
    });
  };

  document.body.appendChild(btn);
  console.log("[CT Wallet] Bookmarklet injected for " + site.name);
})();`;

export async function GET(_req: Request) {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? `https://${new URL(_req.url).host}`;
  const code = BOOKMARKLET_JS.replace(/__CTW_ORIGIN__/g, origin);

  return new NextResponse(code, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
