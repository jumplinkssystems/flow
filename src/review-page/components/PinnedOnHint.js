import { Icon } from '@wordpress/components';
import alertWarningIcon from '../icons/alert-warning';
import { pinnedOnLabel } from '../../shared/device';

export default function PinnedOnHint( { device } ) {
	return (
		<>
			<span className="flow-inline-anchor__hint">
				{ pinnedOnLabel( device ) }
			</span>
			<span className="flow-inline-anchor__alert" aria-hidden="true">
				<Icon icon={ alertWarningIcon } size={ 20 } />
			</span>
		</>
	);
}
