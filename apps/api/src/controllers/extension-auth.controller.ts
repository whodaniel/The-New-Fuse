import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('auth/extension')
export class ExtensionAuthController {
  /**
   * 1. The Chrome Extension calls `chrome.identity.launchWebAuthFlow` pointing to this route.
   */
  @Get('login')
  async extensionLogin(@Req() req: Request, @Res() res: Response) {
    const extensionId = req.query.extension_id; // e.g., 'abcdefghijklmnop'

    // In a real flow, you would redirect the user to your actual frontend login page,
    // passing the extensionId in the query parameters so the frontend knows where to redirect
    // back to once login is successful.
    // res.redirect(`https://thenewfuse.com/login?redirect_to_extension=${extensionId}`);

    res.send(`Please log in to The New Fuse... (simulated frontend)`);
  }

  /**
   * 2. After the user logs in successfully, your frontend or backend hits this callback.
   * We assume the user is authenticated here (add your @UseGuards() decorators).
   */
  @Get('callback')
  async extensionCallback(@Req() req: Request, @Res() res: Response) {
    const extensionId = req.query.extension_id;

    // Retrieve the user's JWT token (e.g., from req.user or cookies)
    const token = 'SIMULATED_JWT_TOKEN_123';
    const isPro = true; // Query DB to check if they have the Pro license

    // 3. Redirect back to the Chrome Extension using its special Chromium URL protocol.
    // The extension's launchWebAuthFlow promise will resolve with this URL,
    // allowing the extension to extract the token!
    const redirectUrl = `https://${extensionId}.chromiumapp.org/?token=${token}&pro=${isPro}`;

    res.redirect(redirectUrl);
  }
}
