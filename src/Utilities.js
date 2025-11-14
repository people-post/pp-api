import {keys} from '@libp2p/crypto';
import {peerIdFromPublicKey, peerIdFromString} from '@libp2p/peer-id';
import {CID} from 'multiformats';

export default class Utilities {

  hasHost() { return window.location.host.length > 0; }

  isCid(s) {
    try {
      CID.parse(s);
      return true;
    } catch (e) {
      return false;
    }
  }

  peerIdFromString(s) { return peerIdFromString(s); }
  peerIdFromPublicKey(k) { return peerIdFromPublicKey(k); }

  async asGenerateKeyPairFromSeed(type, seed) {
    return await keys.generateKeyPairFromSeed(type, seed);
  }
};
