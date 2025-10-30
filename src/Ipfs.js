import {createVerifiedFetch} from '@helia/verified-fetch';
import {CID} from 'multiformats';

export default class Ipfs {
  #vFetch;

  async asSetHelia(helia) { this.#vFetch = await createVerifiedFetch(helia); }

  async asFetchCidJson(scid) {
    const cid = CID.parse(scid);
    const r = await this.#vFetch(cid, {signal : AbortSignal.timeout(20000)});
    return await r.json()
  }

  async asFetchCidImage(scid) {
    const cid = CID.parse(scid);
    const r = await this.#vFetch(cid, {signal : AbortSignal.timeout(20000)});
    let blob = await r.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob);
    });
  }
};
