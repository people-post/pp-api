import assert from 'node:assert';
import {test} from 'node:test';

import OArticle from './datatypes/OArticle.js';
import OAttachmentMeta from './datatypes/OAttachmentMeta.js';
import Owner from './Owner.js';
import type { UserProps } from './User.js';
import StorageAgent from './StorageAgent.js';
import PublisherAgent from './PublisherAgent.js';

test.describe('Owner test', () => {
  test.it('Posting', async (t) => {
    const mockCallbacks = {
      onWeb3OwnerRequestLoadCheckPoint: (_owner: unknown) => null,
      onWeb3OwnerRequestSign: async (_owner: unknown, msg: string) => msg,
      onWeb3OwnerRequestSaveCheckPoint: (_owner: unknown, _data: string) => {},
    };

    (t.mock.method as any)(mockCallbacks, 'onWeb3OwnerRequestLoadCheckPoint');
    (t.mock.method as any)(mockCallbacks, 'onWeb3OwnerRequestSign');
    (t.mock.method as any)(mockCallbacks, 'onWeb3OwnerRequestSaveCheckPoint');

    let mockStorage: StorageAgent = {
      async asUploadJson(_msg, _id, _sig) { return 'mock-cid'; },
      async asPin(_msg, _id, _sig) {}
    } as StorageAgent;
    let mockPublisher: PublisherAgent = {
      async asPublish(_cid, _bearerId, _sig) { return ''; }
    } as PublisherAgent;

    (t.mock.method as any)(mockStorage, 'asUploadJson');
    (t.mock.method as any)(mockStorage, 'asPin');
    (t.mock.method as any)(mockPublisher, 'asPublish');

    const props: UserProps = {
      callbacks: mockCallbacks,
    };

    let owner = new Owner({});
    owner.setProps(props);
    owner.setStorage(mockStorage);
    owner.setPublishers([ mockPublisher ]);

    let oArticle = new OArticle();
    let oMeta = new OAttachmentMeta();
    oMeta.setCid("cid");
    oMeta.setName("test");
    oMeta.setType("pdf");
    oArticle.setAttachments([ oMeta ]);

    await owner.asPublishArticle(oArticle);
    assert.strictEqual(
        (mockCallbacks.onWeb3OwnerRequestLoadCheckPoint as any).mock?.callCount(), 0);
    assert.strictEqual(
        (mockCallbacks.onWeb3OwnerRequestSign as any).mock?.callCount(), 5);
    assert.strictEqual(
        (mockCallbacks.onWeb3OwnerRequestSaveCheckPoint as any).mock?.callCount(), 1);
    assert.strictEqual(
        mockStorage.asUploadJson && 
        (mockStorage.asUploadJson as any).mock?.callCount(), 3);
    assert.strictEqual(
        mockStorage.asPin && 
        (mockStorage.asPin as any).mock?.callCount(), 1);
    assert.strictEqual(
        mockPublisher.asPublish && 
        (mockPublisher.asPublish as any).mock?.callCount(), 1);
  });
});
