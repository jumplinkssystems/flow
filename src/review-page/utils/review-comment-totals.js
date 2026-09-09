import { useState, useEffect, useRef } from '@wordpress/element';
import { pageData } from './api';
import { buildCommentTree } from './comment-tree';

/**
 * Number of top-level comment threads that are not resolved.
 *
 * @param {Array} flatComments Flat comments list.
 * @return {number} Count of root threads where `isResolved` is false.
 */
export function countUnresolvedCommentThreads( flatComments ) {
	if ( ! Array.isArray( flatComments ) || flatComments.length === 0 ) {
		return 0;
	}
	return buildCommentTree( flatComments ).filter(
		( thread ) => ! thread.isResolved
	).length;
}

/**
 * Number of top-level comment threads that are resolved.
 *
 * @param {Array} flatComments Flat comments list.
 * @return {number} Count of root threads where `isResolved` is true.
 */
export function countResolvedCommentThreads( flatComments ) {
	if ( ! Array.isArray( flatComments ) || flatComments.length === 0 ) {
		return 0;
	}
	return buildCommentTree( flatComments ).filter(
		( thread ) => thread.isResolved
	).length;
}

/**
 * General (Review tab) + inline comment counts for "Request changes" eligibility.
 *
 * @param {(e: Event) => void} [onInlineCommentAdded] Runs after count increments (e.g. author resubmit tracking).
 */
export function useReviewCommentTotals( onInlineCommentAdded ) {
	const onInlineRef = useRef( onInlineCommentAdded );
	onInlineRef.current = onInlineCommentAdded;

	const [ generalCount, setGeneralCount ] = useState(
		() => ( pageData.comments || [] ).length
	);
	const [ inlineCount, setInlineCount ] = useState(
		() => ( pageData.inlineComments || [] ).length
	);

	useEffect( () => {
		const onCount = ( e ) => {
			const d = e.detail;
			const total =
				typeof d === 'object' && d !== null && 'total' in d
					? Number( d.total ) || 0
					: Number( d ) || 0;
			setGeneralCount( total );
		};
		const onInlineAdded = ( e ) => {
			setInlineCount( ( prev ) => prev + 1 );
			onInlineRef.current?.( e );
		};
		window.addEventListener( 'flow:comment-count', onCount );
		window.addEventListener( 'flow:inline-comment-added', onInlineAdded );
		return () => {
			window.removeEventListener( 'flow:comment-count', onCount );
			window.removeEventListener(
				'flow:inline-comment-added',
				onInlineAdded
			);
		};
	}, [] );

	return generalCount + inlineCount;
}
