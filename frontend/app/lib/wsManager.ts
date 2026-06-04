/**
 * WebSocket Singleton Manager
 * Single connection — sab hooks isko share karte hain
 */

type Listener = (data: Record<string, unknown>) => void;

class WSManager {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private url = "";
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(url: string) {
    if (this.url === url &&
        this.ws &&
        (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.url = url;
    this._createWS(url);
  }

  private _createWS(url: string) {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
      // start ping
      if (!this.pingTimer) {
        this.pingTimer = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
      }
    };

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as Record<string, unknown>;
        this.listeners.forEach((l) => l(data));
      } catch {
        // ignore bad JSON
      }
    };

    this.ws.onclose = () => {
      if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
      if (!this.url) return;
      // auto reconnect
      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          if (this.url) this._createWS(this.url);
        }, 1500);
      }
    };

    this.ws.onerror = () => this.ws?.close();
  }

  send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /** Subscribe to incoming messages. Returns unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isOpen() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect() {
    this.url = "";
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.ws?.close();
    this.ws = null;
  }
}

export const wsManager = new WSManager();
