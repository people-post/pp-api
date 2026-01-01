import Ipfs from './Ipfs.js';
import Utilities from './Utilities.js';

export const sys = {
  ipfs : new Ipfs(),
  utl : new Utilities()
};

export async function asInit(): Promise<void> { await sys.ipfs.asInit(); }
