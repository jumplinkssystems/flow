<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Abilities {

	const CATEGORY = 'flow-editorial';

	const TOOLS = [
		'flow/get-instructions',
		'flow/get-review',
		'flow/list-reviewers',
		'flow/assign-reviewer',
		'flow/send-for-review',
		'flow/list-comments',
		'flow/resolve-comment',
		'flow/resubmit-review',
	];

	public function boot(): void {
		add_action( 'wp_abilities_api_categories_init', [ $this, 'register_category' ] );
		add_action( 'wp_abilities_api_init', [ $this, 'register_abilities' ] );
		add_filter( 'mcp_adapter_default_server_config', [ $this, 'merge_mcp_tools' ] );
	}

	public function register_category(): void {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}
		wp_register_ability_category(
			self::CATEGORY,
			[
				'label'       => __( 'Jumplinks Flow', 'jumplinks-editorial-workflow' ),
				'description' => __( 'Human-in-the-loop editorial review: assign reviewers, send for review, read comments, resubmit. Does not edit page content.', 'jumplinks-editorial-workflow' ),
			]
		);
	}

	public function register_abilities(): void {
		if ( ! function_exists( 'wp_register_ability' ) && ! function_exists( 'agent_connector_for_wp_register_ability' ) ) {
			return;
		}

		self::register_ability(
			'flow/get-instructions',
			[
				'label'            => __( 'Flow review instructions', 'jumplinks-editorial-workflow' ),
				'description'      => __( 'Required first read. Explains the human-in-the-loop review loop: assign, send, wait for human comments, edit content with builder tools, resubmit. Do not publish while review is mandatory and unapproved. Do not approve your own work.', 'jumplinks-editorial-workflow' ),
				'category'         => self::CATEGORY,
				'input_schema'     => self::empty_object_schema(),
				'output_schema'    => [
					'type'       => 'object',
					'properties' => [
						'instructions' => [ 'type' => 'string' ],
					],
					'required'   => [ 'instructions' ],
				],
				'execute_callback' => static function ( array $input = [] ): array {
					unset( $input );
					return [ 'instructions' => Abilities::instructions() ];
				},
				'annotations'      => [
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				],
			]
		);

		$comment_item = self::comment_schema();
		$review_gate  = [
			'review_mandatory'   => [ 'type' => 'boolean' ],
			'can_publish'        => [ 'type' => 'boolean' ],
			'block_reason'       => [ 'type' => [ 'string', 'null' ] ],
			'status'             => [ 'type' => [ 'string', 'null' ] ],
			'next_action'        => [ 'type' => 'string' ],
			'review'             => [ 'type' => [ 'object', 'null' ] ],
			'comments'           => [
				'type'  => 'array',
				'items' => $comment_item,
			],
			'unresolved_inline'  => [
				'type'  => 'array',
				'items' => $comment_item,
			],
			'unresolved_general' => [
				'type'  => 'array',
				'items' => $comment_item,
			],
		];

		// Every tool that returns the review shares this shape.
		$review_output_schema = [
			'type'       => 'object',
			'properties' => array_merge(
				[
					'post_id'     => [ 'type' => 'integer' ],
					'post_status' => [ 'type' => 'string' ],
					'post_title'  => [ 'type' => 'string' ],
				],
				$review_gate
			),
		];

		self::register_ability(
			'flow/get-review',
			[
				'label'            => __( 'Get Flow review', 'jumplinks-editorial-workflow' ),
				'description'      => __( 'Return the active review for a post, publish-gate flags, next_action, and all comments (inline selected_text plus general). Use after a human requests changes to see what to edit.', 'jumplinks-editorial-workflow' ),
				'category'         => self::CATEGORY,
				'input_schema'     => [
					'type'                 => 'object',
					'properties'           => [
						'post_id' => [
							'type'        => 'integer',
							'description' => 'WordPress post ID.',
						],
					],
					'required'             => [ 'post_id' ],
					'additionalProperties' => false,
				],
				'output_schema'    => $review_output_schema,
				'execute_callback' => static function ( array $input ) {
					return Ability_Context::get_review( (int) ( $input['post_id'] ?? 0 ) );
				},
				'annotations'      => [
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				],
			]
		);

		self::register_ability(
			'flow/list-reviewers',
			[
				'label'            => __( 'List Flow reviewers', 'jumplinks-editorial-workflow' ),
				'description'      => __( 'List WordPress users eligible to review (Review Roles). Optional q filters by display name. Use before assign-reviewer.', 'jumplinks-editorial-workflow' ),
				'category'         => self::CATEGORY,
				'input_schema'     => [
					'type'                 => 'object',
					'properties'           => [
						'q' => [
							'type'        => 'string',
							'description' => 'Optional display-name search.',
							'default'     => '',
						],
					],
					'additionalProperties' => false,
				],
				'output_schema'    => [
					'type'       => 'object',
					'properties' => [
						'reviewers' => [
							'type'  => 'array',
							'items' => [
								'type'       => 'object',
								'properties' => [
									'id'       => [ 'type' => 'integer' ],
									'name'     => [ 'type' => 'string' ],
									'is_email' => [ 'type' => 'boolean' ],
								],
							],
						],
					],
				],
				'execute_callback' => static function ( array $input ) {
					return Ability_Context::list_reviewers( (string) ( $input['q'] ?? '' ) );
				},
				'annotations'      => [
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				],
			]
		);

		self::register_ability(
			'flow/assign-reviewer',
			[
				'label'            => __( 'Assign Flow reviewer', 'jumplinks-editorial-workflow' ),
				'description'      => __( 'Assign a WordPress reviewer (reviewer_id) or external email invite (invite_email) on a post. Creates or updates the active review as pending. Does not send the review.', 'jumplinks-editorial-workflow' ),
				'category'         => self::CATEGORY,
				'input_schema'     => [
					'type'                 => 'object',
					'properties'           => [
						'post_id'      => [
							'type'        => 'integer',
							'description' => 'WordPress post ID.',
						],
						'reviewer_id'  => [
							'type'        => 'integer',
							'description' => 'WP user ID of the reviewer. Omit or 0 when using invite_email.',
							'default'     => 0,
						],
						'invite_email' => [
							'type'        => 'string',
							'description' => 'Optional external reviewer email instead of reviewer_id.',
							'default'     => '',
						],
					],
					'required'             => [ 'post_id' ],
					'additionalProperties' => false,
				],
				'output_schema'    => $review_output_schema,
				'execute_callback' => static function ( array $input ) {
					return Ability_Context::assign_reviewer(
						(int) ( $input['post_id'] ?? 0 ),
						(int) ( $input['reviewer_id'] ?? 0 ),
						(string) ( $input['invite_email'] ?? '' )
					);
				},
				'annotations'      => [
					'readonly'    => false,
					'destructive' => false,
					'idempotent'  => false,
				],
			]
		);

		$review_id_input = [
			'type'                 => 'object',
			'properties'           => [
				'review_id' => [
					'type'        => 'integer',
					'description' => 'Flow review ID. Optional if post_id is set.',
					'default'     => 0,
				],
				'post_id'   => [
					'type'        => 'integer',
					'description' => 'Post ID used to find the active review when review_id is omitted.',
					'default'     => 0,
				],
			],
			'additionalProperties' => false,
		];

		self::register_ability(
			'flow/send-for-review',
			[
				'label'            => __( 'Send Flow review', 'jumplinks-editorial-workflow' ),
				'description'      => __( 'Send the assigned review to the human reviewer. Persist all content edits first (builder save or wp_update_post) so the revision snapshot is current. Sets review to in_review and unpublished posts to pending.', 'jumplinks-editorial-workflow' ),
				'category'         => self::CATEGORY,
				'input_schema'     => $review_id_input,
				'output_schema'    => $review_output_schema,
				'execute_callback' => static function ( array $input ) {
					return Ability_Context::send_for_review(
						(int) ( $input['review_id'] ?? 0 ),
						(int) ( $input['post_id'] ?? 0 )
					);
				},
				'annotations'      => [
					'readonly'    => false,
					'destructive' => false,
					'idempotent'  => false,
				],
			]
		);

		self::register_ability(
			'flow/list-comments',
			[
				'label'            => __( 'List Flow review comments', 'jumplinks-editorial-workflow' ),
				'description'      => __( 'List review comments, unresolved first. Inline comments include selected_text (the quoted passage to change). Use this as the work queue after a human requests changes. Pass unresolved_only true to hide resolved threads.', 'jumplinks-editorial-workflow' ),
				'category'         => self::CATEGORY,
				'input_schema'     => [
					'type'                 => 'object',
					'properties'           => [
						'review_id'       => [
							'type'        => 'integer',
							'description' => 'Flow review ID. Optional if post_id is set.',
							'default'     => 0,
						],
						'post_id'         => [
							'type'        => 'integer',
							'description' => 'Post ID used to find the active review when review_id is omitted.',
							'default'     => 0,
						],
						'unresolved_only' => [
							'type'        => 'boolean',
							'description' => 'If true, omit resolved comments from comments[]. Unresolved lists are always included.',
							'default'     => false,
						],
					],
					'additionalProperties' => false,
				],
				'output_schema'    => [
					'type'       => 'object',
					'properties' => [
						'review_id'          => [ 'type' => 'integer' ],
						'post_id'            => [ 'type' => 'integer' ],
						'comments'           => [
							'type'  => 'array',
							'items' => $comment_item,
						],
						'unresolved_inline'  => [
							'type'  => 'array',
							'items' => $comment_item,
						],
						'unresolved_general' => [
							'type'  => 'array',
							'items' => $comment_item,
						],
					],
				],
				'execute_callback' => static function ( array $input ) {
					return Ability_Context::list_comments(
						(int) ( $input['review_id'] ?? 0 ),
						(int) ( $input['post_id'] ?? 0 ),
						! empty( $input['unresolved_only'] )
					);
				},
				'annotations'      => [
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				],
			]
		);

		$resolve_notes = Settings::agent_resolve_notes_enabled();
		$followup      = Settings::agent_followup_comments_enabled();

		$resolve_properties = [
			'comment_id' => [
				'type'        => 'integer',
				'description' => 'Flow comment ID from list-comments or get-review.',
			],
		];
		$resolve_required   = [ 'comment_id' ];
		if ( $resolve_notes ) {
			$resolve_properties['note'] = [
				'type'        => 'string',
				'description' => 'One or two sentences naming the edit you actually made. If you made no edit, do not call resolve - reply to the comment and leave it unresolved. Posted into the comment thread.',
			];
			$resolve_required[]         = 'note';
		}

		self::register_ability(
			'flow/resolve-comment',
			[
				'label'            => __( 'Resolve Flow comment', 'jumplinks-editorial-workflow' ),
				'description'      => __( 'Mark a review comment resolved after you applied the requested edit with builder or core content tools.', 'jumplinks-editorial-workflow' ),
				'category'         => self::CATEGORY,
				'input_schema'     => [
					'type'                 => 'object',
					'properties'           => $resolve_properties,
					'required'             => $resolve_required,
					'additionalProperties' => false,
				],
				'output_schema'    => [
					'type'       => 'object',
					'properties' => [
						'comment'         => $comment_item,
						'note_comment_id' => [ 'type' => 'integer' ],
					],
				],
				'execute_callback' => static function ( array $input ) {
					return Ability_Context::resolve_comment(
						(int) ( $input['comment_id'] ?? 0 ),
						(string) ( $input['note'] ?? '' )
					);
				},
				'annotations'      => [
					'readonly'    => false,
					'destructive' => false,
					// Posting a note makes a second call add a second comment.
					'idempotent'  => ! $resolve_notes,
				],
			]
		);

		if ( $followup ) {
			self::register_ability(
				'flow/reply-to-comment',
				[
					'label'            => __( 'Reply to Flow comment', 'jumplinks-editorial-workflow' ),
					'description'      => __( 'Ask the human reviewer one clarifying question when their comment is genuinely ambiguous, then stop and wait for their answer.', 'jumplinks-editorial-workflow' ),
					'category'         => self::CATEGORY,
					'input_schema'     => [
						'type'                 => 'object',
						'properties'           => [
							'comment_id' => [
								'type'        => 'integer',
								'description' => 'Flow comment ID to reply to, from list-comments or get-review.',
							],
							'body'       => [
								'type'        => 'string',
								'description' => 'Plain text. One specific question about what the reviewer asked for.',
								'maxLength'   => 2000,
							],
						],
						'required'             => [ 'comment_id', 'body' ],
						'additionalProperties' => false,
					],
					'output_schema'    => [
						'type'       => 'object',
						'properties' => [
							'comment' => $comment_item,
						],
					],
					'execute_callback' => static function ( array $input ) {
						return Ability_Context::reply_to_comment(
							(int) ( $input['comment_id'] ?? 0 ),
							(string) ( $input['body'] ?? '' )
						);
					},
					'annotations'      => [
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => false,
					],
				]
			);
		}

		self::register_ability(
			'flow/resubmit-review',
			[
				'label'            => __( 'Resubmit Flow review', 'jumplinks-editorial-workflow' ),
				'description'      => __( 'After applying human comments with builder tools, persist the content then resubmit. Sets status back to in_review. The authenticated user must be the post author. Do not approve; wait for the human.', 'jumplinks-editorial-workflow' ),
				'category'         => self::CATEGORY,
				'input_schema'     => $review_id_input,
				'output_schema'    => $review_output_schema,
				'execute_callback' => static function ( array $input ) {
					return Ability_Context::resubmit_review(
						(int) ( $input['review_id'] ?? 0 ),
						(int) ( $input['post_id'] ?? 0 )
					);
				},
				'annotations'      => [
					'readonly'    => false,
					'destructive' => false,
					'idempotent'  => false,
				],
			]
		);
	}

	/**
	 * @param array<string,mixed> $config
	 * @return array<string,mixed>
	 */
	public function merge_mcp_tools( $config ) {
		if ( ! is_array( $config ) ) {
			return $config;
		}
		$existing = [];
		if ( isset( $config['tools'] ) && is_array( $config['tools'] ) ) {
			$existing = $config['tools'];
		}
		$tools = self::TOOLS;
		if ( Settings::agent_followup_comments_enabled() ) {
			$tools[] = 'flow/reply-to-comment';
		}
		$tools           = (array) \apply_filters( 'flow_ew_agent_tools', $tools );
		$config['tools'] = array_values( array_unique( array_merge( $existing, $tools ) ) );

		$extra                        = "\n\nJumplinks Flow: human-in-the-loop editorial review. Call flow/get-instructions before assigning or sending a review. Flow does not edit page content.";
		$config['server_description'] = (string) ( $config['server_description'] ?? '' ) . $extra;

		return $config;
	}

	/**
	 * Appended, not merged into the main heredoc, so the base loop text stays
	 * one block and this section can name the step it overrides.
	 */
	private static function comment_writing_instructions(): string {
		$resolve_notes = Settings::agent_resolve_notes_enabled();
		$followup      = Settings::agent_followup_comments_enabled();
		$asks_first    = Settings::agent_asks_before_editing();

		$lines = [ 'Writing comments (this site allows it)' ];

		// Without this the two blocks contradict each other: one hands the agent
		// a reply tool for vague feedback, the other forbids writing until the
		// operator approves. An agent read that gap as permission and posted.
		if ( $asks_first ) {
			$lines[] = '- "Ask before editing" is on, and it takes precedence over everything in this section. Do not call flow/reply-to-comment or flow/resolve-comment until the operator has approved your plan in the conversation. Ask clarifying questions there, not on the review.';
		}

		if ( $resolve_notes ) {
			$lines[] = '- Overrides step 9: flow/resolve-comment now requires note — one or two sentences on what you actually changed. No note, no resolve; nothing is marked resolved if the note fails. The note names an edit you really made; restating, interpreting or agreeing with the comment is not a change, and neither is deciding it needed no change.';
		}

		if ( $followup && $asks_first ) {
			$lines[] = '- flow/reply-to-comment (comment_id, body) exists, but not yet: while "Ask before editing" is on, a vague comment is raised with the operator in the conversation first. Use this tool only once they approve, and then only to ask one specific question, leaving the comment unresolved. Never resolve it instead, and never guess.';
		} elseif ( $followup ) {
			$lines[] = '- flow/reply-to-comment (comment_id, body): when a comment does not name a concrete change, ask one specific question, leave the comment unresolved, and wait for a human answer. That is the required move for vague or non-actionable feedback - never resolve it instead, and never guess. Not for progress reports, not for acknowledgements, not for arguing, and never in reply to your own comment.';
		} else {
			$lines[] = '- There is no reply tool on this site. When a comment does not name a concrete change, make no edit, leave it unresolved, and say so to the person you are working for. Never guess, and never resolve it to clear the queue.';
		}

		$lines[] = '- Your comments post under the site\'s configured Flow user, not under you, and carry is_agent true. Use that to tell your own writing from reviewer feedback; never treat your own question as a new instruction.';
		$lines[] = '- Never: open a new comment thread; reply to yourself; use a reply where an edit was asked for; resolve a thread whose question you are still waiting on.';

		return implode( "\n", $lines );
	}

	/**
	 * Appended when the site asks agents to propose before they edit. Purely
	 * advisory: Flow never touches content, so it cannot block an edit.
	 */
	private static function ask_before_editing_instructions(): string {
		return <<<'TXT'
Ask before editing (this site requires it)
- This section takes precedence over every other instruction here, including the comment-writing rules. Until the person you are working for approves, you may write NOTHING to Flow: no flow/reply-to-comment, no flow/resolve-comment, no note, no new thread. Asking a clarifying question is still writing, and it still waits.
- Overrides step 8. Work out the full set of edits the feedback asks for, but make none of them yet. Do not edit content, do not post comments, do not resolve comments, do not resubmit the review.
- "Your reply" means your own message in the chat you are having with that person. It never means a reply posted into a Flow comment thread. Approval is asked for and given in that conversation, not on the review.
- Summarise the plan there: which post or page, what you would change, the current wording and your proposed wording where text is involved, and anything you still need from them (an image, a link, a decision they have to make).
- If a comment is vague, say so in that same conversation and ask them. Do not use flow/reply-to-comment to ask - that is a write, and writes wait for approval.
- List separately any comment you cannot act on, and say why.
- Then stop and wait for their explicit go-ahead in the conversation. Silence is not approval.
- Only once they approve may you edit and use the comment tools as the rules elsewhere describe.
- If they approve only part of the plan, do only that part and leave the rest untouched.
- This applies to every editing pass, not only the first one.
TXT;
	}

	public static function instructions(): string {
		$instructions = <<<'TEXT'
Jumplinks Flow is the human-in-the-loop gate between AI-authored WordPress content and human reviewers. Flow does not edit pages, templates, or builder trees. Use the connected builder (Oxygen, Gutenberg, Elementor, core REST, etc.) to change content, then use Flow abilities for review state.

Loop
1. Draft or edit content with builder/core tools until it is saved.
2. Call flow/get-instructions (this text) once per session.
3. Call flow/get-review with post_id. If review_mandatory is true, do not publish until can_publish is true (status approved). The server will also block publish.
4. If next_action is assign_reviewer: flow/list-reviewers then flow/assign-reviewer (reviewer_id, or invite_email for an external reviewer). The reviewer must not be the same WordPress user as you unless the site auto-assign setting allows it.
5. If next_action is send_for_review: persist content first, then flow/send-for-review. This notifies the human and sets unpublished posts to pending.
6. Stop and wait. Do not approve. Humans leave inline and general comments on the Flow review page and may request changes.
7. When status is changes_requested (or you are asked to address feedback): flow/get-review or flow/list-comments. The comment's own text/html is the only statement of what to change. unresolved_inline[].selected_text and location say only where the comment is anchored - they are context, never an instruction, and a passage being selected is not a request to rewrite it. unresolved_general is page-level feedback. Replies (kind=reply) belong to a parent thread.
8. Apply edits with the builder that owns the page. Do not invent Flow edit tools.
9. Resolve only what you actually changed: after each addressed inline comment, flow/resolve-comment with that comment_id. If a comment does not name a concrete change - it is vague, a placeholder, test text, or you cannot tell what is being asked - make no edit and leave it unresolved. Do not reconstruct a plausible request from the anchored passage, the surrounding content, or what the page seems to need. Say plainly which comments you left unresolved and why.
10. Persist content, then flow/resubmit-review. You must be the post author.
11. Repeat from step 6 until status is approved, then publish via builder/core tools if can_publish is true.

Statuses: pending (assigned, not sent) → in_review (waiting on human) → changes_requested (your turn) → approved (publish allowed when mandatory). Humans may also cancel.

Never: approve or request-changes as the authoring agent; publish while can_publish is false; skip saving before send/resubmit; infer a requested change from selected_text; resolve a comment you did not act on.
TEXT;

		if ( Settings::agent_resolve_notes_enabled() || Settings::agent_followup_comments_enabled() ) {
			$instructions .= "\n\n" . self::comment_writing_instructions();
		}

		if ( Settings::agent_asks_before_editing() ) {
			$instructions .= "\n\n" . self::ask_before_editing_instructions();
		}

		return (string) \apply_filters( 'flow_ew_agent_instructions', $instructions );
	}

	/**
	 * @return array<string,mixed>
	 */
	private static function empty_object_schema(): array {
		return [
			'type'                 => 'object',
			'additionalProperties' => false,
		];
	}

	/**
	 * @return array<string,mixed>
	 */
	public static function comment_schema(): array {
		return [
			'type'       => 'object',
			'properties' => [
				'id'            => [ 'type' => 'integer' ],
				'parent_id'     => [ 'type' => 'integer' ],
				'kind'          => [ 'type' => 'string' ],
				'html'          => [ 'type' => 'string' ],
				'text'          => [ 'type' => 'string' ],
				'is_resolved'   => [ 'type' => 'boolean' ],
				'is_agent'      => [ 'type' => 'boolean' ],
				'author'        => [ 'type' => 'string' ],
				'author_id'     => [ 'type' => 'integer' ],
				'date'          => [ 'type' => 'string' ],
				'selected_text' => [
					'type'        => 'string',
					'description' => 'The passage this comment is anchored to. Locates the feedback only; it never states what to change.',
				],
				'location'      => [
					'type'       => 'object',
					'properties' => [
						'text'     => [ 'type' => 'string' ],
						'type'     => [ 'type' => 'string' ],
						'src'      => [ 'type' => 'string' ],
						'rootType' => [ 'type' => 'string' ],
					],
				],
			],
		];
	}

	/**
	 * @param array<string,mixed> $args
	 */
	public static function register_ability( string $name, array $args ): void {
		if ( function_exists( 'agent_connector_for_wp_register_ability' ) ) {
			agent_connector_for_wp_register_ability( $name, $args );
			return;
		}
		$args['meta'] = [
			'mcp'          => [ 'public' => true ],
			'show_in_rest' => true,
		];
		if ( ! isset( $args['permission_callback'] ) ) {
			$args['permission_callback'] = static function (): bool {
				return is_user_logged_in();
			};
		}
		if ( function_exists( 'wp_register_ability' ) ) {
			wp_register_ability( $name, $args );
		}
	}
}
