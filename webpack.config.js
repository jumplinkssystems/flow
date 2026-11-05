const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const RtlCssPlugin = require( '@wordpress/scripts/plugins/rtlcss-webpack-plugin' );
const path = require( 'path' );
const fs = require( 'fs' );

/**
 * `hash-build-files.js` renames every emitted `*.min.js`/`*.min.css` to
 * `*.min.<md5>.js` so caches that ignore `?ver=` still see updates. That's
 * safe for entry/style files, which PHP enqueues by name via
 * `build/manifest.php` — but a chunk webpack's own runtime fetches with
 * `import()` (an async chunk, e.g. a `splitChunks` vendor chunk or a
 * `webpackChunkName`-named one) has its filename baked into that runtime at
 * compile time; renaming it after the fact 404s every request for it. This
 * plugin records which emitted files belong to non-initial (async-only)
 * chunks so the hash script can leave exactly those alone — those chunks
 * already get their own cache-busting via `chunkFilename`'s `?ver=` query.
 */
class AsyncChunkManifestPlugin {
	apply( compiler ) {
		compiler.hooks.done.tap( 'AsyncChunkManifestPlugin', ( stats ) => {
			const asyncFiles = new Set();
			for ( const chunk of stats.compilation.chunks ) {
				if ( chunk.canBeInitial() ) {
					continue;
				}
				for ( const file of chunk.files ) {
					// `chunk.files` holds the templated `chunkFilename`
					// verbatim, including the `?ver=[chunkhash]` query the
					// production config appends — strip it to match the
					// real filename on disk.
					asyncFiles.add( file.split( '?' )[ 0 ] );
				}
			}
			fs.writeFileSync(
				path.join( compiler.outputPath, '.async-chunk-files.json' ),
				JSON.stringify( Array.from( asyncFiles ).sort() )
			);
		} );
	}
}

const isProduction = process.env.NODE_ENV === 'production';

const shared = {
	...defaultConfig,
	entry: {
		'sidebar/index': path.resolve( __dirname, 'src/sidebar/index.js' ),
		'review-page/index': path.resolve(
			__dirname,
			'src/review-page/index.js'
		),
		'classic-editor/index': path.resolve(
			__dirname,
			'src/classic-editor/index.js'
		),
		'elementor/index': path.resolve( __dirname, 'src/elementor/index.js' ),
		'bricks/index': path.resolve( __dirname, 'src/bricks/index.js' ),
		'breakdance/index': path.resolve(
			__dirname,
			'src/breakdance/index.js'
		),
		'oxygen/index': path.resolve( __dirname, 'src/oxygen/index.js' ),
		'avada/index': path.resolve( __dirname, 'src/avada/index.js' ),
		'beaver/index': path.resolve( __dirname, 'src/beaver/index.js' ),
		'divi/index': path.resolve( __dirname, 'src/divi/index.js' ),
		'setup-wizard/index': path.resolve(
			__dirname,
			'src/setup-wizard/index.js'
		),

		'pro/review-page-pro/index': path.resolve(
			__dirname,
			'src/pro/review-page-pro/index.js'
		),
		'pro/editor-pro/index': path.resolve(
			__dirname,
			'src/pro/editor-pro/index.js'
		),
		'pro/classic-editor-pro/index': path.resolve(
			__dirname,
			'src/pro/classic-editor-pro/index.js'
		),
		'pro/site-review-chrome/index': path.resolve(
			__dirname,
			'src/pro/site-review-chrome/index.js'
		),
	},
	module: {
		...defaultConfig.module,
		rules: [
			{
				test: /\.css$/,
				resourceQuery: /raw/,
				type: 'asset/source',
			},
			{
				test: /\.(sc|sa)ss$/,
				resourceQuery: /raw/,
				// `charset: false`: Sass otherwise prefixes a BOM whenever the
				// output holds a non-ASCII character, and injected into a
				// shadow root that BOM becomes part of the first selector.
				use: [
					{
						loader: 'sass-loader',
						options: { sassOptions: { charset: false } },
					},
				],
				type: 'asset/source',
			},
			...defaultConfig.module.rules.map( ( rule ) => {
				if ( rule.test && rule.test.toString() === '/\\.css$/' ) {
					return { ...rule, resourceQuery: { not: [ /raw/ ] } };
				}
				if ( rule.test && rule.test.toString().includes( 'sc|sa' ) ) {
					return { ...rule, resourceQuery: { not: [ /raw/ ] } };
				}
				return rule;
			} ),
		],
	},
	resolve: {
		...( defaultConfig.resolve || {} ),
		alias: {
			...( defaultConfig.resolve && defaultConfig.resolve.alias
				? defaultConfig.resolve.alias
				: {} ),
			// Pro entries import Free components via `@flow-free/*`
			'@flow-free': path.resolve( __dirname, 'src' ),
		},
	},
};

if ( isProduction ) {
	module.exports = {
		...shared,
		output: {
			...shared.output,
			clean: false,
			filename: '[name].min.js',
			chunkFilename: '[name].min.js?ver=[chunkhash]',
		},
		plugins: [
			...shared.plugins
				.filter( ( plugin ) => ! ( plugin instanceof RtlCssPlugin ) )
				.map( ( plugin ) => {
					if ( plugin instanceof MiniCssExtractPlugin ) {
						return new MiniCssExtractPlugin( {
							filename: '[name].min.css',
						} );
					}
					if ( plugin instanceof DependencyExtractionWebpackPlugin ) {
						return new DependencyExtractionWebpackPlugin( {
							outputFilename: '[name].asset.php',
						} );
					}
					return plugin;
				} ),
			new AsyncChunkManifestPlugin(),
		],
	};
} else {
	module.exports = shared;
}
