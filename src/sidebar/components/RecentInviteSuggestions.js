import { Button } from '@wordpress/components';
import { matchRecentInviteEmails } from '../../shared/recent-invite-emails';

export default function RecentInviteSuggestions( {
	query,
	exclude,
	onPick,
	disabled,
} ) {
	const emails = matchRecentInviteEmails( query, exclude );
	if ( ! emails.length ) {
		return null;
	}
	return (
		<ul className="flow-ew-recent-invites" role="listbox">
			{ emails.map( ( email ) => (
				<li key={ email } role="presentation">
					<Button
						variant="tertiary"
						className="flow-ew-recent-invites__item"
						role="option"
						// Keep focus in the field so the list stays open for the click.
						onMouseDown={ ( event ) => event.preventDefault() }
						onClick={ () => onPick( email ) }
						disabled={ disabled }
					>
						{ email }
					</Button>
				</li>
			) ) }
		</ul>
	);
}
