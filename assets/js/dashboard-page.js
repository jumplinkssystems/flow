/**
 * Flow Dashboard: the Cancel / Approve / Request changes buttons on each
 * row. Posts straight to the same `flow/v1/reviews/:id/:action` routes the
 * review page uses, then reloads so the row's bucket, counts and filters all
 * recompute from the server — simpler and more reliable than trying to
 * patch them in client-side.
 */
( function () {
	var cfg = window.flowEwDashboard || {};

	function errorRow( container ) {
		var row = container.querySelector( '.flow-ew-dash-item__action-error' );
		if ( ! row ) {
			row = document.createElement( 'p' );
			row.className = 'flow-ew-dash-item__action-error';
			container.appendChild( row );
		}
		return row;
	}

	function setBusy( container, busyLabel ) {
		var buttons = container.querySelectorAll( '.flow-ew-dash-action' );
		Array.prototype.forEach.call( buttons, function ( button ) {
			button.disabled = true;
		} );
		return busyLabel;
	}

	function restore( container, clicked, originalText ) {
		var buttons = container.querySelectorAll( '.flow-ew-dash-action' );
		Array.prototype.forEach.call( buttons, function ( button ) {
			button.disabled = button.dataset.flowDashWasDisabled === '1';
		} );
		if ( clicked ) {
			clicked.textContent = originalText;
		}
	}

	function messageFrom( body, fallback ) {
		return body && body.message ? body.message : fallback;
	}

	document.addEventListener( 'click', function ( event ) {
		var button = event.target.closest
			? event.target.closest( '.flow-ew-dash-action' )
			: null;
		if ( ! button ) {
			return;
		}
		var container = button.closest( '[data-review-id]' );
		var reviewId = container ? container.getAttribute( 'data-review-id' ) : '';
		var action = button.getAttribute( 'data-action' );
		if ( ! container || ! reviewId || ! action ) {
			return;
		}
		var confirmText = button.getAttribute( 'data-confirm' );
		if ( confirmText && ! window.confirm( confirmText ) ) {
			return;
		}

		var buttons = container.querySelectorAll( '.flow-ew-dash-action' );
		Array.prototype.forEach.call( buttons, function ( other ) {
			other.dataset.flowDashWasDisabled = other.disabled ? '1' : '0';
		} );
		var originalText = button.textContent;
		setBusy( container );
		button.textContent = cfg.i18n && cfg.i18n.working ? cfg.i18n.working : 'Working…';
		var errorEl = container.querySelector( '.flow-ew-dash-item__action-error' );
		if ( errorEl ) {
			errorEl.remove();
		}

		window
			.fetch( cfg.restUrl + encodeURIComponent( reviewId ) + '/' + action, {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'X-WP-Nonce': cfg.nonce },
			} )
			.then( function ( res ) {
				if ( res.ok ) {
					window.location.reload();
					return null;
				}
				return res
					.json()
					.catch( function () {
						return null;
					} )
					.then( function ( body ) {
						throw new Error(
							messageFrom(
								body,
								cfg.i18n && cfg.i18n.genericError
									? cfg.i18n.genericError
									: 'Something went wrong. Please try again.'
							)
						);
					} );
			} )
			.catch( function ( err ) {
				restore( container, button, originalText );
				errorRow( container ).textContent = err.message;
			} );
	} );

	document.addEventListener( 'click', function ( event ) {
		var toggle = event.target.closest
			? event.target.closest( '.flow-ew-dash-reviewers__toggle' )
			: null;
		if ( ! toggle ) {
			return;
		}
		var column = toggle.closest( '.flow-ew-dash-reviewers-col' );
		var list = column ? column.querySelector( '.flow-ew-dash-reviewers' ) : null;
		if ( ! list ) {
			return;
		}
		list.classList.add( 'is-expanded' );
		toggle.remove();
	} );
} )();
