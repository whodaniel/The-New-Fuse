# Fixing Google Sign-In (Redirect URI Mismatch)

You are seeing the `Error 400: redirect_uri_mismatch` because you are running
the extension locally (unpacked), which limits how Google verifies your
identity.

To fix this, you need to tell Google to trust your specific local extension
installation.

## Step 1: Find your Extension ID

1. Open Chrome and go to `chrome://extensions`.
2. Find **AI Video Intelligence Suite**.
3. Copy the **ID** (it will be a long string of random letters, e.g.,
   `abcdefghijklmnop...`).

## Step 2: Configure Google Cloud Console

1. Go to the
   [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Find the OAuth 2.0 Client ID that matches the one in your `manifest.json`:
   - Client ID:
     `998509408180-k62olkpaolebn62dvm386nrq6gicuour.apps.googleusercontent.com`
3. Click the **Edit** (pencil) icon for that credential.

### If it is a "Web Application" Client ID:

1. Scroll down to **Authorized redirect URIs**.
2. Click **Add URI**.
3. Paste the following URL (replace `<YOUR_ID>` with the ID you copied in Step
   1):
   ```
   https://<YOUR_ID>.chromiumapp.org/
   ```
4. Click **Save**.

### If it is a "Chrome App" Client ID:

_Note: Chrome App credentials do NOT support custom redirect URIs. You must use
a Web Application credential for local development fallback._

1. Click **Create Credentials** > **OAuth client ID**.
2. Select Application type: **Web application**.
3. Name it "Local Dev Extension".
4. Under **Authorized redirect URIs**, add:
   ```
   https://<YOUR_ID>.chromiumapp.org/
   ```
5. Click **Create**.
6. Copy the **Client ID**.
7. Update your `manifest.json` file: Replace the `client_id` under `oauth2` with
   this new Client ID.
8. Reload the extension in `chrome://extensions`.

## Step 3: Retry Sign-In

1. Click the extension icon.
2. Click **Sign in with Google**.
3. The error should now be resolved.
