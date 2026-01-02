import {multiaddr as parseMultiAddr, Multiaddr} from '@multiformats/multiaddr';

import {sys} from './Global.js';

interface HostInfo {
  peer_id: string;
  register?: {
    is_enabled: boolean;
    type: string;
  };
}

export default class RemoteServer {
  static T_REGISTER = {
    PEER : "PEER", // Synced with backend
    GROUP: "GROUP" // Synced with backend
  } as const;

  #hostInfo: HostInfo | null = null;
  #multiAddr: Multiaddr | null = null;

  isRegisterEnabled(): boolean {
    return this.#hostInfo?.register?.is_enabled ?? false;
  }

  getName(): string { return this.#multiAddr?.toString() ?? ''; }
  getAddress(): string { return this.#multiAddr?.toString() ?? ''; }
  getPeerId(): string | null { return this.#hostInfo?.peer_id ?? null; }
  getRegisterType(): string | null {
    return this.#hostInfo?.register?.type ?? null;
  }

  getApiUrl(path: string): string {
    if (!this.#multiAddr) throw new Error('Server not initialized');
    let s = this.#multiAddr.toString() + "/http-path/";
    if (path.startsWith('/')) {
      return s + encodeURIComponent(path.slice(1));
    }
    return s + encodeURIComponent(path);
  }

  async asInit(sAddr?: string): Promise<boolean> {
    this.#multiAddr = this.#parseAddressOrUseHost(sAddr);
    this.#hostInfo = await this.#asFetchHostInfo();
    return !!this.#hostInfo;
  }

  #getLocationMultiAddr(): string {
    // Browser environment
    if (typeof window !== 'undefined' && window.location) {
      const name = window.location.hostname;
      let port = window.location.port;
      if (port.length < 1) {
        if (window.location.protocol == 'https') {
          port = '443';
        } else {
          port = '80';
        }
      }
      return '/dns4/' + name + '/tcp/' + port;
    }
    // Node.js environment - use localhost as fallback
    // In Node.js, the address should typically be provided explicitly
    return '/dns4/localhost/tcp/80';
  }

  #parseAddressOrUseHost(sAddr?: string): Multiaddr {
    let s = sAddr;
    if (!s && sys.utl.hasHost()) {
      s = this.#getLocationMultiAddr();
    }
    if (!s) throw new Error('No address provided and cannot use host');
    return parseMultiAddr(s);
  }

  async #asFetchHostInfo(): Promise<HostInfo | null> {
    if (!this.#multiAddr) throw new Error('Server not initialized');
    const url = this.getApiUrl("/api/host/info");
    let res: Response;
    try {
      const options = {method : "GET", signal : AbortSignal.timeout(5000)};
      res = await sys.ipfs.asFetch(url, options);
    } catch (e: any) {
      console.error("Failed to contact server:", e.message);
      return null;
    }
    let d: any = await res.json();
    if (d.error) {
      console.error("Error in server", d.error);
      return null;
    }
    return d.data.info;
  }
}
