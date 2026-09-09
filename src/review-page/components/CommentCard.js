import { useState, useCallback, useRef, useEffect } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { chevronUp, closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { pageData } from '../utils/api';
import { eventHitsShadowNode } from '../utils/dom-helpers';
import CommentEditor from './CommentEditor';
import commentMoreIcon from '../icons/comment-more';
import commentResolveIcon from '../icons/comment-resolve';
import commentEditIcon from '../icons/comment-edit';
import commentTrashIcon from '../icons/comment-trash';

function getInitials( name ) {
	if ( ! name ) return '?';
	const parts = name.trim().split( /\s+/ );
	if ( parts.length === 1 ) return parts[ 0 ][ 0 ].toUpperCase();
	return ( parts[ 0 ][ 0 ] + parts[ parts.length - 1 ][ 0 ] ).toUpperCase();
}

const TRUNCATE_HEIGHT = 80;

export default function CommentCard( {
	comment,
	onEdit,
	onDelete,
	onResolve,
	showResolveInActions = true,
	isThreadExpanded = false,
	canTriggerExpand = false,
	canCollapseThread = false,
	onRequestExpand = null,
	onRequestCollapse = null,
	isReply = false,
} ) {
	const currentUserId = Number( pageData.currentUserId || 0 );
	const isAnonymousViewer = currentUserId === 0;
	const isOwn = Number( comment.authorId ) > 0 && Number( comment.authorId ) === currentUserId;
	const [ editing, setEditing ] = useState( false );
	const [ menuOpen, setMenuOpen ] = useState( false );
	const [ truncated, setTruncated ] = useState( false );
	const bodyRef = useRef( null );
	const editEditorRef = useRef( null );
	const menuRef = useRef( null );

	useEffect( () => {
		if ( bodyRef.current && bodyRef.current.scrollHeight > TRUNCATE_HEIGHT ) {
			setTruncated( true );
		}
	}, [ comment.html ] );

	const handleEditSave = useCallback(
		async ( html ) => {
			await onEdit( comment.id, html );
			setEditing( false );
		},
		[ comment.id, onEdit ]
	);

	const initials = getInitials( comment.author );

	useEffect( () => {
		if ( ! editing || ! editEditorRef.current ) {
			return;
		}

		requestAnimationFrame( () => {
			requestAnimationFrame( () => {
				const submitRow = editEditorRef.current?.querySelector( '.flow-comment-editor__submit-row' );
				const target = submitRow || editEditorRef.current;
				const scroller = target.closest( '.components-tab-panel__tab-content' );

				if ( ! scroller ) {
					target.scrollIntoView( {
						behavior: 'smooth',
						block: 'end',
						inline: 'nearest',
					} );
					return;
				}

				const scrollerRect = scroller.getBoundingClientRect();
				const targetRect = target.getBoundingClientRect();
				const desiredBottom = scrollerRect.bottom - 10;
				const delta = targetRect.bottom - desiredBottom;

				if ( delta > 0 ) {
					scroller.scrollBy( {
						top: delta,
						behavior: 'smooth',
					} );
				}
			} );
		} );
	}, [ editing ] );

	useEffect( () => {
		if ( ! menuOpen ) {
			return undefined;
		}
		const handlePointerDown = ( e ) => {
			if ( eventHitsShadowNode( e, menuRef.current ) ) {
				return;
			}
			setMenuOpen( false );
		};
		document.addEventListener( 'mousedown', handlePointerDown );
		return () =>
			document.removeEventListener( 'mousedown', handlePointerDown );
	}, [ menuOpen ] );

	const handleEditClick = useCallback( () => {
		setMenuOpen( false );
		setEditing( true );
	}, [] );

	const handleDeleteClick = useCallback( () => {
		setMenuOpen( false );
		onDelete( comment.id );
	}, [ comment.id, onDelete ] );

	return (
		<div className={ `flow-comment-card${ isReply ? ' flow-comment-card--reply' : '' }` }>
			<div className="flow-comment-card__header">
				{ comment.avatarUrl ? (
					<img
						className="flow-comment-card__avatar flow-comment-card__avatar--img"
						src={ comment.avatarUrl }
						alt=""
						width="28"
						height="28"
					/>
				) : (
					<span
						className="flow-comment-card__avatar flow-comment-card__avatar--fallback"
						aria-hidden="true"
					>
						{ initials }
					</span>
				) }
				<span className="flow-comment-card__author" title={ comment.author }>{ comment.author }</span>
				<span className="flow-comment-card__date">{ comment.date }</span>
				<span className="flow-comment-card__actions">
					{ ! menuOpen &&
						isThreadExpanded &&
						canCollapseThread &&
						onRequestCollapse && (
						<Button
							icon={ chevronUp }
							size="small"
							className="flow-comment-card__action-btn flow-comment-card__action-btn--collapse"
							label={ __( 'Collapse thread', 'jumplinks-editorial-workflow' ) }
							onClick={ onRequestCollapse }
						/>
					) }
					{ ! menuOpen &&
						! isAnonymousViewer &&
						showResolveInActions &&
						onResolve &&
						! comment.isResolved && (
						<Button
							icon={ commentResolveIcon }
							size="small"
							className="flow-comment-card__action-icon flow-comment-card__resolve-icon"
							label={ __( 'Mark as resolved', 'jumplinks-editorial-workflow' ) }
							onClick={ () => onResolve( comment.id ) }
						/>
					) }
					{ isOwn && (
						<div
							ref={ menuRef }
							className={
								menuOpen
									? 'flow-comment-card__menu flow-comment-card__menu--open'
									: 'flow-comment-card__menu'
							}
						>
							{ menuOpen ? (
								<>
									<Button
										icon={ commentEditIcon }
										size="small"
										className="flow-comment-card__action-icon flow-comment-card__action-icon--edit"
										label={ __(
											'Edit',
											'jumplinks-editorial-workflow'
										) }
										onClick={ handleEditClick }
									/>
									<Button
										icon={ commentTrashIcon }
										size="small"
										className="flow-comment-card__action-icon flow-comment-card__action-icon--destructive"
										label={ __(
											'Delete',
											'jumplinks-editorial-workflow'
										) }
										onClick={ handleDeleteClick }
									/>
									<Button
										icon={ closeSmall }
										size="small"
										className="flow-comment-card__action-icon flow-comment-card__action-icon--close"
										label={ __(
											'Close',
											'jumplinks-editorial-workflow'
										) }
										onClick={ () => setMenuOpen( false ) }
										aria-expanded={ true }
									/>
								</>
							) : (
								<Button
									icon={ commentMoreIcon }
									size="small"
									className="flow-comment-card__action-icon flow-comment-card__menu-trigger"
									label={ __(
										'Actions',
										'jumplinks-editorial-workflow'
									) }
									onClick={ () => setMenuOpen( true ) }
									aria-expanded={ false }
									aria-haspopup="true"
								/>
							) }
						</div>
					) }
				</span>
			</div>

			{ editing ? (
				<div ref={ editEditorRef }>
					<CommentEditor
						autoFocus
						initialHtml={ comment.html }
						onSubmit={ handleEditSave }
						onCancel={ () => setEditing( false ) }
						submitLabel={ __( 'Save', 'jumplinks-editorial-workflow' ) }
					/>
				</div>
			) : (
				<>
					<div
						ref={ bodyRef }
						className={ `flow-comment-card__body${ truncated && ! isThreadExpanded ? ' flow-comment-card__body--truncated' : '' }` }
						dangerouslySetInnerHTML={ { __html: comment.html } }
						onClick={ () => {
							if ( truncated && ! isThreadExpanded && canTriggerExpand && onRequestExpand ) {
								onRequestExpand();
							}
						} }
					/>
				</>
			) }
		</div>
	);
}
