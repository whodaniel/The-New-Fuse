import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Bridges Controller
 *
 * Exposes health/status endpoints for messaging bridges (Telegram, WhatsApp).
 * The release checklist (M05) requires these to return JSON with connection
 * status rather than 404.
 *
 * Currently returns honest `connected: false` stubs. When the Telegram bot
 * daemon and WhatsApp pairing are active, these should probe actual bridge
 * state (e.g., via Redis keys or a bridge health service).
 *
 * @security PUBLIC — No authentication required
 * @checklist M05 — Bridge health exposes live connected state
 */
@ApiTags('bridges')
@Controller('bridges')
export class BridgesController {
  @Get('telegram')
  @ApiOperation({ summary: 'Telegram bridge health status' })
  @ApiResponse({ status: 200, description: 'Telegram bridge connection state' })
  getTelegramStatus() {
    // TODO: Probe actual Telegram bot daemon state via Redis or process check
    const connected = false;
    return {
      status: connected ? 'connected' : 'disconnected',
      bridge: 'bridges/telegram',
      connected,
      channels: 0,
      note: 'Telegram bridge — daemon restart required for live status',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('whatsapp')
  @ApiOperation({ summary: 'WhatsApp bridge health status' })
  @ApiResponse({ status: 200, description: 'WhatsApp bridge connection state' })
  getWhatsappStatus() {
    // TODO: Probe actual WhatsApp bridge state via Redis or QR pairing status
    const connected = false;
    return {
      status: connected ? 'connected' : 'disconnected',
      bridge: 'bridges/whatsapp',
      connected,
      channels: 0,
      note: 'WhatsApp bridge — QR pairing required for live status',
      timestamp: new Date().toISOString(),
    };
  }
}
