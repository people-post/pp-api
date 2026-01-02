# pp-api
APIs used by pp-app. Open to third parties for alternative app developments.

## Environment Support

This library supports both **browser** and **Node.js** environments. The code automatically detects the runtime environment and adapts accordingly.

### Browser Usage

The library can be used directly in browser environments. When running in a browser:
- `RemoteServer` will automatically detect the current host from `window.location`
- `Ipfs.asFetchCidImage()` uses the browser's `FileReader` API
- All browser-compatible APIs are used automatically

### Node.js Usage

The library also works in Node.js environments. When running in Node.js:
- `RemoteServer` requires an explicit address to be provided (cannot auto-detect from `window.location`)
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
