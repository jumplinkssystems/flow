/**
 * Open Review checkbox for the Classic Editor metabox (also reused by the
 * Elementor and Bricks drawers, which render the same panel HTML and load this
 * companion bundle). Rendered above the reviewer field — toggling on
 * auto-creates a review with no reviewer assigned if one doesn't exist yet,
 * then opens it.
 */
import { resolveClassicOpenSlot } from '../shared/resolve-classic-root';

( function bootOpenReview( attempt ) {
	const { flowEW } = window;
	if ( ! flowEW ) {
		return;
	}

	const slot = resolveClassicOpenSlot();
	if ( ! slot ) {
		if ( attempt < 150 ) {
			requestAnimationFrame( function () {
				bootOpenReview( attempt + 1 );
			} );
		}
		return;
	}

	if ( slot.dataset.flowEwOpenReviewReady === '1' ) {
		return;
	}
	slot.dataset.flowEwOpenReviewReady = '1';

( function runOpenReview( slot ) {

	if ( ! flowEW.currentUserCan?.assignReviewer ) {
		return;
	}
	if ( ! flowEW.openReviewEnabled ) {
		return;
	}

	const { restUrl, nonce, postId } = flowEW;
	let currentReview = flowEW.activeReview || null;
	let isOpen = !! ( currentReview && currentReview.is_open );
	let loading = false;

	const wrapper = document.createElement( 'div' );
	wrapper.className = 'flow-ew-classic-open';

	const row = document.createElement( 'label' );
	row.className = 'flow-ew-classic-open__row';

	const checkbox = document.createElement( 'input' );
	checkbox.type = 'checkbox';
	checkbox.checked = isOpen;

	const labelText = document.createElement( 'span' );
	labelText.textContent =
		( flowEW.i18n && flowEW.i18n.openLabel ) || 'Open review';

	row.appendChild( checkbox );
	row.appendChild( labelText );

	const desc = document.createElement( 'p' );
	desc.className = 'flow-ew-classic-open__desc';
	desc.textContent = ( flowEW.i18n && flowEW.i18n.openReviewDesc ) || '';

	wrapper.appendChild( row );
	if ( desc.textContent ) {
		wrapper.appendChild( desc );
	}

	// Extension slot for add-ons (e.g. Pro's "Open to public" sub-checkbox).
	const extras = document.createElement( 'div' );
	extras.className = 'flow-ew-open-review-extras';
	wrapper.appendChild( extras );

	slot.appendChild( wrapper );

	function sync( review ) {
		currentReview = review;
		isOpen = !! ( review && review.is_open );
		checkbox.checked = isOpen;
	}

	function jsonRequest( url, body ) {
		const opts = {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': nonce,
			},
		};
		if ( body !== undefined ) {
			opts.body = JSON.stringify( body );
		}
		return fetch( url, opts ).then( function ( r ) {
			if ( ! r.ok ) {
				throw new Error( 'Failed' );
			}
			return r.json();
		} );
	}

	checkbox.addEventListener( 'change', function () {
		if ( loading ) {
			checkbox.checked = isOpen;
			return;
		}
		const wantOpen = checkbox.checked;
		loading = true;

		const ensureReview = currentReview
			? Promise.resolve( currentReview )
			: jsonRequest( restUrl + '/reviews', {
					post_id: postId,
					reviewer_id: 0,
			  } );

		ensureReview
			.then( function ( review ) {
				return jsonRequest(
					restUrl +
						'/reviews/' +
						review.id +
						'/' +
						( wantOpen ? 'open' : 'close' )
				);
			} )
			.then( function ( data ) {
				sync( data );
				flowEW.activeReview = data;
				document.dispatchEvent(
					new CustomEvent( 'flow-ew:set-review', {
						detail: { review: data },
					} )
				);
			} )
			.catch( function () {
				checkbox.checked = isOpen;
			} )
			.finally( function () {
				loading = false;
			} );
	} );

	document.addEventListener( 'flow-ew:classic-render', function ( e ) {
		sync( ( e.detail && e.detail.review ) || null );
	} );
} )( slot );
} )( 0 );
