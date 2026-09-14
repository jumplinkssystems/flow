<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Markup for the review lists on the Flow dashboard page, the dashboard
 * widget, and the Pro site-review sections. Callers shape rows into items;
 * this class only prints.
 */
final class Dashboard_List_Renderer {

	/**
	 * @param array<int,array<string,mixed>> $items  See item().
	 * @param array{page?:bool,description?:string,heading_tag?:string,after_html?:string} $opts
	 *   `after_html` is trusted, pre-escaped markup printed inside the section.
	 */
	public static function section( string $slug, string $heading, array $items, array $opts = [] ): void {
		if ( [] === $items ) {
			return;
		}
		$tag   = 'h3' === ( $opts['heading_tag'] ?? 'h2' ) ? 'h3' : 'h2';
		$class = 'flow-ew-dash-section flow-ew-dash-section--' . $slug
			. ( ! empty( $opts['page'] ) ? ' flow-ew-dashboard-page__section' : '' );

		printf( '<div class="%s">', esc_attr( $class ) );
		printf(
			'<%1$s class="flow-ew-dash-section__title">%2$s<span class="flow-ew-dash-section__count">%3$d</span></%1$s>',
			$tag, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- 'h2' or 'h3'.
			esc_html( $heading ),
			count( $items )
		);
		if ( ! empty( $opts['description'] ) ) {
			printf( '<p class="flow-ew-dashboard-page__section-desc">%s</p>', esc_html( (string) $opts['description'] ) );
		}
		echo '<ul class="flow-ew-dash-list">';
		foreach ( $items as $item ) {
			self::item( $item );
		}
		echo '</ul>';
		if ( ! empty( $opts['after_html'] ) ) {
			echo $opts['after_html']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- caller escapes.
		}
		echo '</div>';
	}

	/**
	 * @param array{title:string,url:string,meta:string[],edit_url?:string,status_key?:string,status_label?:string,hidden?:bool} $item
	 *   `meta` fragments are pre-escaped HTML joined with a middot.
	 */
	public static function item( array $item ): void {
		$class = 'flow-ew-dash-item' . ( ! empty( $item['hidden'] ) ? ' flow-ew-dash-item--hidden' : '' );
		printf( '<li class="%s">', esc_attr( $class ) );
		echo '<div class="flow-ew-dash-item__main">';
		printf(
			'<a class="flow-ew-dash-item__title" href="%s">%s</a>',
			esc_url( (string) $item['url'] ),
			esc_html( (string) $item['title'] )
		);
		if ( ! empty( $item['edit_url'] ) ) {
			printf(
				'<a class="flow-ew-dashboard-page__edit" href="%s">%s</a>',
				esc_url( (string) $item['edit_url'] ),
				esc_html__( 'Edit', 'jumplinks-editorial-workflow' )
			);
		}
		echo '<span class="flow-ew-dash-item__meta">';
		echo implode( ' &middot; ', (array) $item['meta'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- fragments pre-escaped.
		echo '</span>';
		echo '</div>';
		if ( isset( $item['status_key'] ) ) {
			printf(
				'<span class="flow-ew-dashboard-page__status flow-ew-dashboard-page__status--%s"><span class="flow-ew-status-pill__dot" aria-hidden="true"></span>%s</span>',
				esc_attr( (string) $item['status_key'] ),
				esc_html( (string) ( $item['status_label'] ?? '' ) )
			);
		}
		echo '</li>';
	}

	/** "2 hours ago" for a UTC MySQL timestamp, or '' when unparseable. */
	public static function relative_time( ?string $mysql_utc ): string {
		$ts = strtotime( (string) $mysql_utc . ' UTC' );
		if ( ! $ts ) {
			return '';
		}
		/* translators: %s: human-readable time difference, e.g. "2 hours". */
		return sprintf( __( '%s ago', 'jumplinks-editorial-workflow' ), human_time_diff( $ts, time() ) );
	}

	public static function post_type_label( \WP_Post $post ): string {
		$obj = get_post_type_object( $post->post_type );
		return ( $obj && isset( $obj->labels->singular_name ) ) ? (string) $obj->labels->singular_name : $post->post_type;
	}

	public static function post_title( \WP_Post $post ): string {
		return '' !== $post->post_title ? $post->post_title : __( '(no title)', 'jumplinks-editorial-workflow' );
	}

	/**
	 * "Reviewer: Jane" / "Reviewers: Jane, John" as a pre-escaped fragment.
	 *
	 * @param string[] $names Pre-escaped display names.
	 */
	public static function reviewers_meta( array $names ): string {
		if ( [] === $names ) {
			return '';
		}
		$label = _n( 'Reviewer:', 'Reviewers:', count( $names ), 'jumplinks-editorial-workflow' );
		return esc_html( $label ) . ' ' . implode( ', ', $names );
	}
}
