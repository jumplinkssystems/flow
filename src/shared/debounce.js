export function debounce( fn, ms ) {
	let t;
	return function () {
		clearTimeout( t );
		t = setTimeout( fn, ms );
	};
}
