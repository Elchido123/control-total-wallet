export const CTW_ORIGIN = "https://control-total-wallet.vercel.app";

export interface PaymentInitMessage {
  type: "PAYMENT_INIT";
  monto: string;
  site: string;
  siteName: string;
  returnUrl: string;
  productTitle?: string;
}

export interface CleanupRequestMessage {
  type: "CLEANUP_REQUEST";
}

export interface CleanupDoneMessage {
  type: "CLEANUP_DONE";
}

export interface PaymentResultMessage {
  type: "PAYMENT_RESULT";
  success: boolean;
  transactionId?: number;
  error?: string;
}

export interface PingMessage {
  type: "PING";
}

export interface PongMessage {
  type: "PONG";
}

export type ParentMessage =
  | CleanupRequestMessage
  | PingMessage
  | PaymentInitMessage;

export type IframeMessage =
  | PaymentResultMessage
  | CleanupDoneMessage
  | PongMessage;

export function isValidOrigin(origin: string): boolean {
  return origin === CTW_ORIGIN || origin === window.location.origin;
}
