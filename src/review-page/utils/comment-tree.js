/**
 * Builds a two-level comment tree from a flat array.
 *
 * Top-level comments (parentId falsy) become roots.
 * Replies (parentId set) are nested under their parent.
 * If a reply references another reply, it is flattened to the nearest root.
 *
 * @param {Array} flatComments - Flat array of comment objects with `id` and `parentId`.
 * @return {Array} Array of root comments, each with a `replies` array.
 */
export function buildCommentTree( flatComments ) {
	const byId = new Map();
	const roots = [];

	for ( const c of flatComments ) {
		byId.set( c.id, { ...c, replies: [] } );
	}

	for ( const c of flatComments ) {
		const node = byId.get( c.id );
		const parentId = c.parentId || 0;

		if ( parentId && byId.has( parentId ) ) {
			const parent = byId.get( parentId );
			if ( parent.parentId && byId.has( parent.parentId ) ) {
				byId.get( parent.parentId ).replies.push( node );
			} else {
				parent.replies.push( node );
			}
		} else {
			roots.push( node );
		}
	}

	return roots;
}
