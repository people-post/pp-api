import {keys as Libp2pKeys} from '@libp2p/crypto';
import {peerIdFromPublicKey, peerIdFromString} from '@libp2p/peer-id';
import {ml_dsa44 as MlDsa44} from '@noble/post-quantum/ml-dsa.js';
import {CID} from 'multiformats';

type PeerId = ReturnType<typeof peerIdFromString>;

export default class Utilities {

  hasHost(): boolean {
    return (typeof window !== 'undefined') && window.location.host.length > 0;
  }

  isCid(s: string): boolean {
    try {
      CID.parse(s);
      return true;
    } catch (e) {
      return false;
    }
  }

  peerIdFromString(s: string): PeerId { return peerIdFromString(s); }
  peerIdFromPublicKey(k: Uint8Array): PeerId { return peerIdFromPublicKey(k as any); }

  async asEd25519KeyGen(seed: Uint8Array): Promise<any> {
    return await Libp2pKeys.generateKeyPairFromSeed("Ed25519", seed);
  }

  mlDsa44KeyGen(seed: Uint8Array): { publicKey: Uint8Array; secretKey: Uint8Array } { return MlDsa44.keygen(seed); }
  mlDsa44Sign(msg: Uint8Array, key: Uint8Array): Uint8Array {
    // msg is Uint8Array, key is secretKey of MlDsa44 key pair
    return MlDsa44.sign(msg, key);
  }
}
