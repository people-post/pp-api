import {multiaddr as parseMultiAddr} from '@multiformats/multiaddr';

import {sys} from './Global.js';

export default class RemoteServer {
  static T_REGISTER = {
    PEER : "PEER", // Synced with backend
    GROUP: "GROUP" // Synced with backend
  };

  #hostInfo = null;
  #multiAddr = null;

  isRegisterEnabled() {
    return this.#hostInfo.register && this.#hostInfo.register.is_enabled;
  }

  getName() { return this.#multiAddr.toString(); }
  getAddress() { return this.#multiAddr.toString(); }
  getPeerId() { return this.#hostInfo.peer_id; }
  getRegisterType() {
    return this.#hostInfo.register ? this.#hostInfo.register.type : null;
  }

  getApiUrl(path) {
    let s = this.#multiAddr.toString() + "/http-path/";
    if (path.startsWith('/')) {
      return s + encodeURIComponent(path.slice(1));
    }
    return s + encodeURIComponent(path);
  }

  async asInit(sAddr) {
    this.#multiAddr = this.#parseAddressOrUseHost(sAddr);
    this.#hostInfo = await this.#asFetchHostInfo();
    return !!this.#hostInfo;
  }

  #getLocationMultiAddr() {
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

  #parseAddressOrUseHost(sAddr) {
    let s = sAddr;
    if (!s && sys.utl.hasHost()) {
      s = this.#getLocationMultiAddr();
    }
    return parseMultiAddr(s);
  }

  async #asFetchHostInfo() {
    const url = this.getApiUrl("/api/host/info");
    let res;
    try {
      const options = {method : "GET", signal : AbortSignal.timeout(5000)};
      res = await sys.ipfs.asFetch(url, options);
    } catch (e) {
      console.error("Failed to contact server:", e.message);
      return null;
    }
    let d = await res.json();
    if (d.error) {
      console.error("Error in server", d.error);
      return null;
    }
    return d.data.info;
  }
};
