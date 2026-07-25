import React from 'react';
import { Link } from 'react-router-dom';

/**
 * The official TNF logo — single source of truth.
 *
 * Served from the local `public/assets/brand/` directory, NOT from
 * https://thenewfuse.com/assets/brand/tnf-logo.png. The absolute URL was
 * duplicated across five files and made the brand mark depend on the marketing
 * host being reachable, which breaks self-hosted and offline installs and is
 * blocked outright under an `img-src 'self'` CSP.
 */
export const TNF_LOGO_SRC = '/assets/brand/tnf-logo.png';
export const TNF_WORDMARK = 'The New Fuse';

export interface TnfLogoProps {
  /** Pixel size of the mark. */
  size?: number;
  /** Render the "The New Fuse" wordmark beside the mark. */
  showWordmark?: boolean;
  /** Wrap in a Link to `to`. Pass null for a bare, non-navigating mark. */
  to?: string | null;
  className?: string;
  /** Extra classes for the wordmark text. */
  wordmarkClassName?: string;
}

export const TnfLogo: React.FC<TnfLogoProps> = ({
  size = 40,
  showWordmark = false,
  to = '/',
  className = '',
  wordmarkClassName = '',
}) => {
  const mark = (
    <>
      <img
        src={TNF_LOGO_SRC}
        alt={showWordmark ? '' : TNF_WORDMARK}
        aria-hidden={showWordmark || undefined}
        width={size}
        height={size}
        className="rounded-md object-cover shrink-0"
        style={{ width: size, height: size }}
        loading="lazy"
      />
      {showWordmark && (
        <span className={`font-bold tracking-tight ${wordmarkClassName}`}>{TNF_WORDMARK}</span>
      )}
    </>
  );

  const content = <span className={`inline-flex items-center gap-3 ${className}`}>{mark}</span>;

  if (to === null) return content;

  return (
    <Link to={to} className="inline-flex items-center hover:opacity-90 transition-opacity">
      {content}
    </Link>
  );
};

export default TnfLogo;
