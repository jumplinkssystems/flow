<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Notification {

	private static function review_page_url( int $review_id, int $post_id ): string {
		$review = DB::get_review( $review_id );
		$stored = $review ? (int) ( $review->revision_id ?? 0 ) : 0;
		$rev    = Review::get_effective_preview_revision_id( $post_id, $stored );

		return Review::get_preview_url( $review_id, $rev, $post_id );
	}

	private static function requester_userdata( int $review_id, \WP_Post $post ): ?\WP_User {
		$review = DB::get_review( $review_id );
		$uid    = $review ? (int) ( $review->requester_id ?? 0 ) : 0;
		if ( $uid > 0 ) {
			$user = get_userdata( $uid );
			if ( $user instanceof \WP_User ) {
				return $user;
			}
		}

		$author = get_userdata( (int) $post->post_author );

		return $author instanceof \WP_User ? $author : null;
	}

	private static function site_name(): string {
		return wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
	}

	/**
	 * Display name of whoever acted as reviewer: the WP user, or the current
	 * email invitee (name, falling back to address).
	 */
	private static function reviewer_display_name( int $review_id, int $reviewer_id ): string {
		if ( $reviewer_id > 0 ) {
			$reviewer = get_userdata( $reviewer_id );
			return $reviewer ? (string) $reviewer->display_name : '';
		}
		$invite = Email_Review::current_invite_for_review( $review_id );
		if ( ! $invite ) {
			$invites = Email_Review_Invites_DB::get_for_review( $review_id );
			$invite  = $invites[0] ?? null;
		}
		if ( ! $invite ) {
			return '';
		}
		$name = trim( (string) ( $invite->display_name ?? '' ) );
		return '' !== $name ? $name : (string) $invite->email;
	}

	/**
	 * Mail the WP reviewer when content is sent or resubmitted. Email invitees
	 * get their own invite mail; when no WP reviewer is assigned that is all.
	 *
	 * @param array<string,mixed> $context Passed to `flow_ew_should_send_email_notification`.
	 */
	private static function notify_reviewer( int $review_id, int $post_id, int $counterpart_id, string $event, array $context, string $subject_tpl, string $message_tpl ): void {
		$post   = get_post( $post_id );
		$review = DB::get_review( $review_id );
		if ( ! $post || ! $review ) {
			return;
		}

		$invites = Email_Review_Invites_DB::get_for_review( $review_id );
		if ( ! empty( $invites ) ) {
			Email_Review::send_invite_emails( $review_id, $post_id );
			if ( (int) $review->reviewer_id <= 0 ) {
				return;
			}
		}

		$reviewer    = get_userdata( (int) $review->reviewer_id );
		$counterpart = get_userdata( $counterpart_id );
		if ( ! $reviewer || ! $counterpart ) {
			return;
		}

		if ( ! (bool) \apply_filters( 'flow_ew_should_send_email_notification', true, $event, $context ) ) {
			return;
		}

		$subject = sprintf( $subject_tpl, self::site_name(), $post->post_title );
		$message = sprintf(
			$message_tpl,
			$reviewer->display_name,
			$counterpart->display_name,
			$post->post_title,
			self::review_page_url( $review_id, $post_id ),
			self::site_name()
		);

		Mailer::queue( $reviewer->user_email, $subject, $message );
	}

	/** Mail the requester (or post author) after a reviewer decision. */
	private static function notify_requester( int $review_id, int $post_id, int $reviewer_id, string $event, string $subject_tpl, string $message_tpl ): void {
		$post   = get_post( $post_id );
		$author = $post ? self::requester_userdata( $review_id, $post ) : null;
		if ( ! $post || ! $author ) {
			return;
		}

		$reviewer_name = self::reviewer_display_name( $review_id, $reviewer_id );
		if ( '' === $reviewer_name ) {
			return;
		}

		$context = compact( 'review_id', 'post_id', 'reviewer_id' );
		if ( ! (bool) \apply_filters( 'flow_ew_should_send_email_notification', true, $event, $context ) ) {
			return;
		}

		$subject = sprintf( $subject_tpl, self::site_name(), $post->post_title );
		$message = sprintf(
			$message_tpl,
			$author->display_name,
			$reviewer_name,
			$post->post_title,
			self::review_page_url( $review_id, $post_id ),
			self::site_name()
		);

		Mailer::queue( $author->user_email, $subject, $message );
	}

	public static function on_review_sent( int $review_id, int $post_id, int $sender_id ): void {
		$review = DB::get_review( $review_id );
		self::notify_reviewer(
			$review_id,
			$post_id,
			$review ? (int) $review->requester_id : 0,
			'review_sent',
			compact( 'review_id', 'post_id' ) + [ 'sender_id' => $sender_id ],
			/* translators: 1: site name, 2: content title */
			__( '[%1$s] Ready for your review: %2$s', 'jumplinks-editorial-workflow' ),
			/* translators: 1: reviewer display name, 2: requester display name, 3: post title, 4: review page URL, 5: site name */
			__( "Hi %1\$s,\n\n%2\$s has sent \"%3\$s\" for your review.\n\nOpen the review page:\n%4\$s\n\n— %5\$s", 'jumplinks-editorial-workflow' )
		);
	}

	public static function on_review_resubmitted( int $review_id, int $post_id, int $requester_id ): void {
		self::notify_reviewer(
			$review_id,
			$post_id,
			$requester_id,
			'review_resubmitted',
			compact( 'review_id', 'post_id', 'requester_id' ),
			/* translators: 1: site name, 2: content title */
			__( '[%1$s] Changes made on: %2$s', 'jumplinks-editorial-workflow' ),
			/* translators: 1: reviewer display name, 2: author display name, 3: post title, 4: review page URL, 5: site name */
			__( "Hi %1\$s,\n\n%2\$s has updated \"%3\$s\" after your change request. Open the review page to check again:\n\n%4\$s\n\n— %5\$s", 'jumplinks-editorial-workflow' )
		);
	}

	public static function on_changes_requested( int $review_id, int $post_id, int $reviewer_id ): void {
		self::notify_requester(
			$review_id,
			$post_id,
			$reviewer_id,
			'changes_requested',
			/* translators: 1: site name, 2: post title */
			__( '[%1$s] Changes requested on: %2$s', 'jumplinks-editorial-workflow' ),
			/* translators: 1: author name, 2: reviewer name, 3: post title, 4: review page URL, 5: site name */
			__( "Hi %1\$s,\n\n%2\$s has requested changes on \"%3\$s\".\n\nOpen the review page:\n%4\$s\n\n— %5\$s", 'jumplinks-editorial-workflow' )
		);
	}

	public static function on_review_approved( int $review_id, int $post_id, int $reviewer_id ): void {
		self::notify_requester(
			$review_id,
			$post_id,
			$reviewer_id,
			'review_approved',
			/* translators: 1: site name, 2: post title */
			__( '[%1$s] Review approved: %2$s', 'jumplinks-editorial-workflow' ),
			/* translators: 1: author name, 2: reviewer name, 3: post title, 4: review page URL, 5: site name */
			__( "Hi %1\$s,\n\n%2\$s has approved \"%3\$s\". You can publish when you are ready.\n\nOpen the review page:\n%4\$s\n\n— %5\$s", 'jumplinks-editorial-workflow' )
		);
	}
}
