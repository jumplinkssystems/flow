const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const RtlCssPlugin = require( '@wordpress/scripts/plugins/rtlcss-webpack-plugin' );
const path = require( 'path' );

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
	optimization: {
		...( defaultConfig.optimization || {} ),
		splitChunks: {
			...( ( defaultConfig.optimization &&
				defaultConfig.optimization.splitChunks ) ||
				{} ),
			cacheGroups: {
				...( ( defaultConfig.optimization &&
					defaultConfig.optimization.splitChunks &&
					defaultConfig.optimization.splitChunks.cacheGroups ) ||
					{} ),
				// The rich-comment editor stack (Tiptap + ProseMirror) is used by
				// two Pro entries; emit it once as `build/pro/vendor-editor` and
				// let PHP enqueue it as a shared dependency instead of compiling
				// ~400 KB into each bundle.
				flowProEditor: {
					test: /[\\/]node_modules[\\/](@tiptap|prosemirror-)/,
					name: 'pro/vendor-editor',
					chunks: ( chunk ) =>
						[
							'pro/review-page-pro/index',
							'pro/site-review-chrome/index',
						].includes( chunk.name ),
					enforce: true,
					priority: 20,
					reuseExistingChunk: true,
				},
			},
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
		plugins: shared.plugins
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
	};
} else {
	module.exports = shared;
}
