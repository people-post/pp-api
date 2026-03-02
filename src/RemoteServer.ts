import {peerIdFromString} from '@libp2p/peer-id';
import {multiaddr} from '@multiformats/multiaddr';

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
  #peerId: string | null = null;

  isRegisterEnabled(): boolean {
    return this.#hostInfo?.register?.is_enabled ?? false;
  }

  getName(): string { return this.#peerId ?? ''; }
  getAddress(): string { return this.#peerId ?? ''; }
  getPeerId(): string | null { return this.#peerId; }
  getRegisterType(): string | null {
    return this.#hostInfo?.register?.type ?? null;
  }

  getApiUrl(path: string): string {
    if (!this.#peerId) throw new Error('Server not initialized');
    const pathPart = path.startsWith('/') ? path.slice(1) : path;
    const ma = multiaddr(`/p2p/${this.#peerId}`).encapsulate(
      `/http-path/${encodeURIComponent(pathPart)}`
    );
    return ma.toString();
  }

  async asInit(peerId: string): Promise<boolean> {
    if (!peerId || peerId.trim().length === 0) {
      throw new Error('Server PeerId is required');
    }
    peerIdFromString(peerId.trim()); // validate
    this.#peerId = peerId.trim();
    this.#hostInfo = await this.#asFetchHostInfo();
    return !!this.#hostInfo;
  }

  async #asFetchHostInfo(): Promise<HostInfo | null> {
    if (!this.#peerId) throw new Error('Server not initialized');
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
