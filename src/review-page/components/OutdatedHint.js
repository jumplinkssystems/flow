import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import alertWarningIcon from '../icons/alert-warning';

// Quote on the left, warning on the right. The icon matches the resolve
// check and covers both lines of the banner.
export default function OutdatedHint() {
	return (
		<>
			<span className="flow-inline-anchor__hint">
				{ __(
					'Potentially outdated comment.',
					'jumplinks-editorial-workflow'
				) }
			</span>
			<span className="flow-inline-anchor__alert" aria-hidden="true">
				<Icon icon={ alertWarningIcon } size={ 20 } />
			</span>
		</>
	);
}
