import {test} from 'node:test';

import Ipfs from './Ipfs.js';

test.describe('Ipfs test', () => {
  test.it('Init', async () => {
    let ipfs = new Ipfs();
    await ipfs.asInit();
    await ipfs.asStop();
  });
});
