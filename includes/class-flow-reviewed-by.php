<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Frontend “Reviewed by” credit in the standard block-theme post metadata.
 */
class Reviewed_By {

	const MARKER_CLASS = 'flow-ew-reviewed-by';

	public function boot(): void {
		add_filter( 'render_block_core/group', [ $this, 'append_to_post_meta_group' ], 20, 3 );
	}

	/**
	 * @param array<string,mixed> $block
	 * @param object|null         $wp_block
	 */
	public function append_to_post_meta_group( string $content, array $block, $wp_block = null ): string {
		unset( $block );
		if (
			'' === $content
			|| is_admin()
			|| false !== strpos( $content, self::MARKER_CLASS )
			|| false === strpos( $content, 'wp-block-post-author-name' )
			|| false === strpos( $content, 'taxonomy-category' )
		) {
			return $content;
		}

		$post_id = 0;
		if ( is_object( $wp_block ) && isset( $wp_block->context['postId'] ) ) {
			$post_id = (int) $wp_block->context['postId'];
		}
		if ( $post_id <= 0 ) {
			$post_id = get_the_ID() ? (int) get_the_ID() : 0;
		}

		$credit = $this->get_credit_html( $post_id );
		if ( '' === $credit ) {
			return $content;
		}

		// Core's category block contains links and spans, but no nested divs.
		// Append inside the same metadata group, immediately after that block.
		$pattern = '/(<div\b[^>]*class=(["\'])[^"\']*\btaxonomy-category\b[^"\']*\2[^>]*>.*?<\/div>)/s';
		$result  = preg_replace_callback(
			$pattern,
			static function ( array $matches ) use ( $credit ): string {
				return $matches[1] . $credit;
			},
			$content,
			1
		);

		return is_string( $result ) ? $result : $content;
	}

	public function get_credit_html( int $post_id ): string {
		$reviewers = $this->get_reviewers( $post_id );
		if ( empty( $reviewers ) ) {
			return '';
		}

		$links = [];
		foreach ( $reviewers as $reviewer ) {
			$links[] = sprintf(
				'<a href="%1$s" rel="author">%2$s</a>',
				esc_url( $reviewer['url'] ),
				esc_html( $reviewer['name'] )
			);
		}

		$html = sprintf(
			/* translators: %s: reviewer display name or locale-formatted list of names */
			__( 'Reviewed by %s', 'jumplinks-editorial-workflow' ),
			wp_sprintf_l( '%l', $links )
		);

		// `flex-basis` forces its own row inside core's flex post-meta group.
		return sprintf(
			'<div class="%1$s" style="flex-basis:100%%">%2$s</div>',
			esc_attr( self::MARKER_CLASS ),
			wp_kses(
				$html,
				[
					'a' => [
						'href' => [],
						'rel'  => [],
					],
				]
			)
		);
	}

	/**
	 * @return string[]
	 */
	public function get_reviewer_names( int $post_id ): array {
		return array_map(
			static function ( array $reviewer ): string {
				return $reviewer['name'];
			},
			$this->get_reviewers( $post_id )
		);
	}

	/**
	 * @return array<int,array{name:string,url:string}>
	 */
	public function get_reviewers( int $post_id ): array {
		if ( $post_id <= 0 || ! $this->should_display( $post_id ) ) {
			return [];
		}

		$review = DB::get_active_review( $post_id );
		if ( ! is_object( $review ) || Review::STATUS_APPROVED !== (string) ( $review->status ?? '' ) ) {
			return [];
		}

		$ids = $this->collect_wordpress_reviewer_ids( $review );
		$ids = array_values( array_unique( array_filter( array_map( 'intval', $ids ) ) ) );
		if ( empty( $ids ) ) {
			return [];
		}

		$reviewers = [];
		foreach ( $ids as $user_id ) {
			$user = get_userdata( $user_id );
			if ( ! $user || ! isset( $user->display_name ) ) {
				continue;
			}
			$name = trim( (string) $user->display_name );
			if ( '' === $name ) {
				continue;
			}
			$reviewers[] = [
				'name' => $name,
				'url'  => get_author_posts_url( $user_id ),
			];
		}

		return $reviewers;
	}

	/**
	 * @return int[]
	 */
	private function collect_wordpress_reviewer_ids( object $review ): array {
		$ids       = [];
		$review_id = (int) ( $review->id ?? 0 );

		if (
			$review_id > 0
			&& function_exists( 'flow_ew_is_pro_build' )
			&& flow_ew_is_pro_build()
			&& class_exists( Pro\Pro_DB::class )
		) {
			foreach ( Pro\Pro_DB::get_reviewers_for_review( $review_id ) as $row ) {
				$user_id = (int) ( $row->user_id ?? 0 );
				$status  = (string) ( $row->status ?? '' );
				if ( $user_id > 0 && Review::STATUS_APPROVED === $status ) {
					$ids[] = $user_id;
				}
			}
		}

		if ( empty( $ids ) ) {
			$fallback = (int) ( $review->reviewer_id ?? 0 );
			if ( $fallback > 0 ) {
				$ids[] = $fallback;
			}
		}

		return $ids;
	}

	private function should_display( int $post_id ): bool {
		if ( is_admin() || is_feed() ) {
			return false;
		}
		if ( ! Settings::should_show_reviewed_by() ) {
			return false;
		}
		if ( ! is_singular() && ! is_home() && ! is_front_page() && ! is_archive() && ! is_search() ) {
			return false;
		}

		$post = get_post( $post_id );
		if ( $post instanceof \WP_Post ) {
			return Settings::is_post_type_supported( $post->post_type );
		}
		if ( is_object( $post ) && isset( $post->post_type ) ) {
			return Settings::is_post_type_supported( (string) $post->post_type );
		}

		return false;
	}
}
