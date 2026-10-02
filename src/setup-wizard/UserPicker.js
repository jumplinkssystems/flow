import { useState, useEffect, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

const cfg = window.flowEWSetup || {};
const i18n = cfg.i18n || {};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Search-and-pick for one WordPress user, optionally accepting a typed email
 * address instead. Value: `{ id, name }`, `{ email }` or null.
 *
 * @param {Object}   props
 * @param {string}   props.id
 * @param {Object}   props.value
 * @param {Function} props.onChange
 * @param {boolean}  props.allowEmail
 */
export default function UserPicker( { id, value, onChange, allowEmail } ) {
	const [ query, setQuery ] = useState( '' );
	const [ results, setResults ] = useState( [] );
	const request = useRef( 0 );

	useEffect( () => {
		const q = query.trim();
		if ( q.length < 2 ) {
			setResults( [] );
			return undefined;
		}
		const current = ++request.current;
		const timer = setTimeout( () => {
			apiFetch( {
				url: `${ cfg.usersUrl }?q=${ encodeURIComponent( q ) }`,
				headers: { 'X-WP-Nonce': cfg.nonce },
			} )
				.then( ( users ) => {
					if ( current === request.current ) {
						setResults( Array.isArray( users ) ? users : [] );
					}
				} )
				.catch( () => {
					if ( current === request.current ) {
						setResults( [] );
					}
				} );
		}, 250 );
		return () => clearTimeout( timer );
	}, [ query ] );

	function pick( next ) {
		onChange( next );
		setQuery( '' );
		setResults( [] );
	}

	if ( value ) {
		return (
			<div className="flow-ew-wizard__picker-selected">
				<span>{ value.email || value.name }</span>
				<Button
					variant="secondary"
					size="small"
					onClick={ () => onChange( null ) }
				>
					{ i18n.clear }
				</Button>
			</div>
		);
	}

	const typed = query.trim().toLowerCase();
	const options = results.map( ( user ) => ( {
		key: `user-${ user.id }`,
		label: user.name,
		meta: user.email || user.login || '',
		value: { id: Number( user.id ), name: user.name },
	} ) );
	if ( allowEmail && EMAIL_RE.test( typed ) ) {
		options.unshift( {
			key: 'email',
			label: String( i18n.inviteEmail || 'Invite %s' ).replace(
				'%s',
				typed
			),
			meta: '',
			value: { email: typed },
		} );
	}

	return (
		<div className="flow-ew-wizard__picker">
			<input
				id={ id }
				type="search"
				className="flow-ew-wizard__picker-input"
				placeholder={
					allowEmail ? i18n.searchUsersOrEmail : i18n.searchUsers
				}
				value={ query }
				onChange={ ( event ) => setQuery( event.target.value ) }
				autoComplete="off"
			/>
			{ options.length > 0 && (
				<ul className="flow-ew-wizard__picker-results" role="listbox">
					{ options.map( ( option ) => (
						<li key={ option.key }>
							<button
								type="button"
								role="option"
								aria-selected="false"
								className="flow-ew-wizard__picker-option"
								onClick={ () => pick( option.value ) }
							>
								<span>{ option.label }</span>
								{ option.meta &&
									option.meta !== option.label && (
										<span className="flow-ew-wizard__picker-meta">
											{ option.meta }
										</span>
									) }
							</button>
						</li>
					) ) }
				</ul>
			) }
		</div>
	);
}
