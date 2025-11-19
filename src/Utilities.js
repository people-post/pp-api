import {keys as Libp2pKeys} from '@libp2p/crypto';
import {peerIdFromPublicKey, peerIdFromString} from '@libp2p/peer-id';
import {ml_dsa44 as MlDsa44} from '@noble/post-quantum/ml-dsa.js';
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

  async asEd25519KeyGen(seed) {
    return await Libp2pKeys.generateKeyPairFromSeed("Ed25519", seed);
  }

  mlDsa44KeyGen(seed) { return MlDsa44.keygen(seed); }
  mlDsa44Sign(msg, key) {
    // msg is Uint8Array, key is secretKey of MlDsa44 key pair
    return MlDsa44.sign(msg, key);
  }
};
