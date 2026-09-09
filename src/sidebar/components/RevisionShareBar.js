import { useState } from '@wordpress/element';
import { useCopyToClipboard } from '@wordpress/compose';
import { Button } from '@wordpress/components';
import { ShareBarIcon } from '../../shared/share-bar-icons';

const { flowEW } = window;
const { i18n } = flowEW;

export default function RevisionShareBar({ url }) {
  const [copied, setCopied] = useState(false);
  const ref = useCopyToClipboard(url, () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });

  return (
    <div className="flow-ew-share-bar">
      <p className="flow-ew-field-label flow-ew-share-bar__label">{i18n.snapshotLink}</p>
      <div className="flow-ew-share-bar__row">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flow-ew-share-bar__link"
          title={url}
        >
          <span className="flow-ew-share-bar__link-text">{url}</span>
        </a>
        <Button
          ref={ref}
          size="compact"
          variant="tertiary"
          label={copied ? i18n.copied : i18n.copyLink}
          showTooltip
          className={`flow-ew-share-bar__copy ${copied ? 'flow-ew-share-bar__copy--done' : ''}`}
        >
          <ShareBarIcon name={copied ? 'copied' : 'copy'} />
        </Button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flow-ew-share-bar__goto"
          aria-label={i18n.goToReview || 'Go to review'}
        >
          <ShareBarIcon name="external" />
        </a>
      </div>
    </div>
  );
}
