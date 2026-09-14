export function escHtml( str ) {
	const d = document.createElement( 'div' );
	d.textContent = str;
	return d.innerHTML;
}

export function escAttr( str ) {
	return String( str )
		.replace( /&/g, '&amp;' )
		.replace( /"/g, '&quot;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' );
}
