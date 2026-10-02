export const EDITORIAL = 'editorial';
export const CLIENT = 'client';
export const BUILD_AI = 'build_ai';
export const APPROVE_AI = 'approve_ai';

export const USE_CASES = [ EDITORIAL, CLIENT, BUILD_AI, APPROVE_AI ];

/** Use cases that always configure an agent, without asking first. Mirrors Setup_Presets::always_has_agent(). */
export function alwaysHasAgent( useCase ) {
	return useCase === BUILD_AI || useCase === APPROVE_AI;
}

/**
 * The screens a use case walks through, in order. The first screen (the
 * use-case cards) is always included so Back can return to it.
 *
 * @param {string}  useCase
 * @param {boolean} agentEnabled Answer to the "AI agent?" screen.
 * @return {string[]} Step keys.
 */
export function pathFor( useCase, agentEnabled ) {
	const agent = agentEnabled ? [ 'agent' ] : [];
	switch ( useCase ) {
		case CLIENT:
			return [
				'useCase',
				'types',
				'extras',
				'agentAsk',
				...agent,
				'done',
			];
		case BUILD_AI:
			return [ 'useCase', 'agent', 'done' ];
		case APPROVE_AI:
			return [ 'useCase', 'types', 'roles', 'extras', 'agent', 'done' ];
		default:
			return [
				'useCase',
				'mode',
				'types',
				'roles',
				'extras',
				'agentAsk',
				...agent,
				'done',
			];
	}
}

/**
 * What Finish will store, in the same terms as the server preset, so the last
 * screen can say what changes. Keep in step with Setup_Presets::resolve().
 *
 * @param {Object}   answers
 * @param {string[]} allPostTypes Every eligible post type slug.
 * @return {Object} Setting key => value; keys the use case leaves alone are absent.
 */
export function previewSettings( answers, allPostTypes ) {
	const { useCase } = answers;
	const out = {};

	if ( useCase === CLIENT ) {
		out.reviewMode = 'optional';
	} else if ( useCase === BUILD_AI ) {
		out.reviewMode = 'solo';
	} else if ( useCase === APPROVE_AI ) {
		out.reviewMode = 'mandatory';
	} else {
		out.reviewMode =
			answers.reviewMode === 'mandatory' ? 'mandatory' : 'optional';
	}

	out.postTypes =
		useCase === BUILD_AI ? allPostTypes : answers.postTypes || [];

	if ( useCase !== BUILD_AI ) {
		out.reviewerRoles =
			useCase === CLIENT ? [] : answers.reviewerRoles || [];
		out.allowExternal =
			useCase === CLIENT ? true : !! answers.allowExternal;
		out.openReviews = useCase === EDITORIAL;
		if ( useCase === EDITORIAL || useCase === CLIENT ) {
			out.selfReview = false;
		}
		out.showReviewedBy = !! answers.showReviewedBy;
		out.autoAssign = answers.autoAssign || null;
	}

	if ( alwaysHasAgent( useCase ) || answers.agentEnabled ) {
		out.agentComments = !! answers.agentComments && !! answers.agentAuthor;
		out.agentAuthor = answers.agentAuthor || null;
	}

	return out;
}
