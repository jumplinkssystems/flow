import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Identity prompt for anonymous visitors on a public review page. Plain HTML —
 * the surrounding shadow root carries the Gutenberg-styled CSS for the form
 * chrome, so we don't need @wordpress/components inside (which would either
 * escape the shadow root via portals or rely on cloned wp-* stylesheets that
 * may not all reach this tree).
 *
 * For email invitees, pass `lockedEmail` so the invite address is shown
 * prefilled and disabled (identity is already gated by the invite cookie).
 */
export default function AnonymousNamePrompt( {
	onSubmit,
	onCancel,
	initialName = '',
	initialEmail = '',
	lockedEmail = '',
} ) {
	const locked = String( lockedEmail || '' ).trim();
	const [ name, setName ] = useState( initialName || '' );
	const [ email, setEmail ] = useState( locked || initialEmail || '' );
	const inputRef = useRef( null );

	const handleSubmit = useCallback(
		( event ) => {
			event?.preventDefault?.();
			const trimmed = ( name || '' ).trim();
			if ( ! trimmed ) {
				return;
			}
			onSubmit( {
				name: trimmed,
				email: locked || ( email || '' ).trim(),
			} );
		},
		[ name, email, locked, onSubmit ]
	);

	useEffect( () => {
		inputRef.current?.focus();
	}, [] );

	useEffect( () => {
		const onKey = ( e ) => {
			if ( e.key === 'Escape' ) {
				onCancel();
			}
		};
		document.addEventListener( 'keydown', onKey );
		return () => document.removeEventListener( 'keydown', onKey );
	}, [ onCancel ] );

	const trimmedName = ( name || '' ).trim();

	return (
		<div
			className="flow-ew-pro-anon-prompt__overlay"
			role="presentation"
			onClick={ ( e ) => {
				if ( e.target === e.currentTarget ) {
					onCancel();
				}
			} }
		>
			<div
				className="flow-ew-pro-anon-prompt__dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="flow-ew-pro-anon-prompt-title"
			>
				<div className="flow-ew-pro-anon-prompt__header">
					<h1
						className="flow-ew-pro-anon-prompt__title"
						id="flow-ew-pro-anon-prompt-title"
					>
						{ __(
							'Add your name to comment',
							'jumplinks-editorial-workflow'
						) }
					</h1>
					<button
						type="button"
						className="flow-ew-pro-anon-prompt__close"
						onClick={ onCancel }
						aria-label={ __( 'Close', 'jumplinks-editorial-workflow' ) }
					>
						<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
							<path
								fill="currentColor"
								d="M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z"
							/>
						</svg>
					</button>
				</div>
				<form
					onSubmit={ handleSubmit }
					className="flow-ew-pro-anon-prompt__body"
				>
					<p className="flow-ew-pro-anon-prompt__lead">
						{ locked
							? __(
									'Tell us who you are so the author knows where the feedback is from.',
									'jumplinks-editorial-workflow'
							  )
							: __(
									'You’re leaving a comment on a public review page. Tell us who you are so the author knows where the feedback is from.',
									'jumplinks-editorial-workflow'
							  ) }
					</p>

					<label className="flow-ew-pro-anon-prompt__field">
						<span className="flow-ew-pro-anon-prompt__label">
							{ __( 'Name', 'jumplinks-editorial-workflow' ) }
						</span>
						<input
							ref={ inputRef }
							type="text"
							className="flow-ew-pro-anon-prompt__input"
							value={ name }
							onChange={ ( e ) => setName( e.target.value ) }
							required
							autoComplete="name"
						/>
					</label>

					<label className="flow-ew-pro-anon-prompt__field">
						<span className="flow-ew-pro-anon-prompt__label">
							{ locked
								? __( 'Email', 'jumplinks-editorial-workflow' )
								: __(
										'Email (optional)',
										'jumplinks-editorial-workflow'
								  ) }
						</span>
						<input
							type="email"
							className="flow-ew-pro-anon-prompt__input"
							value={ email }
							onChange={ ( e ) => {
								if ( ! locked ) {
									setEmail( e.target.value );
								}
							} }
							disabled={ !! locked }
							readOnly={ !! locked }
							autoComplete="email"
						/>
						{ ! locked && (
							<span className="flow-ew-pro-anon-prompt__help">
								{ __(
									'We’ll only use it to notify you when someone replies.',
									'jumplinks-editorial-workflow'
								) }
							</span>
						) }
					</label>

					<div className="flow-ew-pro-anon-prompt__actions">
						<button
							type="button"
							className="flow-ew-pro-anon-prompt__btn flow-ew-pro-anon-prompt__btn--tertiary"
							onClick={ onCancel }
						>
							{ __( 'Cancel', 'jumplinks-editorial-workflow' ) }
						</button>
						<button
							type="submit"
							className="flow-ew-pro-anon-prompt__btn flow-ew-pro-anon-prompt__btn--primary"
							disabled={ ! trimmedName }
						>
							{ __( 'Continue', 'jumplinks-editorial-workflow' ) }
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
