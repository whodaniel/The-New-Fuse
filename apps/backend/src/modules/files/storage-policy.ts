export const TNF_DIRECT_UPLOAD_MAX_BYTES = 10485760;
export const TNF_DIRECT_UPLOAD_MAX_LABEL = '10MB';

export const TNF_OVERSIZE_UPLOAD_GUIDANCE =
  'Save larger docs and media in Google Drive, Dropbox, Box, OneDrive, or customer storage, then attach the link for indexing.';

export function directUploadLimitMessage(): string {
  return `File size exceeds ${TNF_DIRECT_UPLOAD_MAX_LABEL} direct upload limit. ${TNF_OVERSIZE_UPLOAD_GUIDANCE}`;
}
