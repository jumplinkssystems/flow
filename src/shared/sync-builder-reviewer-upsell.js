/**
 * Free "Unlock multiple reviewers" upsell for builder drawers.
 * Always dedupes to a single node so classic-render / MutationObserver races
 * cannot stack copies.
 *
 * @param {object} opts
 * @param {ParentNode} opts.root Drawer/panel root.
 * @param {object|null|undefined} opts.review
 * @param {object|null|undefined} opts.data { href, label, helpText }
 * @param {string} opts.className
 * @param {string} [opts.markerAttr] Optional data-* attribute name to set.
 * @param {(data: object, className: string) => HTMLElement} opts.buildNode
 */
export function syncBuilderReviewerUpsell( opts ) {
	const root = opts && opts.root;
	const data = opts && opts.data;
	const buildNode = opts && opts.buildNode;
	const className = ( opts && opts.className ) || 'flow-ew-upsell-reviewer';
	const markerAttr = opts && opts.markerAttr;
	if ( ! root || ! data || ! data.label || typeof buildNode !== 'function' ) {
		return;
	}

	const select =
		root.querySelector( '#flow-ew-reviewer-select' ) ||
		document.getElementById( 'flow-ew-reviewer-select' );
	if ( ! select ) {
		return;
	}

	const review = opts.review;
	const val = String( select.value || '' );
	const invite = (
		select.getAttribute( 'data-invite-email' ) ||
		select.dataset.inviteEmail ||
		''
	).trim();
	const hasReviewer = !!(
		val === 'email' ||
		Number( val ) > 0 ||
		invite.length > 0 ||
		( review && Number( review.reviewer_id || 0 ) > 0 ) ||
		( review &&
			review.reviewer &&
			Number( review.reviewer.id || 0 ) !== 0 ) ||
		( review &&
			( review.invite_email ||
				( review.reviewer && review.reviewer.is_email ) ) ) ||
		( review &&
			Array.isArray( review.email_invites ) &&
			review.email_invites.length > 0 )
	);

	const existing = Array.from(
		root.querySelectorAll(
			[
				'.' + className,
				'[data-flow-ew-upsell-reviewer]',
				markerAttr ? '[' + markerAttr + ']' : null,
			]
				.filter( Boolean )
				.join( ', ' )
		)
	);
	let node = existing[ 0 ] || null;
	existing.slice( 1 ).forEach( function ( extra ) {
		extra.remove();
	} );

	if ( ! hasReviewer ) {
		if ( node ) {
			node.remove();
		}
		return;
	}

	if ( ! node ) {
		node = buildNode( data, className );
		if ( markerAttr ) {
			node.setAttribute( markerAttr, '1' );
		}
		node.classList.add( className );
		// Mark for the shared classic upsell script so it does not inject again.
		node.setAttribute( 'data-flow-ew-upsell-reviewer', '1' );

		const actions =
			root.querySelector( '#flow-ew-classic-actions' ) ||
			root.querySelector( '.flow-ew-classic__actions' );
		const anchor =
			root.querySelector( '#flow-ew-reviewer-combobox' ) ||
			select.parentElement;
		if ( actions && actions.parentElement ) {
			actions.parentElement.insertBefore( node, actions );
		} else if ( anchor && anchor.parentElement ) {
			anchor.parentElement.insertBefore( node, anchor.nextSibling );
		} else {
			root.appendChild( node );
		}
	}

	node.style.display = '';
}
