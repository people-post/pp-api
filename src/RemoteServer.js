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

  getName() { return this.#getHostAddr(this.#multiAddr); }
  getAddress() { return this.#getHostAddr(this.#multiAddr); }
  getPeerId() { return this.#hostInfo.peer_id; }
  getRegisterType() {
    return this.#hostInfo.register ? this.#hostInfo.register.type : null;
  }

  getApiAddr(path) {
    return this.#multiAddr.toString() + encodeURIComponent(path);
  }

  getApiUrl(path) {
    return this.#multiAddr ? this.#getHostAddr(this.#multiAddr) + path : null;
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

  #getHostAddr(ma) {
    let protocol = "http";
    let hostname;
    let port;
    for (let c of ma.getComponents()) {
      switch (c.name) {
      case "https":
        protocol = "https";
        break;
      case "ip4":
        hostname = c.value;
        break;
      case "ip6":
        hostname = "[" + c.value + "]";
        break;
      case "tcp":
        port = c.value;
        break;
      default:
        break;
      }
    }
    return protocol + "://" + hostname + ":" + port;
  }

  #parseAddressOrUseHost(sAddr) {
    let s = sAddr;
    if (!s && sys.utl.hasHost()) {
      s = this.#getLocationMultiAddr();
    }
    return parseMultiAddr(s);
  }

  async #asFetchHostInfo() {
    if (!this.#multiAddr) {
      return null;
    }

    const url = this.getApiUrl("/api/host/info");
    let res;
    try {
      const options = {method : "GET", signal : AbortSignal.timeout(5000)};
      res = await this.#asP2pFetch(url, options);
    } catch (e) {
      console.error("Failed to contact server", e.message);
      return null;
    }
    let d = await res.json();
    if (d.error) {
      console.error("Error in server", d.error);
      return null;
    }
    return d.data.info;
  }

  async #asP2pFetch(req, options) {
    return await sys.ipfs.asFetch(req, options);
  }
};
