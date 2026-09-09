import { useState, useCallback, useRef, useEffect } from '@wordpress/element';
import ConfirmDialog from '../components/ConfirmDialog';

/**
 * Promise-based confirm dialog for destructive actions.
 *
 * @returns {{ confirm: Function, confirmDialog: import('react').ReactNode }}
 */
export function useConfirmDialog() {
	const [ pending, setPending ] = useState( null );
	const resolverRef = useRef( null );

	const close = useCallback( ( result ) => {
		resolverRef.current?.( result );
		resolverRef.current = null;
		setPending( null );
	}, [] );

	const confirm = useCallback( ( options ) => {
		return new Promise( ( resolve ) => {
			resolverRef.current = resolve;
			setPending( options );
		} );
	}, [] );

	useEffect( () => {
		return () => {
			resolverRef.current?.( false );
			resolverRef.current = null;
		};
	}, [] );

	const confirmDialog = pending ? (
		<ConfirmDialog
			{ ...pending }
			onConfirm={ () => close( true ) }
			onCancel={ () => close( false ) }
		/>
	) : null;

	return { confirm, confirmDialog };
}
