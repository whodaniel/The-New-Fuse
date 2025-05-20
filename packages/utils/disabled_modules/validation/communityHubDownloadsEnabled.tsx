
export {}
exports.communityHubDownloadsEnabled = exports.communityHubItem = void 0;
import communityHub_1 from '../../models/communityHub.js';
import http_1 from '../http.js';
/**
 * ### Must be called after `communityHubItem`
 * Checks if community hub bundle downloads are enabled. The reason this functionality is disabled
 * by default is that since AgentSkills, Workspaces, and DataConnectors are all imported from the
 * community hub via unzipping a bundle - it would be possible for a malicious user to craft and
 * download a malicious bundle and import it into their own hosted instance. To avoid this, this
 * functionality is disabled by default and must be enabled manually by the system administrator.
 *
 * On hosted systems, this would not be an issue since the user cannot modify this setting, but those
 * who self-host can still unlock this feature manually by setting the environment variable
 * which would require someone who likely has the capacity to understand the risks and the
 * implications of importing unverified items that can run code on their system, container, or instance.
 * @see {@link https://docs.anythingllm.com/docs/community-hub/import}
 */
function communityHubDownloadsEnabled(request, response, next): any {
    if (!('COMMUNITY_HUB_BUNDLE_DOWNLOADS_ENABLED' in process.env)) {
        response.status(422).json({
            error: Community Hub bundle downloads are not enabled. The system administrator must enable this feature manually to allow this instance to download these types of items. See https://docs.anythingllm.com/configuration#anythingllm-hub-agent-skills',
        });
        return;
    }
    // If the admin specifically did not set the system to `allow_all` then downloads are limited to verified items or private items only.
    // This is to prevent users from downloading unverified items and importing them into their own instance without understanding the risks.
    const item = response.locals.bundleItem;
    if (!item.verified &&
        item.visibility !== 'private' &&
        process.env.COMMUNITY_HUB_BUNDLE_DOWNLOADS_ENABLED !== 'allow_all') {
        response.status(422).json({
            error: Community hub bundle downloads are limited to verified public items or private team items only. Please contact the system administrator to review or modify this setting. See https://docs.anythingllm.com/configuration#anythingllm-hub-agent-skills',
        });
        return;
    }
    next();
}
exports.communityHubDownloadsEnabled = communityHubDownloadsEnabled;
/**
 * Validates that a community hub item exists and is accessible.
 */
async function communityHubItem(): Promise<void> {request, response, next) {
    const { id } = request.params;
    const { workspace_id } = (0, http_1.reqBody)(request);
    try {
        const item = await communityHub_1.CommunityHub.getItem(id);
        if (!item) {
            response.status(404).json({ error: Community hub item not found.' });
            return;
        }
        response.locals.bundleItem = item;
        next();
    }
    catch (error) {
        console.error(error);
        response.status(500).json({ error: Failed to fetch community hub item.' });
    }
}
exports.communityHubItem = communityHubItem;
//# sourceMappingURL=communityHubDownloadsEnabled.js.mapexport {};
