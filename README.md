# pp-api
APIs used by pp-app. Open to third parties for alternative app developments.

## Environment Support

This library supports both **browser** and **Node.js** environments. The code automatically detects the runtime environment and adapts accordingly.

### Remote server (PeerId)

The remote server is configured by **PeerId**: call `RemoteServer.asInit(peerIdString)` with the server's libp2p PeerId (e.g. from config or env). All requests then use libp2p dialing by identity; no host/port or multiaddr is required from the user. The libp2p node (Helia) must be able to reach that peer (e.g. bootstrap list, DHT, or multiaddrs configured elsewhere).

### Browser Usage

The library can be used directly in browser environments. When running in a browser:
- `Ipfs.asFetchCidImage()` uses the browser's `FileReader` API
- All browser-compatible APIs are used automatically

### Node.js Usage

The library also works in Node.js environments. When running in Node.js:
- `Ipfs.asFetchCidImage()` converts blobs to base64 data URLs using Node.js-compatible methods
- All Node.js-compatible APIs are used automatically

### Building

```bash
# Type check
npm run type-check

# Build TypeScript to JavaScript
npm run build

# Create browser bundle
npm run bundle

# Create minified browser bundle
npm run package
```
