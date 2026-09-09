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

	public static function on_review_sent( int $review_id, int $post_id, int $sender_id ): void {
		$post   = get_post( $post_id );
		$review = DB::get_review( $review_id );
		if ( ! $post || ! $review ) {
			return;
		}

		$invites = Email_Review_Invites_DB::get_for_review( $review_id );
		if ( ! empty( $invites ) ) {
			Email_Review::send_invite_emails( $review_id, $post_id );
			// When Free has only email invite(s) and no WP primary reviewer, stop here.
			if ( (int) $review->reviewer_id <= 0 ) {
				return;
			}
		}

		$reviewer  = get_userdata( (int) $review->reviewer_id );
		$requester = get_userdata( (int) $review->requester_id );

		if ( ! $reviewer || ! $requester ) {
			return;
		}

		$context = compact( 'review_id', 'post_id' ) + [ 'sender_id' => $sender_id ];
		if ( ! (bool) \apply_filters( 'flow_ew_should_send_email_notification', true, 'review_sent', $context ) ) {
			return;
		}

		$review_link = self::review_page_url( $review_id, $post_id );

		$subject = sprintf(
			/* translators: 1: site name, 2: content title */
			__( '[%1$s] Ready for your review: %2$s', 'jumplinks-editorial-workflow' ),
			wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
			$post->post_title
		);

		$message = sprintf(
			/* translators: 1: reviewer display name, 2: requester display name, 3: post title, 4: review page URL, 5: site name */
			__(
				"Hi %1\$s,\n\n%2\$s has sent \"%3\$s\" for your review.\n\nOpen the review page:\n%4\$s\n\n— %5\$s",
				'jumplinks-editorial-workflow'
			),
			$reviewer->display_name,
			$requester->display_name,
			$post->post_title,
			$review_link,
			wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES )
		);

		wp_mail( $reviewer->user_email, $subject, $message );
	}

	public static function on_review_resubmitted( int $review_id, int $post_id, int $requester_id ): void {
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

		$reviewer  = get_userdata( (int) $review->reviewer_id );
		$requester = get_userdata( $requester_id );

		if ( ! $reviewer || ! $requester ) {
			return;
		}

		$context = compact( 'review_id', 'post_id', 'requester_id' );
		if ( ! (bool) \apply_filters( 'flow_ew_should_send_email_notification', true, 'review_resubmitted', $context ) ) {
			return;
		}

		$review_link = self::review_page_url( $review_id, $post_id );

		$subject = sprintf(
			/* translators: 1: site name, 2: content title */
			__( '[%1$s] Changes made on: %2$s', 'jumplinks-editorial-workflow' ),
			wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
			$post->post_title
		);

		$message = sprintf(
			/* translators: 1: reviewer display name, 2: author display name, 3: post title, 4: review page URL, 5: site name */
			__(
				"Hi %1\$s,\n\n%2\$s has updated \"%3\$s\" after your change request. Open the review page to check again:\n\n%4\$s\n\n— %5\$s",
				'jumplinks-editorial-workflow'
			),
			$reviewer->display_name,
			$requester->display_name,
			$post->post_title,
			$review_link,
			wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES )
		);

		wp_mail( $reviewer->user_email, $subject, $message );
	}

	public static function on_changes_requested( int $review_id, int $post_id, int $reviewer_id ): void {
		$post   = get_post( $post_id );
		$author = $post ? self::requester_userdata( $review_id, $post ) : null;
		if ( ! $post || ! $author ) {
			return;
		}

		$reviewer_name = '';
		if ( $reviewer_id > 0 ) {
			$reviewer = get_userdata( $reviewer_id );
			if ( ! $reviewer ) {
				return;
			}
			$reviewer_name = $reviewer->display_name;
		} else {
			$invite = Email_Review::current_invite_for_review( $review_id );
			if ( ! $invite ) {
				$invites = Email_Review_Invites_DB::get_for_review( $review_id );
				$invite  = $invites[0] ?? null;
			}
			if ( ! $invite ) {
				return;
			}
			$reviewer_name = trim( (string) ( $invite->display_name ?? '' ) );
			if ( '' === $reviewer_name ) {
				$reviewer_name = (string) $invite->email;
			}
		}

		$context = compact( 'review_id', 'post_id', 'reviewer_id' );
		if ( ! (bool) \apply_filters( 'flow_ew_should_send_email_notification', true, 'changes_requested', $context ) ) {
			return;
		}

		$review_link = self::review_page_url( $review_id, $post_id );

		$subject = sprintf(
			/* translators: 1: site name, 2: post title */
			__( '[%1$s] Changes requested on: %2$s', 'jumplinks-editorial-workflow' ),
			wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
			$post->post_title
		);

		$message = sprintf(
			/* translators: 1: author name, 2: reviewer name, 3: post title, 4: review page URL, 5: site name */
			__(
				"Hi %1\$s,\n\n%2\$s has requested changes on \"%3\$s\".\n\nOpen the review page:\n%4\$s\n\n— %5\$s",
				'jumplinks-editorial-workflow'
			),
			$author->display_name,
			$reviewer_name,
			$post->post_title,
			$review_link,
			wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES )
		);

		wp_mail( $author->user_email, $subject, $message );
	}

	public static function on_review_approved( int $review_id, int $post_id, int $reviewer_id ): void {
		$post   = get_post( $post_id );
		$author = $post ? self::requester_userdata( $review_id, $post ) : null;
		if ( ! $post || ! $author ) {
			return;
		}

		$reviewer_name = '';
		if ( $reviewer_id > 0 ) {
			$reviewer = get_userdata( $reviewer_id );
			if ( ! $reviewer ) {
				return;
			}
			$reviewer_name = $reviewer->display_name;
		} else {
			$invite = Email_Review::current_invite_for_review( $review_id );
			if ( ! $invite ) {
				$invites = Email_Review_Invites_DB::get_for_review( $review_id );
				$invite  = $invites[0] ?? null;
			}
			if ( ! $invite ) {
				return;
			}
			$reviewer_name = trim( (string) ( $invite->display_name ?? '' ) );
			if ( '' === $reviewer_name ) {
				$reviewer_name = (string) $invite->email;
			}
		}

		$context = compact( 'review_id', 'post_id', 'reviewer_id' );
		if ( ! (bool) \apply_filters( 'flow_ew_should_send_email_notification', true, 'review_approved', $context ) ) {
			return;
		}

		$review_link = self::review_page_url( $review_id, $post_id );

		$subject = sprintf(
			/* translators: 1: site name, 2: post title */
			__( '[%1$s] Review approved: %2$s', 'jumplinks-editorial-workflow' ),
			wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
			$post->post_title
		);

		$message = sprintf(
			/* translators: 1: author name, 2: reviewer name, 3: post title, 4: review page URL, 5: site name */
			__(
				"Hi %1\$s,\n\n%2\$s has approved \"%3\$s\". You can publish when you are ready.\n\nOpen the review page:\n%4\$s\n\n— %5\$s",
				'jumplinks-editorial-workflow'
			),
			$author->display_name,
			$reviewer_name,
			$post->post_title,
			$review_link,
			wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES )
		);

		wp_mail( $author->user_email, $subject, $message );
	}
}
