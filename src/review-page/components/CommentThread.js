import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import commentReplyIcon from '../icons/comment-reply';
import { __, sprintf } from '@wordpress/i18n';
import CommentCard from './CommentCard';
import CommentEditor from './CommentEditor';
const COLLAPSED_REPLY_LIMIT = 1;

export default function CommentThread( {
	thread,
	onEdit,
	onDelete,
	onReply,
	onResolve,
	suppressBodyExpandClick = false,
} ) {
	const replies = thread.replies || [];
	const [ replyingTo, setReplyingTo ] = useState( null );
	const [ threadExpanded, setThreadExpanded ] = useState( false );
	const replyEditorRef = useRef( null );

	const handleReply = useCallback( ( parentId ) => {
		setReplyingTo( ( prev ) => ( prev === parentId ? null : parentId ) );
	}, [] );

	const handleReplySubmit = useCallback(
		async ( html ) => {
			await onReply( replyingTo, html );
			setReplyingTo( null );
		},
		[ replyingTo, onReply ]
	);

	const visibleReplies = threadExpanded
		? replies
		: replies.slice( Math.max( 0, replies.length - COLLAPSED_REPLY_LIMIT ) );
	const hiddenCount = Math.max( 0, replies.length - COLLAPSED_REPLY_LIMIT );

	useEffect( () => {
		if ( ! replyingTo || ! replyEditorRef.current ) {
			return;
		}

		// Wait for the editor to render and then bring action buttons into view.
		requestAnimationFrame( () => {
			requestAnimationFrame( () => {
				const submitRow = replyEditorRef.current?.querySelector( '.flow-comment-editor__submit-row' );
				const target = submitRow || replyEditorRef.current;
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
	}, [ replyingTo ] );

	return (
		<div className={ `flow-comment-thread${ thread.isResolved ? ' flow-comment-thread--resolved' : '' }` }>
			<CommentCard
				comment={ thread }
				onEdit={ onEdit }
				onDelete={ onDelete }
				onResolve={ onResolve }
				showResolveInActions
				isThreadExpanded={ threadExpanded }
				canTriggerExpand={ ! suppressBodyExpandClick }
				canCollapseThread
				onRequestExpand={ () => setThreadExpanded( true ) }
				onRequestCollapse={ () => setThreadExpanded( false ) }
			/>

			{ replies.length > 0 && (
				<div className="flow-comment-thread__replies">
					{ ! threadExpanded && hiddenCount > 0 && (
						<button
							type="button"
							className="flow-comment-thread__toggle"
							onClick={ () => setThreadExpanded( true ) }
						>
							{ sprintf(
								/* translators: %d: number of hidden replies */
								__( '%d more replies', 'jumplinks-editorial-workflow' ),
								hiddenCount
							) }
						</button>
					) }

					{ visibleReplies.map( ( reply ) => (
						<CommentCard
							key={ reply.id }
							comment={ reply }
							onEdit={ onEdit }
							onDelete={ onDelete }
							isThreadExpanded={ threadExpanded }
							isReply
						/>
					) ) }
				</div>
			) }

			{ onResolve && ! thread.isResolved && ! replyingTo && (
				<div className="flow-comment-thread__resolve-row">
					<Button
						className="flow-btn--text flow-comment-thread__reply-btn"
						icon={ commentReplyIcon }
						onClick={ () => handleReply( thread.id ) }
					>
						{ __( 'Reply', 'jumplinks-editorial-workflow' ) }
					</Button>
				</div>
			) }

			{ replyingTo && (
				<div className="flow-comment-thread__reply-editor" ref={ replyEditorRef }>
					<CommentEditor
						autoFocus
						onSubmit={ handleReplySubmit }
						onCancel={ () => setReplyingTo( null ) }
						submitLabel={ __( 'Reply', 'jumplinks-editorial-workflow' ) }
					/>
				</div>
			) }
		</div>
	);
}
