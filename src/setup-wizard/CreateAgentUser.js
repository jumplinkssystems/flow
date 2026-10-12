import { useState } from '@wordpress/element';
import { Button, TextControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

const cfg = window.flowEWSetup || {};
const i18n = cfg.i18n || {};

export const canCreateAgentUser = () => !! cfg.agentUserUrl;

/**
 * The "Create user" button that sits in the AI user field, before Clear.
 *
 * @param {Object}   props
 * @param {Function} props.onClick
 * @param {boolean}  props.expanded
 */
export function CreateAgentUserButton( { onClick, expanded } ) {
	if ( ! canCreateAgentUser() ) {
		return null;
	}
	return (
		<Button
			variant="secondary"
			size="small"
			aria-expanded={ expanded }
			aria-controls="flow-ew-wizard-create-user"
			onClick={ onClick }
		>
			{ i18n.agentUserSubmit }
		</Button>
	);
}

/**
 * Inline "create a user for the AI" form: only the fields WordPress
 * requires. The new account is handed to onCreated as `{ id, name }`, like a
 * picked user.
 *
 * @param {Object}   props
 * @param {Function} props.onCreated
 * @param {Function} props.onCancel
 */
export function CreateAgentUserForm( { onCreated, onCancel } ) {
	const [ login, setLogin ] = useState( 'flow-ai' );
	const [ email, setEmail ] = useState( '' );
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState( '' );

	function submit() {
		setBusy( true );
		setError( '' );
		apiFetch( {
			url: cfg.agentUserUrl,
			method: 'POST',
			headers: { 'X-WP-Nonce': cfg.nonce },
			data: { username: login, email },
		} )
			.then( ( user ) =>
				onCreated( { id: Number( user.id ), name: user.name } )
			)
			.catch( ( err ) => setError( err?.message || '' ) )
			.finally( () => setBusy( false ) );
	}

	return (
		<div
			id="flow-ew-wizard-create-user"
			className="flow-ew-wizard__create-user"
		>
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ i18n.agentUserLogin }
				value={ login }
				onChange={ setLogin }
				autoComplete="off"
			/>
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				type="email"
				label={ i18n.agentUserEmail }
				value={ email }
				onChange={ setEmail }
				autoComplete="off"
			/>
			<p className="flow-ew-wizard__create-user-note">
				{ i18n.agentUserNote }
			</p>
			{ error ? (
				<p className="flow-ew-wizard__field-error" role="alert">
					{ error }
				</p>
			) : null }
			<div className="flow-ew-wizard__create-user-actions">
				<Button
					variant="secondary"
					isBusy={ busy }
					disabled={ busy || ! login.trim() || ! email.trim() }
					onClick={ submit }
				>
					{ i18n.agentUserSubmit }
				</Button>
				<Button variant="link" onClick={ onCancel }>
					{ i18n.agentUserCancel }
				</Button>
			</div>
		</div>
	);
}
