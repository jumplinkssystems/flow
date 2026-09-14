export const EMAIL_SENTINEL = 'email';
export const INVITE_PREFIX = 'invite:';

export function parseInviteValue( val ) {
	if ( typeof val !== 'string' || ! val.startsWith( INVITE_PREFIX ) ) {
		return '';
	}
	return val.slice( INVITE_PREFIX.length );
}
