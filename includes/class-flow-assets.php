<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Assets {

	public static function script_suffix(): string {
		return ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
	}

	/**
	 * WordPress 6.6 added the `react-jsx-runtime` script handle that webpack's
	 * automatic JSX runtime depends on. Older WP versions still ship React 18 (so
	 * the JSX runtime functions exist on `window.React`), but no handle is
	 * registered — leading WP to silently drop any script that depends on it.
	 * Registers a tiny shim that exposes `window.ReactJSXRuntime` mapped to
	 * `React.createElement`. Idempotent and safe on WP 6.6+ (no-op).
	 */
	/**
	 * Make a front-end SPA page robust to third-party consent gates (Cookiebot,
	 * Usercentrics, CIVIC Cookie Control) and script combiners (Autoptimize, WP
	 * Rocket, LiteSpeed). Without this, those plugins routinely block or reorder
	 * WP core scripts (`wp-i18n`, `wp-components`, etc.) but leave the matching
	 * `<script id="*-js-translations">` inline blocks running — the inline calls
	 * `wp.i18n.setLocaleData(…)` and crashes with `wp is not defined` before our
	 * bundle even starts.
	 *
	 * Three-pronged defence:
	 *   1. Tag every script tag (registered + inline) with
	 *      `data-cookieconsent="ignore"` so Cookiebot / Usercentrics leave them
	 *      alone.
	 *   2. Tell common cache + minify plugins to skip this page so dependency
	 *      order survives optimisation.
	 *   3. Emit a tiny `window.wp.i18n` stub early in `<head>`. If a plugin
	 *      still manages to reorder scripts past prongs (1) and (2), the
	 *      translation inline blocks degrade to no-ops instead of crashing.
	 *
	 * Idempotent — calling more than once per request is safe.
	 */
	public static function shield_front_end_spa(): void {
		static $applied = false;
		if ( $applied ) {
			return;
		}
		$applied = true;

		if ( ! defined( 'DONOTCACHEPAGE' ) ) {
			define( 'DONOTCACHEPAGE', true );
		}
		if ( ! defined( 'LITESPEED_BYPASS_OPTM' ) ) {
			define( 'LITESPEED_BYPASS_OPTM', true );
		}
		if ( function_exists( 'do_action' ) ) {
			do_action( 'litespeed_control_set_nocache', 'flow editorial review SPA — strict dependency order' );
		}

		add_filter( 'autoptimize_filter_noptimize', '__return_true' );
		add_filter( 'litespeed_disable_all', '__return_true' );
		add_filter( 'litespeed_optimize_js_combine', '__return_false' );
		add_filter( 'litespeed_optimize_js_minify', '__return_false' );
		add_filter( 'litespeed_optimize_html', '__return_false' );
		add_filter( 'litespeed_optimize_html_lazy', '__return_false' );
		add_filter( 'litespeed_can_optm', '__return_false' );
		add_filter(
			'rocket_minify_excluded_external_js',
			static function ( $excluded ) {
				return $excluded;
			}
		);
		add_filter( 'do_rocket_lazyload', '__return_false' );

		// Run at PHP_INT_MAX so optimizer plugins (LiteSpeed / WP Rocket /
		// Autoptimize) can't undo us — their script_loader_tag handlers
		// rebuild the tag and would strip our attribute if we ran earlier.
		// Also matches `<script` followed by ANY whitespace, not just a
		// single space, because some plugins reformat with tabs / newlines.
		add_filter(
			'script_loader_tag',
			static function ( $tag ) {
				if ( false !== strpos( $tag, 'data-cookieconsent' ) ) {
					return $tag;
				}
				return preg_replace( '/<script(\s)/i', '<script data-cookieconsent="ignore"$1', $tag, 1 );
			},
			PHP_INT_MAX
		);

		add_filter(
			'wp_inline_script_attributes',
			static function ( $attributes ) {
				if ( ! isset( $attributes['data-cookieconsent'] ) ) {
					$attributes['data-cookieconsent'] = 'ignore';
				}
				return $attributes;
			},
			PHP_INT_MAX
		);

		// Stub registered at wp_head priority 7. Priority 1 is unsafe because
		// `wp_enqueue_scripts` itself fires AT wp_head:1, so callbacks added
		// during enqueue can't ride on the same priority. Priority 7 still
		// runs before `wp_print_head_scripts` (priority 9) emits the <script>
		// tags, which is what matters for ordering.
		add_action(
			'wp_head',
			static function () {
				echo "<script data-cookieconsent=\"ignore\">window.wp=window.wp||{};window.wp.i18n=window.wp.i18n||{setLocaleData:function(){},__:function(s){return s;},_x:function(s){return s;},_n:function(s,p,n){return n===1?s:p;},_nx:function(s,p,n){return n===1?s:p;},sprintf:function(){return arguments[0]||'';}};</script>\n";
			},
			7
		);

		// Cookie-consent / tracking / optimizer plugins commonly add their
		// banner-loading scripts via `add_action('wp_head', …, NEG_PRIORITY)`,
		// i.e. direct echo BEFORE WP's own script printing. That bypasses
		// `wp_enqueue_script` entirely, so `wp_dequeue_script` can't touch
		// them — and the result is the SPA's chrome inheriting a consent gate
		// that blocks `wp-api-fetch` / `wp-i18n` / our bundle and leaves the
		// page white.
		//
		// Buffer all of `wp_head`'s output, then strip any `<script>` tag that
		// didn't originate from WP core (`/wp-includes/`) or this plugin.
		// Inline scripts are kept when they carry a `wp-*` or `flow-ew-*` id
		// (those come from WP's enqueue pipeline). Everything else — Cookiebot's
		// banner script, GTM snippets, Hotjar inline, etc. — gets dropped on
		// the review shell only. The iframe still loads the real page through
		// the normal theme, so visitors-eye-view fidelity is preserved.
		add_action(
			'wp_head',
			static function (): void {
				ob_start();
			},
			PHP_INT_MIN
		);
		add_action(
			'wp_head',
			static function (): void {
				$buffered = ob_get_clean();
				if ( ! is_string( $buffered ) || '' === $buffered ) {
					return;
				}
				$plugin_dir_segment = basename( rtrim( FLOW_EW_PLUGIN_DIR, '/' ) );
				$cleaned            = preg_replace_callback(
					'#<script\b[^>]*(?:>[\s\S]*?</script>|\s*/?>)#i',
					static function ( $m ) use ( $plugin_dir_segment ) {
						$tag = $m[0];
						// WP core scripts (always allowed).
						if ( preg_match( '#\bsrc=["\'][^"\']*/wp-includes/#i', $tag ) ) {
							return $tag;
						}
						// This plugin's own bundles (path segment match — survives
						// rebrands of the plugin folder).
						if ( '' !== $plugin_dir_segment && preg_match( '#\bsrc=["\'][^"\']*/' . preg_quote( $plugin_dir_segment, '#' ) . '/#i', $tag ) ) {
							return $tag;
						}
						// Inline scripts emitted by WP's enqueue pipeline always
						// carry a `<handle>-js-(before|after|extra|translations)` id,
						// and our shield already tags them with
						// `data-cookieconsent="ignore"`. Keep those, drop bare
						// inline scripts that have no id (typical of direct-echo
						// banner / consent injectors).
						if ( preg_match( '#\bid=["\'](?:wp-|flow-ew-|react|jquery|regenerator|lodash)#i', $tag ) ) {
							return $tag;
						}
						return '';
					},
					$buffered
				);
				echo $cleaned; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- cleaned subset of WP's own wp_head output.
			},
			PHP_INT_MAX
		);
	}

	public static function ensure_react_jsx_runtime_registered(): void {
		$ver = defined( 'FLOW_EW_VERSION' ) ? FLOW_EW_VERSION : '1.0.0';

		if ( ! wp_script_is( 'react', 'registered' ) && wp_script_is( 'divi-vendor-react', 'registered' ) ) {
			wp_register_script(
				'react',
				'',
				[ 'divi-vendor-react' ],
				$ver,
				true
			);
		}

		if ( ! wp_script_is( 'react-jsx-runtime', 'registered' ) ) {
			wp_register_script( 'react-jsx-runtime', '', [ 'react' ], $ver, true );

			$shim = "(function(){if(window.ReactJSXRuntime)return;var R=window.React;if(!R)return;function jsx(type,props,key){props=props||{};var children=props.children;var rest={};for(var k in props){if(Object.prototype.hasOwnProperty.call(props,k)&&k!=='children'){rest[k]=props[k];}}if(key!==undefined)rest.key=key;if(children===undefined){return R.createElement(type,rest);}if(Array.isArray(children)){return R.createElement.apply(R,[type,rest].concat(children));}return R.createElement(type,rest,children);}window.ReactJSXRuntime={jsx:jsx,jsxs:jsx,Fragment:R.Fragment};})();";

			wp_add_inline_script( 'react-jsx-runtime', $shim, 'after' );
		}
	}

	/**
	 * Prefer SCRIPT_DEBUG-driven names, but fall back when only one bundle exists
	 * (e.g. after `npm run build:readable` without `build:minified`).
	 *
	 * @param string $absolute_path_without_extension Full path without .js / .min.js.
	 * @param string $ext                           "js" or "css".
	 */
	/**
	 * Enqueue the classic-editor bundle and `flowEW` localization payload. Shared
	 * by the Bricks and Elementor builder integrations, which load it before their
	 * own bundles.
	 */
	public static function enqueue_classic_editor_companion( int $post_id ): void {
		$asset_file = FLOW_EW_PLUGIN_DIR . 'build/classic-editor/index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = require $asset_file;
		$js    = self::webpack_build_suffix( FLOW_EW_PLUGIN_DIR . 'build/classic-editor/index', 'js' );
		$css   = self::webpack_build_suffix( FLOW_EW_PLUGIN_DIR . 'build/classic-editor/style-index', 'css' );

		self::ensure_react_jsx_runtime_registered();

		wp_enqueue_script(
			'flow-ew-classic-editor',
			FLOW_EW_PLUGIN_URL . 'build/classic-editor/index' . $js . '.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);
		wp_enqueue_style(
			'flow-ew-classic-editor',
			FLOW_EW_PLUGIN_URL . 'build/classic-editor/style-index' . $css . '.css',
			[],
			$asset['version']
		);
		wp_localize_script(
			'flow-ew-classic-editor',
			'flowEW',
			Plugin::get_editor_localization_data( $post_id )
		);
	}

	/**
	 * Enqueue a per-builder companion bundle (`bricks` or `elementor`) that
	 * depends on the classic-editor bundle. Caller must have already enqueued
	 * the companion via {@see enqueue_classic_editor_companion()}.
	 */
	public static function enqueue_builder_bundle( string $name ): void {
		$asset_file = FLOW_EW_PLUGIN_DIR . "build/{$name}/index.asset.php";
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = require $asset_file;
		$js    = self::webpack_build_suffix( FLOW_EW_PLUGIN_DIR . "build/{$name}/index", 'js' );
		$css   = self::webpack_build_suffix( FLOW_EW_PLUGIN_DIR . "build/{$name}/style-index", 'css' );

		wp_enqueue_script(
			"flow-ew-{$name}",
			FLOW_EW_PLUGIN_URL . "build/{$name}/index{$js}.js",
			array_merge( $asset['dependencies'], [ 'flow-ew-classic-editor' ] ),
			$asset['version'],
			true
		);
		wp_enqueue_style(
			"flow-ew-{$name}",
			FLOW_EW_PLUGIN_URL . "build/{$name}/style-index{$css}.css",
			[ 'flow-ew-classic-editor' ],
			$asset['version']
		);
	}

	public static function webpack_build_suffix( string $absolute_path_without_extension, string $ext ): string {
		$ext = strtolower( $ext );
		if ( ! in_array( $ext, [ 'js', 'css' ], true ) ) {
			return self::script_suffix();
		}

		$min_file   = $absolute_path_without_extension . '.min.' . $ext;
		$dev_file   = $absolute_path_without_extension . '.' . $ext;
		$prefer_min = ! ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG );

		if ( $prefer_min ) {
			if ( is_readable( $min_file ) ) {
				return '.min';
			}
			if ( is_readable( $dev_file ) ) {
				return '';
			}

			return '.min';
		}

		if ( is_readable( $dev_file ) ) {
			return '';
		}
		if ( is_readable( $min_file ) ) {
			return '.min';
		}

		return '';
	}

	/**
	 * Inline CSS that mirrors `--wp-admin-theme-color` (and darker variants)
	 * to the front-end review page so the chrome reflects the reviewer's
	 * chosen wp-admin color scheme. WP only emits these vars on wp-admin
	 * pages by default; review pages live on the front-end.
	 */
	public static function get_admin_theme_inline_css(): string {
		$scheme  = get_user_option( 'admin_color' );
		$scheme  = is_string( $scheme ) && '' !== $scheme ? $scheme : 'modern';
		$palette = self::admin_theme_palette( $scheme );
		$rgb     = sprintf( '%d, %d, %d', $palette['rgb'][0], $palette['rgb'][1], $palette['rgb'][2] );
		$d10_rgb = sprintf( '%d, %d, %d', $palette['darker_10'][0], $palette['darker_10'][1], $palette['darker_10'][2] );
		$d20_rgb = sprintf( '%d, %d, %d', $palette['darker_20'][0], $palette['darker_20'][1], $palette['darker_20'][2] );

		return sprintf(
			':root{--wp-admin-theme-color:%s;--wp-admin-theme-color--rgb:%s;--wp-admin-theme-color-darker-10:rgb(%s);--wp-admin-theme-color-darker-10--rgb:%s;--wp-admin-theme-color-darker-20:rgb(%s);--wp-admin-theme-color-darker-20--rgb:%s;}',
			$palette['hex'],
			$rgb,
			$d10_rgb,
			$d10_rgb,
			$d20_rgb,
			$d20_rgb
		);
	}

	/**
	 * Primary hex per built-in scheme. WP's `$_wp_admin_css_colors` doesn't
	 * expose the brand colour at a stable array index — different schemes use
	 * different positions — so we maintain our own map. Unknown / custom
	 * schemes fall back to "modern" (the WP 7 default).
	 *
	 * @return array{hex:string,rgb:array{0:int,1:int,2:int},darker_10:array{0:int,1:int,2:int},darker_20:array{0:int,1:int,2:int}}
	 */
	private static function admin_theme_palette( string $scheme ): array {
		static $primaries = [
			'modern'    => '#3858e9',
			'fresh'     => '#2271b1',
			'light'     => '#04a4cc',
			'blue'      => '#52accc',
			'midnight'  => '#e14d43',
			'sunrise'   => '#dd823b',
			'ectoplasm' => '#a3b745',
			'ocean'     => '#9ebaa0',
			'coffee'    => '#c7a589',
		];
		$hex              = $primaries[ $scheme ] ?? $primaries['modern'];
		$r                = (int) hexdec( substr( $hex, 1, 2 ) );
		$g                = (int) hexdec( substr( $hex, 3, 2 ) );
		$b                = (int) hexdec( substr( $hex, 5, 2 ) );
		return [
			'hex'       => $hex,
			'rgb'       => [ $r, $g, $b ],
			'darker_10' => [ (int) round( $r * 0.9 ), (int) round( $g * 0.9 ), (int) round( $b * 0.9 ) ],
			'darker_20' => [ (int) round( $r * 0.8 ), (int) round( $g * 0.8 ), (int) round( $b * 0.8 ) ],
		];
	}
}
