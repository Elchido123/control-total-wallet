"use client";

import {
  type PaymentResultMessage,
  type CleanupRequestMessage,
  type IframeMessage,
  type ParentMessage,
  CTW_ORIGIN,
  isValidOrigin,
} from "./protocol";

interface BridgeCallbacks {
  onPaymentResult?: (result: { success: boolean; transactionId?: number; error?: string }) => void;
  onCleanupRequest?: () => Promise<void>;
}

export function setupPaymentBridge(callbacks?: BridgeCallbacks) {
  const params = new URLSearchParams(window.location.search);
  const monto = params.get("monto") ?? "0";
  const site = params.get("site") ?? "";
  const siteName = params.get("siteName") ?? "";
  const returnUrl = params.get("url") ?? "";

  function postMessage(msg: IframeMessage) {
    const targetOrigin =
      returnUrl && isValidOrigin(new URL(returnUrl).origin)
        ? returnUrl
        : CTW_ORIGIN;
    parent.postMessage(msg, targetOrigin);
  }

  function handleParentMessage(e: MessageEvent<ParentMessage>) {
    if (!isValidOrigin(e.origin) && e.origin !== window.location.origin) return;

    switch (e.data.type) {
      case "CLEANUP_REQUEST":
        callbacks?.onCleanupRequest?.();
        postMessage({ type: "CLEANUP_DONE" });
        break;
      case "PING":
        postMessage({ type: "PONG" });
        break;
    }
  }

  window.addEventListener("message", handleParentMessage);

  function sendPaymentResult(success: boolean, transactionId?: number, error?: string) {
    const msg: PaymentResultMessage = {
      type: "PAYMENT_RESULT",
      success,
      transactionId,
      error,
    };
    postMessage(msg);
    callbacks?.onPaymentResult?.({ success, transactionId, error });
  }

  function cleanup() {
    window.removeEventListener("message", handleParentMessage);
  }

  return {
    monto,
    site,
    siteName,
    returnUrl,
    sendPaymentResult,
    cleanup,
    postMessage,
  };
}

export function setupParentBridge(callbacks?: {
  onPaymentResult?: (result: { success: boolean; transactionId?: number }) => void;
}) {
  function handleIframeMessage(e: MessageEvent<IframeMessage>) {
    if (e.origin !== CTW_ORIGIN) return;

    switch (e.data.type) {
      case "PAYMENT_RESULT":
        callbacks?.onPaymentResult?.(e.data);
        break;
      case "CLEANUP_DONE":
        break;
      case "PONG":
        break;
    }
  }

  window.addEventListener("message", handleIframeMessage);

  function requestCleanup() {
    const msg: CleanupRequestMessage = { type: "CLEANUP_REQUEST" };
    const iframe = document.querySelector("iframe");
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(msg, CTW_ORIGIN);
    }
  }

  function cleanup() {
    window.removeEventListener("message", handleIframeMessage);
  }

  return { requestCleanup, cleanup };
}

export { CTW_ORIGIN } from "./protocol";
