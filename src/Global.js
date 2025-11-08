import Ipfs from './Ipfs.js';

export const sys = {
  ipfs : new Ipfs()
};

export async function asInit() { await sys.ipfs.asInit(); };
