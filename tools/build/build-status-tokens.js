/**
 * Expands assets/status-palette.json into the two stylesheet forms consumers
 * need: CSS custom properties (runtime) and SCSS variables (compile time).
 * Runs as the first step of `npm run build`.
 */
const fs = require( 'fs' );
const path = require( 'path' );

const root = path.join( __dirname, '..', '..' );
const palette = JSON.parse(
	fs.readFileSync(
		path.join( root, 'assets', 'status-palette.json' ),
		'utf8'
	)
);
const SCSS_NAMES = {
	open_review: 'open',
	self_review: 'self',
	approved: 'approved',
	in_review: 'review',
	changes_requested: 'changes',
	pending: 'pending',
	completed: 'completed',
	cancelled: 'cancelled',
};
const HEADER =
	'Generated from assets/status-palette.json by tools/build/build-status-tokens.js. Do not edit.';

let css = `/* ${ HEADER } */\n:root {\n`;
let scss = `// ${ HEADER }\n`;
for ( const [ slug, colors ] of Object.entries( palette ) ) {
	for ( const key of [ 'bg', 'text', 'border' ] ) {
		css += `\t--flow-status-${ slug }-${ key }: ${ colors[ key ] };\n`;
		scss += `$badge-${ SCSS_NAMES[ slug ] }-${ key }: ${ colors[ key ] };\n`;
	}
}
css += '}\n';

fs.writeFileSync(
	path.join( root, 'assets', 'css', 'status-tokens.css' ),
	css
);
fs.writeFileSync(
	path.join( root, 'src', 'shared', '_status-tokens.scss' ),
	scss
);
console.log( 'status tokens written' );
