import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function htmlToPlainText( html ) {
	if ( ! html || typeof html !== 'string' ) {
		return '';
	}
	const div = document.createElement( 'div' );
	div.innerHTML = html;
	return ( div.innerText || div.textContent || '' ).replace( /\u00a0/g, ' ' );
}

function escapeHtml( text ) {
	const div = document.createElement( 'div' );
	div.textContent = text;
	return div.innerHTML;
}

function plainTextToCommentHtml( text ) {
	const trimmed = text.trim();
	if ( ! trimmed ) {
		return '';
	}
	const blocks = trimmed.split( /\n{2,}/ );
	return blocks
		.map( ( block ) => {
			const withBreaks = escapeHtml( block ).replace( /\n/g, '<br />' );
			return `<p>${ withBreaks }</p>`;
		} )
		.join( '' );
}

export default function BasicCommentEditor( {
	onSubmit,
	disabled,
	initialHtml = null,
	onCancel = null,
	clearDraftOnCancel = false,
	submitLabel = null,
	autoFocus = false,
} ) {
	const isEditMode = initialHtml !== null;
	const textareaRef = useRef( null );
	const [ text, setText ] = useState( () =>
		htmlToPlainText( initialHtml || '' )
	);
	const [ submitting, setSubmitting ] = useState( false );
	const [ submitError, setSubmitError ] = useState( null );

	useEffect( () => {
		if ( initialHtml !== null ) {
			setText( htmlToPlainText( initialHtml ) );
		}
	}, [ initialHtml ] );

	useEffect( () => {
		if ( ! autoFocus ) {
			return;
		}

		const focusField = () => {
			const el = textareaRef.current;
			if ( ! el || document.activeElement === el ) {
				return true;
			}
			el.focus();
			const len = el.value.length;
			el.setSelectionRange( len, len );
			return document.activeElement === el;
		};

		// Clicking "Add Comment" can leave focus on the (unmounted) button or
		// the iframe selection; retry past the next paint so focus sticks.
		let cancelled = false;
		const tryFocus = () => {
			if ( cancelled || focusField() ) {
				return;
			}
			requestAnimationFrame( () => {
				if ( cancelled || focusField() ) {
					return;
				}
				window.setTimeout( () => {
					if ( ! cancelled ) {
						focusField();
					}
				}, 50 );
			} );
		};
		tryFocus();

		return () => {
			cancelled = true;
		};
	}, [ autoFocus ] );

	const isEmpty = ! text.trim();
	const submitDisabled = isEmpty || submitting || disabled;
	const showCancel =
		onCancel != null || ( clearDraftOnCancel && ! submitDisabled );

	const handleCancelClick = useCallback( () => {
		if ( onCancel ) {
			onCancel();
			return;
		}
		setText( '' );
		setSubmitError( null );
	}, [ onCancel ] );

	const handleSubmit = useCallback( async () => {
		if ( submitDisabled ) {
			return;
		}
		setSubmitting( true );
		setSubmitError( null );
		try {
			await onSubmit( plainTextToCommentHtml( text ) );
			if ( ! isEditMode ) {
				setText( '' );
			}
		} catch ( err ) {
			setSubmitError(
				err.message ||
					__( 'Failed to post comment.', 'jumplinks-editorial-workflow' )
			);
		} finally {
			setSubmitting( false );
		}
	}, [ submitDisabled, onSubmit, text, isEditMode ] );

	return (
		<div className="flow-comment-editor flow-comment-editor--basic">
			<div className="flow-comment-editor__content">
				<textarea
					ref={ textareaRef }
					className="flow-comment-editor__textarea"
					value={ text }
					onChange={ ( e ) => setText( e.target.value ) }
					placeholder={ __(
						'Write a comment…',
						'jumplinks-editorial-workflow'
					) }
					disabled={ submitting || disabled }
					rows={ 3 }
					autoFocus={ autoFocus }
				/>
			</div>
			{ submitError && (
				<p className="flow-comment-editor__error">{ submitError }</p>
			) }
			<div className="flow-comment-editor__submit-row">
				<Button
					variant="secondary"
					className="flow-comment-editor__submit-btn"
					onClick={ handleSubmit }
					disabled={ submitDisabled }
					__next40pxDefaultSize
				>
					{ submitting
						? __( 'Saving…', 'jumplinks-editorial-workflow' )
						: submitLabel ||
						  __( 'Add Comment', 'jumplinks-editorial-workflow' ) }
				</Button>
				{ showCancel && (
					<Button
						className="flow-btn--text flow-btn--cancel"
						onClick={ handleCancelClick }
						disabled={ submitting }
						__next40pxDefaultSize
					>
						{ __( 'Cancel', 'jumplinks-editorial-workflow' ) }
					</Button>
				) }
			</div>
		</div>
	);
}
