import Ipfs from './Ipfs.js';
import Utilities from './Utilities.js';

export const sys = {
  ipfs : new Ipfs(),
  utl : new Utilities()
};

export async function asInit() { await sys.ipfs.asInit(); };
