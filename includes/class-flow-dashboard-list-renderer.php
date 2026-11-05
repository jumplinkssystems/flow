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
	 * A bare list, for callers that print their own heading.
	 *
	 * @param array<int,array<string,mixed>> $items See item().
	 */
	public static function list( array $items ): void {
		echo '<ul class="flow-ew-dash-list">';
		foreach ( $items as $item ) {
			self::item( $item );
		}
		echo '</ul>';
	}

	/**
	 * @param array{title:string,url:string,meta:string[],links?:array<int,array{label:string,url:string}>,reviewers?:array<int,array{name:string,count:int}>,actions?:array<int,array{action:string,label:string,confirm?:string,disabled?:bool,title?:string}>,review_id?:int,edit_url?:string,status_key?:string,status_label?:string,type_key?:string,type_label?:string,hidden?:bool} $item
	 *   When `links` is set, the row uses the posts-list actions line: those
	 *   links, then Cancel / Approve / Request changes. `meta` (post type and
	 *   date) sits on the title row, and the status pill follows them. The
	 *   type badge is the last column, after the reviewer counts. Without
	 *   `links` (the dashboard widget, self reviews) the meta line and optional
	 *   Edit link stay under the title, and the status pill stays at the end
	 *   of the row. The reviewer list, when present, is its own column.
	 *   `meta` fragments and reviewer `name`s are pre-escaped HTML.
	 */
	public static function item( array $item ): void {
		$class = 'flow-ew-dash-item' . ( ! empty( $item['hidden'] ) ? ' flow-ew-dash-item--hidden' : '' );
		printf( '<li class="%s">', esc_attr( $class ) );
		echo '<div class="flow-ew-dash-item__main">';
		$has_type = ! empty( $item['type_label'] );
		if ( $has_type ) {
			echo '<span class="flow-ew-dash-item__head">';
		}
		printf(
			'<a class="flow-ew-dash-item__title" href="%s">%s</a>',
			esc_url( (string) $item['url'] ),
			esc_html( (string) $item['title'] )
		);
		if ( $has_type ) {
			self::meta( (array) ( $item['meta'] ?? [] ) );
			self::status_pill( $item );
			echo '</span>';
		}
		if ( isset( $item['links'] ) ) {
			self::row_actions( $item );
		} else {
			if ( ! empty( $item['edit_url'] ) ) {
				printf(
					'<a class="flow-ew-dashboard-page__edit" href="%s">%s</a>',
					esc_url( (string) $item['edit_url'] ),
					esc_html__( 'Edit', 'jumplinks-editorial-workflow' )
				);
			}
			self::meta( (array) ( $item['meta'] ?? [] ) );
		}
		echo '</div>';
		self::reviewer_rows( (array) ( $item['reviewers'] ?? [] ) );
		if ( $has_type ) {
			self::type_badge( $item );
		} else {
			self::status_pill( $item );
		}
		echo '</li>';
	}

	/**
	 * @param array<string,mixed> $item
	 */
	private static function type_badge( array $item ): void {
		if ( empty( $item['type_label'] ) ) {
			return;
		}
		printf(
			'<span class="flow-ew-dash-type flow-ew-dash-type--%s">%s</span>',
			esc_attr( (string) ( $item['type_key'] ?? '' ) ),
			esc_html( (string) $item['type_label'] )
		);
	}

	/**
	 * @param array<string,mixed> $item
	 */
	private static function status_pill( array $item ): void {
		if ( ! isset( $item['status_key'] ) ) {
			return;
		}
		printf(
			'<span class="flow-ew-dashboard-page__status flow-ew-dashboard-page__status--%s"><span class="flow-ew-status-pill__dot" aria-hidden="true"></span>%s</span>',
			esc_attr( (string) $item['status_key'] ),
			esc_html( (string) ( $item['status_label'] ?? '' ) )
		);
	}

	/**
	 * One reviewer per row, each with their own comment count. More than two
	 * keeps the first name and puts Show all on the second row.
	 *
	 * @param array<int,array{name:string,count:int}> $reviewers `name` is pre-escaped.
	 */
	private static function reviewer_rows( array $reviewers ): void {
		if ( [] === $reviewers ) {
			return;
		}
		$extra = count( $reviewers ) > 2;
		echo '<div class="flow-ew-dash-reviewers-col">';
		echo '<ul class="flow-ew-dash-reviewers">';
		foreach ( $reviewers as $index => $reviewer ) {
			$count = (int) ( $reviewer['count'] ?? 0 );
			$label = sprintf(
				/* translators: %d: number of comments a reviewer left. */
				_n( '%d comment', '%d comments', $count, 'jumplinks-editorial-workflow' ),
				$count
			);
			printf(
				'<li class="flow-ew-dash-reviewer%4$s"><span class="flow-ew-dash-reviewer__name">%1$s</span><span class="flow-ew-dash-reviewer__comments" title="%2$s">%3$d</span></li>',
				(string) ( $reviewer['name'] ?? '' ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- pre-escaped by Dashboard_Rows::item().
				esc_attr( $label ),
				(int) $count, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- integer, no escaping needed.
				$extra && $index > 0 ? ' flow-ew-dash-reviewer--extra' : ''
			);
		}
		echo '</ul>';
		if ( $extra ) {
			printf(
				'<button type="button" class="flow-ew-dash-reviewers__toggle" aria-expanded="false">%s</button>',
				esc_html__( 'Show all', 'jumplinks-editorial-workflow' )
			);
		}
		echo '</div>';
	}

	/**
	 * Post type and date, joined with a middot. Fragments are pre-escaped.
	 *
	 * @param string[] $fragments
	 */
	private static function meta( array $fragments ): void {
		$fragments = array_values( array_filter( $fragments, static fn( $fragment ): bool => '' !== (string) $fragment ) );
		if ( [] === $fragments ) {
			return;
		}
		echo '<span class="flow-ew-dash-item__meta">';
		echo implode( ' &middot; ', $fragments ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- fragments pre-escaped.
		echo '</span>';
	}

	/**
	 * Posts-list style action line: Open review | Edit | View | Cancel,
	 * or Approve | Request changes.
	 *
	 * @param array<string,mixed> $item
	 */
	private static function row_actions( array $item ): void {
		$links   = (array) ( $item['links'] ?? [] );
		$actions = (array) ( $item['actions'] ?? [] );
		if ( [] === $links && [] === $actions ) {
			return;
		}

		$review_id = (int) ( $item['review_id'] ?? 0 );
		printf(
			'<div class="flow-ew-dash-row-actions"%s>',
			$review_id > 0 && [] !== $actions ? ' data-review-id="' . esc_attr( (string) $review_id ) . '"' : ''
		);

		$printed = false;
		foreach ( $links as $link ) {
			if ( ! is_array( $link ) || '' === (string) ( $link['url'] ?? '' ) ) {
				continue;
			}
			if ( $printed ) {
				echo '<span class="flow-ew-dash-row-sep" aria-hidden="true"> | </span>';
			}
			$printed = true;
			printf(
				'<span class="flow-ew-dash-row-action"><a href="%s">%s</a></span>',
				esc_url( (string) $link['url'] ),
				esc_html( (string) ( $link['label'] ?? '' ) )
			);
		}
		foreach ( $actions as $action ) {
			if ( ! is_array( $action ) || '' === (string) ( $action['action'] ?? '' ) ) {
				continue;
			}
			if ( $printed ) {
				echo '<span class="flow-ew-dash-row-sep" aria-hidden="true"> | </span>';
			}
			$printed = true;
			self::row_action_control( $action );
		}
		echo '</div>';
	}

	/**
	 * One decision in the action line. A disabled one is plain text so it
	 * cannot be submitted; the title says why.
	 *
	 * @param array{action:string,label:string,confirm?:string,disabled?:bool,title?:string} $action
	 */
	private static function row_action_control( array $action ): void {
		if ( ! empty( $action['disabled'] ) ) {
			printf(
				'<span class="flow-ew-dash-row-action is-disabled"%s>%s</span>',
				! empty( $action['title'] ) ? ' title="' . esc_attr( (string) $action['title'] ) . '"' : '',
				esc_html( (string) $action['label'] )
			);
			return;
		}
		printf(
			'<span class="flow-ew-dash-row-action"><button type="button" class="flow-ew-dash-action" data-action="%1$s"%2$s>%3$s</button></span>',
			esc_attr( (string) $action['action'] ),
			isset( $action['confirm'] ) && '' !== (string) $action['confirm'] ? ' data-confirm="' . esc_attr( (string) $action['confirm'] ) . '"' : '',
			esc_html( (string) $action['label'] )
		);
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
	 * A user's display name as a pre-escaped fragment, linked to `$person_url`
	 * when one is given. '' for unknown users.
	 *
	 * @param callable|null $person_url fn( string $person ): string
	 */
	public static function person_link( int $user_id, ?callable $person_url = null ): string {
		$user = $user_id > 0 ? get_userdata( $user_id ) : false;
		if ( ! $user instanceof \WP_User ) {
			return '';
		}
		return self::person_filter_link( $user->display_name, (string) $user_id, $person_url );
	}

	/**
	 * Display name linked to the person filter. `$label` is escaped here.
	 *
	 * @param callable|null $person_url fn( string $person ): string
	 */
	public static function person_filter_link( string $label, string $person, ?callable $person_url = null ): string {
		$label = trim( $label );
		if ( '' === $label ) {
			return '';
		}
		if ( null === $person_url || '' === $person ) {
			return esc_html( $label );
		}
		return sprintf(
			'<a class="flow-ew-dash-person-link" href="%s">%s</a>',
			esc_url( (string) $person_url( $person ) ),
			esc_html( $label )
		);
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
