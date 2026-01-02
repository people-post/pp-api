import {ipns as createIpns} from '@helia/ipns';
import {createVerifiedFetch} from '@helia/verified-fetch';
import {http as createHttpService} from '@libp2p/http';
import {createHelia, libp2pDefaults, Helia} from 'helia';
import {CID} from 'multiformats';

type VerifiedFetch = (cid: CID, options?: { signal?: AbortSignal }) => Promise<Response>;
type IPNS = ReturnType<typeof createIpns>;

export default class Ipfs {
  #helia: Helia | null = null;
  #ipns: IPNS | null = null;
  #fcnVerifiedFetch: VerifiedFetch | null = null;

  async asInit(): Promise<void> {
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
    this.#ipns = createIpns(this.#helia as any);

    console.debug('VerifiedFetch...');
    this.#fcnVerifiedFetch = await createVerifiedFetch(this.#helia);
    console.debug('Initialized');
  }

  async asResolve(key: string | Uint8Array, options?: any): Promise<string> {
    if (!this.#ipns) throw new Error('IPNS not initialized');
    let r = await this.#ipns.resolve(key as any, options);
    return r.cid.toString();
  }

  async asFetch(resource: string | Request, options?: RequestInit): Promise<Response> {
    if (!this.#helia) throw new Error('Helia not initialized');
    const httpService = this.#helia.libp2p.services.http as any;
    return await httpService.fetch(resource, options);
  }

  async asFetchCidJson(scid: string): Promise<any> {
    if (!this.#fcnVerifiedFetch) throw new Error('VerifiedFetch not initialized');
    const cid = CID.parse(scid);
    const options = {signal : AbortSignal.timeout(20000)};
    const r = await this.#fcnVerifiedFetch(cid, options);
    let d: any = await r.json();
    return d;
  }

  async asFetchCidImage(scid: string): Promise<string> {
    if (!this.#fcnVerifiedFetch) throw new Error('VerifiedFetch not initialized');
    const cid = CID.parse(scid);
    const r = await this.#fcnVerifiedFetch(
        cid, {signal : AbortSignal.timeout(20000)});
    let blob = await r.blob();
    
    // Browser environment - use FileReader
    if (typeof FileReader !== 'undefined') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob);
      });
    }
    
    // Node.js environment - convert blob to base64 data URL
    // Use Uint8Array and btoa-like conversion for universal compatibility
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // Use global Buffer if available (Node.js), otherwise use btoa (browser)
    let base64: string;
    if (typeof Buffer !== 'undefined') {
      base64 = Buffer.from(arrayBuffer).toString('base64');
    } else if (typeof btoa !== 'undefined') {
      base64 = btoa(binary);
    } else {
      throw new Error('No base64 encoding method available');
    }
    const mimeType = blob.type || 'image/png';
    return `data:${mimeType};base64,${base64}`;
  }

  async asStop(): Promise<void> { 
    if (!this.#helia) throw new Error('Helia not initialized');
    await this.#helia.stop(); 
  }
}
