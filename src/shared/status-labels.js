/**
 * Unified review status labels — keep in sync with Review::status_labels() in PHP.
 */
import { __ } from '@wordpress/i18n';

export const STATUS_LABELS = {
	pending: __( 'Pending Review', 'jumplinks-editorial-workflow' ),
	in_review: __( 'In Review', 'jumplinks-editorial-workflow' ),
	changes_requested: __( 'Changes Requested', 'jumplinks-editorial-workflow' ),
	approved: __( 'Approved', 'jumplinks-editorial-workflow' ),
	open_review: __( 'Open Review', 'jumplinks-editorial-workflow' ),
};

/** @param {string|undefined|null} status */
export function statusLabel( status ) {
	return ( status && STATUS_LABELS[ status ] ) || status || '';
}
