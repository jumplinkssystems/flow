import { applyFilters } from '@wordpress/hooks';
import BasicCommentEditor from './BasicCommentEditor';

export default function CommentEditor( props ) {
	const Component = applyFilters(
		'flow_ew_comment_editor',
		BasicCommentEditor
	);
	return <Component { ...props } />;
}
