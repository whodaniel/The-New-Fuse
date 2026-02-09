# WebSocket Compression in The New Fuse

The New Fuse supports WebSocket message compression to reduce bandwidth usage and improve performance, especially for large messages exchanged between the VS Code extension and Chrome extension.

## Overview

WebSocket compression uses the [permessage-deflate extension](https://tools.ietf.org/html/rfc7692) to compress WebSocket messages. This can significantly reduce the size of messages, especially for text-based data like JSON, which is commonly used in The New Fuse.

## Configuration

WebSocket compression can be configured through VS Code settings:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "The New Fuse"
3. Find the WebSocket compression settings:

| Setting | Description | Default |
|---------|-------------|---------|
| `thefuse.enableWebSocketCompression` | Enable WebSocket message compression | `false` |
| `thefuse.webSocketCompressionThreshold` | Minimum message size (in bytes) for compression | `1024` |
| `thefuse.webSocketCompressionLevel` | Compression level (1-9, where 1 is fastest and 9 is most compressed) | `3` |
| `thefuse.webSocketCompressionMemLevel` | Memory level for compression (1-9, where 1 uses least memory) | `8` |
| `thefuse.webSocketClientNoContextTakeover` | Disable context takeover on client side | `false` |
| `thefuse.webSocketServerNoContextTakeover` | Disable context takeover on server side | `false` |

## Commands

The New Fuse provides commands to manage WebSocket compression:

- **Toggle WebSocket Compression**: Enable or disable WebSocket compression (Command Palette: `The New Fuse: Toggle WebSocket Compression`)
- **Show Connected Chrome Extension Clients**: View connected clients and compression status (Command Palette: `The New Fuse: Show Connected Chrome Extension Clients`)

## Performance Considerations

WebSocket compression can significantly reduce bandwidth usage, but it comes with some trade-offs:

- **CPU Usage**: Compression and decompression require additional CPU resources
- **Memory Usage**: The compression algorithm uses memory to maintain compression context
- **Latency**: For very small messages, the overhead of compression might outweigh the benefits

For optimal performance:

- Enable compression when bandwidth is limited or when exchanging large messages
- Set an appropriate threshold to avoid compressing small messages
- Use a lower compression level (1-3) for faster compression with reasonable size reduction
- Use a higher compression level (7-9) when bandwidth is very limited and CPU resources are available

## Chrome Extension Support

The Chrome extension automatically detects if the VS Code extension has compression enabled and will use it accordingly. You can configure compression settings in the Chrome extension options page:

1. Click on The New Fuse icon in Chrome
2. Select "Options"
3. Go to the "WebSocket Compression" section
4. Enable or disable compression

## Troubleshooting

If you experience issues with WebSocket compression:

1. Disable compression to see if the issue persists
2. Check the VS Code output panel (View > Output > The New Fuse) for compression-related logs
3. Try different compression settings to find the optimal balance for your environment
4. Restart the WebSocket server after changing compression settings (Command Palette: `The New Fuse: Restart Chrome WebSocket Server`)

## Technical Details

The New Fuse uses the [ws](https://github.com/websockets/ws) library's built-in support for the permessage-deflate extension. The implementation follows the [RFC 7692](https://tools.ietf.org/html/rfc7692) specification for WebSocket compression.

The compression is applied at the WebSocket frame level, so it's transparent to the application code. Messages are automatically compressed when sent and decompressed when received.
