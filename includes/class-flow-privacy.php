<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tools → Export / Erase Personal Data integration. Flow stores personal data
 * about people who need not have an account: external reviewers invited by
 * email, anonymous commenters on public reviews, and open-to-public site
 * reviewers. Everything is keyed by email address, which is what WordPress
 * hands the exporter and eraser.
 */
final class Privacy {

	const KEY = 'jumplinks-editorial-workflow';

	public static function boot(): void {
		add_filter( 'wp_privacy_personal_data_exporters', [ __CLASS__, 'register_exporter' ] );
		add_filter( 'wp_privacy_personal_data_erasers', [ __CLASS__, 'register_eraser' ] );
	}

	/**
	 * @param array<string,array<string,mixed>> $exporters
	 * @return array<string,array<string,mixed>>
	 */
	public static function register_exporter( array $exporters ): array {
		$exporters[ self::KEY ] = [
			'exporter_friendly_name' => __( 'Jumplinks Flow', 'jumplinks-editorial-workflow' ),
			'callback'               => [ __CLASS__, 'export' ],
		];
		return $exporters;
	}

	/**
	 * @param array<string,array<string,mixed>> $erasers
	 * @return array<string,array<string,mixed>>
	 */
	public static function register_eraser( array $erasers ): array {
		$erasers[ self::KEY ] = [
			'eraser_friendly_name' => __( 'Jumplinks Flow', 'jumplinks-editorial-workflow' ),
			'callback'             => [ __CLASS__, 'erase' ],
		];
		return $erasers;
	}

	/**
	 * @return array{data:array<int,array<string,mixed>>,done:bool}
	 */
	public static function export( string $email_address, int $page = 1 ): array {
		unset( $page );
		$email = strtolower( trim( $email_address ) );
		$items = [];

		foreach ( Email_Review_Invites_DB::get_all_for_email( $email ) as $row ) {
			$review  = DB::get_review( (int) $row->review_id );
			$items[] = self::item(
				'flow-review-invites',
				__( 'Flow review invitations', 'jumplinks-editorial-workflow' ),
				'flow-invite-' . (int) $row->id,
				[
					__( 'Email', 'jumplinks-editorial-workflow' )      => (string) $row->email,
					__( 'Name', 'jumplinks-editorial-workflow' )       => (string) ( $row->display_name ?? '' ),
					__( 'Content', 'jumplinks-editorial-workflow' )    => $review ? self::post_title( (int) $review->post_id ) : '',
					__( 'Status', 'jumplinks-editorial-workflow' )     => (string) ( $row->status ?? '' ),
					__( 'Invited at', 'jumplinks-editorial-workflow' ) => (string) ( $row->created_at ?? '' ),
				]
			);
		}

		foreach ( DB::get_comments_by_author_email( $email ) as $row ) {
			$items[] = self::item(
				'flow-review-comments',
				__( 'Flow review comments', 'jumplinks-editorial-workflow' ),
				'flow-comment-' . (int) $row->id,
				[
					__( 'Name', 'jumplinks-editorial-workflow' )    => (string) ( $row->author_name ?? '' ),
					__( 'Email', 'jumplinks-editorial-workflow' )   => (string) ( $row->author_email ?? '' ),
					__( 'Content', 'jumplinks-editorial-workflow' ) => self::post_title( (int) $row->post_id ),
					__( 'Comment', 'jumplinks-editorial-workflow' ) => wp_strip_all_tags( (string) $row->comment_text ),
					__( 'Date', 'jumplinks-editorial-workflow' )    => (string) ( $row->created_at ?? '' ),
				]
			);
		}

		if ( self::pro_active() ) {
			foreach ( Pro\Site_Review_Roster_DB::get_all_for_email( $email ) as $row ) {
				$site_review = Pro\Site_Review_DB::get( (int) $row->site_review_id );
				$items[]     = self::item(
					'flow-site-review-invites',
					__( 'Flow site review invitations', 'jumplinks-editorial-workflow' ),
					'flow-site-invite-' . (int) $row->id,
					[
						__( 'Email', 'jumplinks-editorial-workflow' )       => (string) ( $row->email ?? '' ),
						__( 'Name', 'jumplinks-editorial-workflow' )        => (string) ( $row->display_name ?? '' ),
						__( 'Site review', 'jumplinks-editorial-workflow' ) => $site_review ? (string) ( $site_review->title ?? '' ) : '',
						__( 'Status', 'jumplinks-editorial-workflow' )      => (string) ( $row->status ?? '' ),
						__( 'Invited at', 'jumplinks-editorial-workflow' )  => (string) ( $row->created_at ?? '' ),
					]
				);
			}

			foreach ( Pro\Site_Review_Comments_DB::get_by_author_email( $email ) as $row ) {
				$items[] = self::item(
					'flow-site-review-comments',
					__( 'Flow site review comments', 'jumplinks-editorial-workflow' ),
					'flow-site-comment-' . (int) $row->id,
					[
						__( 'Name', 'jumplinks-editorial-workflow' )    => (string) ( $row->author_name ?? '' ),
						__( 'Email', 'jumplinks-editorial-workflow' )   => (string) ( $row->author_email ?? '' ),
						__( 'Page', 'jumplinks-editorial-workflow' )    => (string) ( $row->url ?? '' ),
						__( 'Comment', 'jumplinks-editorial-workflow' ) => wp_strip_all_tags( (string) $row->comment_text ),
						__( 'Date', 'jumplinks-editorial-workflow' )    => (string) ( $row->created_at ?? '' ),
					]
				);
			}

			$user = get_user_by( 'email', $email );
			if ( $user ) {
				$member_id = (string) get_user_meta( (int) $user->ID, Pro\Slack_User_Resolver::META_MEMBER_ID, true );
				if ( '' !== $member_id ) {
					$items[] = self::item(
						'flow-slack',
						__( 'Flow Slack notifications', 'jumplinks-editorial-workflow' ),
						'flow-slack-' . (int) $user->ID,
						[
							__( 'Slack member ID', 'jumplinks-editorial-workflow' ) => $member_id,
						]
					);
				}
			}
		}

		return [
			'data' => $items,
			'done' => true,
		];
	}

	/**
	 * Invitations are deleted outright (they are the person's access tokens);
	 * comments keep their text but lose the name and address, as WordPress
	 * core does for its own comments.
	 *
	 * @return array{items_removed:bool,items_retained:bool,messages:string[],done:bool}
	 */
	public static function erase( string $email_address, int $page = 1 ): array {
		unset( $page );
		$email   = strtolower( trim( $email_address ) );
		$removed = 0;

		$removed += Email_Review_Invites_DB::delete_all_for_email( $email );
		$removed += DB::anonymize_comments_by_author_email( $email );

		if ( self::pro_active() ) {
			$removed += Pro\Site_Review_Roster_DB::anonymize_for_email( $email );
			$removed += Pro\Site_Review_Comments_DB::anonymize_by_author_email( $email );

			$user = get_user_by( 'email', $email );
			if ( $user ) {
				foreach ( [ Pro\Slack_User_Resolver::META_MEMBER_ID, Pro\Slack_User_Profile::FIELD_OPT ] as $meta_key ) {
					if ( delete_user_meta( (int) $user->ID, $meta_key ) ) {
						++$removed;
					}
				}
			}
		}

		return [
			'items_removed'  => $removed > 0,
			'items_retained' => false,
			'messages'       => [],
			'done'           => true,
		];
	}

	private static function pro_active(): bool {
		return function_exists( 'flow_ew_pro_should_boot' )
			&& \flow_ew_pro_should_boot()
			&& class_exists( Pro\Site_Review_Roster_DB::class )
			&& class_exists( Pro\Site_Review_Comments_DB::class );
	}

	/**
	 * @param array<string,string> $fields Label => value.
	 * @return array<string,mixed>
	 */
	private static function item( string $group_id, string $group_label, string $item_id, array $fields ): array {
		$data = [];
		foreach ( $fields as $name => $value ) {
			$data[] = [
				'name'  => $name,
				'value' => $value,
			];
		}
		return [
			'group_id'    => $group_id,
			'group_label' => $group_label,
			'item_id'     => $item_id,
			'data'        => $data,
		];
	}

	private static function post_title( int $post_id ): string {
		$title = $post_id > 0 ? get_the_title( $post_id ) : '';
		return '' !== $title ? $title : sprintf( '#%d', $post_id );
	}
}
