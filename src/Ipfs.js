import {ipns as createIpns} from '@helia/ipns';
import {createVerifiedFetch} from '@helia/verified-fetch';
import {http as createHttpService} from '@libp2p/http';
import {createHelia, libp2pDefaults} from 'helia';
import {CID} from 'multiformats';

export default class Ipfs {
  #helia;
  #ipns;
  #fcnVerifiedFetch;

  async asInit() {
    console.debug('Initializing...');

    console.debug('Http...');
    let d = libp2pDefaults();
    // delete d.services.dht;
    d.services.http =
        createHttpService(); //{fetch : (...args) => fetch(...args)});
    console.debug(d);

    console.debug('Helia...');
    this.#helia = await createHelia({libp2p : d});

    console.debug('IPNS...');
    this.#ipns = createIpns(this.#helia);

    console.debug('VerifiedFetch...');
    this.#fcnVerifiedFetch = await createVerifiedFetch(this.#helia);
    console.debug('Initialized');
  }

  async asResolve(key, options) {
    let r = await this.#ipns.resolve(key, options);
    return r.cid.toString();
  }

  async asFetch(resource, options) {
    return await this.#helia.libp2p.services.http.fetch(resource, options);
  }

  async asFetchCidJson(scid) {
    const cid = CID.parse(scid);
    const options = {signal : AbortSignal.timeout(20000)};
    const r = await this.#fcnVerifiedFetch(cid, options);
    let d = await r.json();
    return d;
  }

  async asFetchCidImage(scid) {
    const cid = CID.parse(scid);
    const r = await this.#fcnVerifiedFetch(
        cid, {signal : AbortSignal.timeout(20000)});
    let blob = await r.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob);
    });
  }

  async asStop() { await this.#helia.stop(); }
};
