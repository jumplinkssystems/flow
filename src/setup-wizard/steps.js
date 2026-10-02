import { Fragment, useState } from '@wordpress/element';
import {
	CheckboxControl,
	__experimentalText as Text,
} from '@wordpress/components';
import UserPicker from './UserPicker';
import {
	EDITORIAL,
	CLIENT,
	BUILD_AI,
	APPROVE_AI,
	USE_CASES,
	alwaysHasAgent,
	previewSettings,
} from './paths';

const cfg = window.flowEWSetup || {};
const i18n = cfg.i18n || {};
const choices = cfg.choices || { postTypes: [], roles: [] };
const reviewerRoleSlug = cfg.reviewerRoleSlug || 'flow_reviewer';

function StepHeader( { title, desc } ) {
	return (
		<>
			<h2 className="flow-ew-wizard__step-title">{ title }</h2>
			{ desc ? (
				<p className="flow-ew-wizard__step-desc">{ desc }</p>
			) : null }
		</>
	);
}

function RadioCard( { name, checked, onSelect, title, children } ) {
	return (
		<label
			className={ `flow-ew-wizard__option ${
				checked ? 'is-selected' : ''
			}` }
		>
			<input
				type="radio"
				name={ name }
				checked={ checked }
				onChange={ onSelect }
			/>
			<div>
				<strong>{ title }</strong>
				<Text variant="muted" as="p">
					{ children }
				</Text>
			</div>
		</label>
	);
}

function CheckCard( { checked, onChange, title, badge, children } ) {
	return (
		<label
			className={ `flow-ew-wizard__option flow-ew-wizard__option--check ${
				checked ? 'is-selected' : ''
			}` }
		>
			<input
				type="checkbox"
				checked={ checked }
				onChange={ ( event ) => onChange( event.target.checked ) }
			/>
			<div>
				<strong>
					{ title }
					{ badge ? (
						<span className="flow-ew-wizard__badge">{ badge }</span>
					) : null }
				</strong>
				<Text variant="muted" as="p">
					{ children }
				</Text>
			</div>
		</label>
	);
}

const USE_CASE_COPY = {
	[ EDITORIAL ]: [ 'editorialLabel', 'editorialDesc' ],
	[ CLIENT ]: [ 'clientLabel', 'clientDesc' ],
	[ BUILD_AI ]: [ 'buildAiLabel', 'buildAiDesc' ],
	[ APPROVE_AI ]: [ 'approveAiLabel', 'approveAiDesc' ],
};

export function UseCaseStep( { answers, update } ) {
	return (
		<div className="flow-ew-wizard__step">
			<StepHeader title={ i18n.useCaseTitle } desc={ i18n.useCaseDesc } />
			{ USE_CASES.map( ( useCase ) => (
				<RadioCard
					key={ useCase }
					name="flow-ew-use-case"
					checked={ answers.useCase === useCase }
					onSelect={ () => update( { useCase } ) }
					title={ i18n[ USE_CASE_COPY[ useCase ][ 0 ] ] }
				>
					{ i18n[ USE_CASE_COPY[ useCase ][ 1 ] ] }
				</RadioCard>
			) ) }
		</div>
	);
}

export function ModeStep( { answers, update } ) {
	return (
		<div className="flow-ew-wizard__step">
			<StepHeader title={ i18n.modeTitle } desc={ i18n.modeDesc } />
			<RadioCard
				name="flow-ew-mode"
				checked={ answers.reviewMode !== 'mandatory' }
				onSelect={ () => update( { reviewMode: 'optional' } ) }
				title={ i18n.modeOptional }
			>
				{ i18n.modeOptionalDesc }
			</RadioCard>
			<RadioCard
				name="flow-ew-mode"
				checked={ answers.reviewMode === 'mandatory' }
				onSelect={ () => update( { reviewMode: 'mandatory' } ) }
				title={ i18n.modeMandatory }
			>
				{ i18n.modeMandatoryDesc }
			</RadioCard>
		</div>
	);
}

function SelectAllToggle( { all, value, onChange } ) {
	const allChecked =
		all.length > 0 && all.every( ( s ) => value.includes( s ) );
	return (
		<button
			type="button"
			className="flow-ew-wizard__select-all"
			onClick={ ( event ) => {
				event.preventDefault();
				onChange( allChecked ? [] : all.slice() );
			} }
		>
			{ allChecked ? i18n.deselectAll : i18n.selectAll }
		</button>
	);
}

function toggleIn( list, slug, on ) {
	const next = new Set( list );
	if ( on ) {
		next.add( slug );
	} else {
		next.delete( slug );
	}
	return Array.from( next );
}

export function PostTypesStep( { answers, update } ) {
	const list = choices.postTypes || [];
	const value = answers.postTypes;
	if ( list.length === 0 ) {
		return (
			<div className="flow-ew-wizard__step">
				<StepHeader
					title={ i18n.typesTitle }
					desc={ i18n.typesEmpty }
				/>
			</div>
		);
	}
	return (
		<div className="flow-ew-wizard__step">
			<StepHeader title={ i18n.typesTitle } desc={ i18n.typesDesc } />
			<SelectAllToggle
				all={ list.map( ( pt ) => pt.slug ) }
				value={ value }
				onChange={ ( postTypes ) => update( { postTypes } ) }
			/>
			<div className="flow-ew-wizard__check-list">
				{ list.map( ( pt ) => (
					<CheckboxControl
						key={ pt.slug }
						label={ `${ pt.label }  (${ pt.slug })` }
						checked={ value.includes( pt.slug ) }
						onChange={ ( on ) =>
							update( {
								postTypes: toggleIn( value, pt.slug, on ),
							} )
						}
						__nextHasNoMarginBottom
					/>
				) ) }
			</div>
		</div>
	);
}

export function RolesStep( { answers, update } ) {
	const list = choices.roles || [];
	const value = answers.reviewerRoles;
	return (
		<div className="flow-ew-wizard__step">
			<StepHeader title={ i18n.rolesTitle } desc={ i18n.rolesDesc } />
			<SelectAllToggle
				all={ list.map( ( r ) => r.slug ) }
				value={ value }
				onChange={ ( reviewerRoles ) => update( { reviewerRoles } ) }
			/>
			<div className="flow-ew-wizard__check-list flow-ew-wizard__check-list--roles">
				{ list.map( ( r ) => (
					<Fragment key={ r.slug }>
						{ r.slug === reviewerRoleSlug ? (
							<div
								className="flow-ew-wizard__roles-divider"
								aria-hidden="true"
							/>
						) : null }
						<CheckboxControl
							label={ r.label }
							help={ r.description || undefined }
							checked={ value.includes( r.slug ) }
							onChange={ ( on ) =>
								update( {
									reviewerRoles: toggleIn(
										value,
										r.slug,
										on
									),
								} )
							}
							__nextHasNoMarginBottom
						/>
					</Fragment>
				) ) }
			</div>
		</div>
	);
}

export function ExtrasStep( { answers, update } ) {
	const isClient = answers.useCase === CLIENT;
	const allowEmail = isClient || answers.allowExternal;
	return (
		<div className="flow-ew-wizard__step">
			<StepHeader title={ i18n.extrasTitle } desc={ i18n.extrasDesc } />
			<CheckCard
				checked={ !! answers.showReviewedBy }
				onChange={ ( showReviewedBy ) => update( { showReviewedBy } ) }
				title={ i18n.reviewedByLabel }
			>
				{ i18n.reviewedByDesc }
			</CheckCard>
			{ ! isClient && (
				<CheckCard
					checked={ !! answers.allowExternal }
					onChange={ ( allowExternal ) =>
						update( {
							allowExternal,
							autoAssign:
								! allowExternal && answers.autoAssign?.email
									? null
									: answers.autoAssign,
						} )
					}
					title={ i18n.externalLabel }
				>
					{ i18n.externalDesc }
				</CheckCard>
			) }
			<div className="flow-ew-wizard__field">
				<label
					className="flow-ew-wizard__field-label"
					htmlFor="flow-ew-wizard-auto-assign"
				>
					{ i18n.autoAssignLabel }
				</label>
				<UserPicker
					id="flow-ew-wizard-auto-assign"
					value={ answers.autoAssign }
					onChange={ ( autoAssign ) => update( { autoAssign } ) }
					allowEmail={ allowEmail }
				/>
				<Text variant="muted" as="p">
					{ allowEmail
						? i18n.autoAssignEmailDesc
						: i18n.autoAssignDesc }
				</Text>
			</div>
		</div>
	);
}

export function AgentAskStep( { answers, update } ) {
	return (
		<div className="flow-ew-wizard__step">
			<StepHeader
				title={ i18n.agentAskTitle }
				desc={ i18n.agentAskDesc }
			/>
			<CheckCard
				checked={ !! answers.agentEnabled }
				onChange={ ( agentEnabled ) => update( { agentEnabled } ) }
				title={ i18n.agentAskLabel }
			>
				{ i18n.agentAskHelp }
			</CheckCard>
		</div>
	);
}

export function AgentStep( { answers, update, showErrors } ) {
	const missingUser = answers.agentComments && ! answers.agentAuthor;
	return (
		<div className="flow-ew-wizard__step">
			<StepHeader title={ i18n.agentTitle } desc={ i18n.agentDesc } />
			<CheckCard
				checked={ !! answers.agentComments }
				onChange={ ( agentComments ) => update( { agentComments } ) }
				title={ i18n.agentCommentsLabel }
			>
				{ i18n.agentCommentsDesc }
			</CheckCard>
			{ answers.agentComments && (
				<>
					<div className="flow-ew-wizard__field">
						<label
							className="flow-ew-wizard__field-label"
							htmlFor="flow-ew-wizard-agent-user"
						>
							{ i18n.agentAuthorLabel }
						</label>
						<UserPicker
							id="flow-ew-wizard-agent-user"
							value={ answers.agentAuthor }
							onChange={ ( agentAuthor ) =>
								update( { agentAuthor } )
							}
							allowEmail={ false }
						/>
						<Text variant="muted" as="p">
							{ i18n.agentAuthorDesc }
						</Text>
						{ showErrors && missingUser ? (
							<p
								className="flow-ew-wizard__field-error"
								role="alert"
							>
								{ i18n.agentAuthorRequired }
							</p>
						) : null }
					</div>
					<CheckCard
						checked={ !! answers.agentResolveNotes }
						onChange={ ( agentResolveNotes ) =>
							update( { agentResolveNotes } )
						}
						title={ i18n.agentResolveLabel }
					>
						{ i18n.agentResolveDesc }
					</CheckCard>
					<CheckCard
						checked={ !! answers.agentFollowup }
						onChange={ ( agentFollowup ) =>
							update( { agentFollowup } )
						}
						title={ i18n.agentFollowupLabel }
					>
						{ i18n.agentFollowupDesc }
					</CheckCard>
					<CheckCard
						checked={ !! answers.agentMarker }
						onChange={ ( agentMarker ) =>
							update( { agentMarker } )
						}
						title={ i18n.agentMarkerLabel }
					>
						{ i18n.agentMarkerDesc }
					</CheckCard>
					<CheckCard
						checked={ !! answers.agentAskBeforeEditing }
						onChange={ ( agentAskBeforeEditing ) =>
							update( { agentAskBeforeEditing } )
						}
						title={ i18n.agentAskEditLabel }
						badge={ i18n.experimental }
					>
						{ i18n.agentAskEditDesc }
					</CheckCard>
				</>
			) }
		</div>
	);
}

/** True when the agent screen would refuse to continue. */
export function agentStepBlocked( answers ) {
	return !! answers.agentComments && ! answers.agentAuthor;
}

function copyText( text ) {
	if ( window.navigator?.clipboard && window.isSecureContext ) {
		return window.navigator.clipboard.writeText( text );
	}
	const area = document.createElement( 'textarea' );
	area.value = text;
	area.setAttribute( 'readonly', '' );
	area.style.position = 'fixed';
	area.style.opacity = '0';
	document.body.appendChild( area );
	area.select();
	document.execCommand( 'copy' );
	document.body.removeChild( area );
	return Promise.resolve();
}

function PromptBox( { prompt } ) {
	const [ copied, setCopied ] = useState( false );
	return (
		<div className="flow-ew-wizard__prompt">
			<code>{ prompt }</code>
			<button
				type="button"
				className="button flow-ew-wizard__prompt-copy"
				onClick={ () =>
					copyText( prompt ).then( () => {
						setCopied( true );
						setTimeout( () => setCopied( false ), 2000 );
					} )
				}
			>
				{ copied ? i18n.copied : i18n.copy }
			</button>
		</div>
	);
}

const MODE_LABELS = () => ( {
	optional: i18n.modeOptional,
	mandatory: i18n.modeMandatory,
	solo: i18n.modeSolo,
} );

function onOff( value ) {
	return value ? i18n.on : i18n.off;
}

function listLabel( slugs, list ) {
	if ( ! slugs || slugs.length === 0 ) {
		return i18n.none;
	}
	return slugs
		.map( ( slug ) => {
			const found = list.find( ( item ) => item.slug === slug );
			return found
				? String( found.label ).replace( / \(\d+\)$/, '' )
				: slug;
		} )
		.join( ', ' );
}

function personLabel( person ) {
	if ( ! person ) {
		return i18n.none;
	}
	return person.email || person.name;
}

/** Rows of what Finish changes compared with what the site has now. */
function changes( answers ) {
	const current = cfg.current || {};
	const next = previewSettings(
		answers,
		( choices.postTypes || [] ).map( ( pt ) => pt.slug )
	);
	let currentAutoAssign = current.autoAssignReviewer || null;
	if ( ! currentAutoAssign && current.autoAssignEmail ) {
		currentAutoAssign = { email: current.autoAssignEmail };
	}
	const rows = [
		[
			'reviewMode',
			i18n.modeTitle,
			MODE_LABELS()[ next.reviewMode ],
			MODE_LABELS()[ current.reviewMode ],
		],
		[
			'postTypes',
			i18n.typesTitle,
			listLabel( next.postTypes, choices.postTypes ),
			listLabel( current.postTypes, choices.postTypes ),
		],
		[
			'reviewerRoles',
			i18n.rolesTitle,
			listLabel( next.reviewerRoles, choices.roles ),
			listLabel( current.reviewerRoles, choices.roles ),
		],
		[
			'allowExternal',
			i18n.externalLabel,
			onOff( next.allowExternal ),
			onOff( current.allowExternal ),
		],
		[
			'openReviews',
			i18n.openReviewLabel,
			onOff( next.openReviews ),
			onOff( current.openReviews ),
		],
		[
			'selfReview',
			i18n.selfReviewLabel,
			onOff( next.selfReview ),
			onOff( current.selfReview ),
		],
		[
			'showReviewedBy',
			i18n.reviewedByLabel,
			onOff( next.showReviewedBy ),
			onOff( current.showReviewedBy ),
		],
		[
			'autoAssign',
			i18n.autoAssignLabel,
			personLabel( next.autoAssign ),
			personLabel( currentAutoAssign ),
		],
		[
			'agentComments',
			i18n.agentCommentsLabel,
			onOff( next.agentComments ),
			onOff( current.agentComments ),
		],
		[
			'agentAuthor',
			i18n.agentAuthorLabel,
			personLabel( next.agentAuthor ),
			personLabel( current.agentAuthor ),
		],
	];
	return rows.filter(
		( [ key, , value, was ] ) => key in next && value !== was
	);
}

export function DoneStep( { answers } ) {
	const { useCase } = answers;
	const agent = alwaysHasAgent( useCase ) || answers.agentEnabled;
	const rows = cfg.completed ? changes( answers ) : [];
	return (
		<div className="flow-ew-wizard__step">
			<StepHeader title={ i18n.doneTitle } />
			{ useCase === BUILD_AI && (
				<p className="flow-ew-wizard__step-desc">
					{ i18n.doneBuildAi }
				</p>
			) }
			{ useCase === EDITORIAL && (
				<p className="flow-ew-wizard__step-desc">
					{ i18n.doneEditorial }
				</p>
			) }
			{ useCase === CLIENT && (
				<p className="flow-ew-wizard__step-desc">{ i18n.doneClient }</p>
			) }
			{ agent && (
				<>
					<p className="flow-ew-wizard__step-desc">
						{ i18n.doneAgent }
					</p>
					<PromptBox prompt={ cfg.agentPrompt } />
				</>
			) }
			<p className="flow-ew-wizard__docs">
				<a href={ cfg.docsUrl } target="_blank" rel="noreferrer">
					{ i18n.doneDocs }
				</a>
			</p>
			{ cfg.completed && (
				<div className="flow-ew-wizard__changes">
					<p className="flow-ew-wizard__changes-title">
						{ rows.length ? i18n.doneChanges : i18n.doneNoChanges }
					</p>
					{ rows.length > 0 && (
						<ul>
							{ rows.map( ( [ key, label, value, was ] ) => (
								<li key={ key }>
									<strong>{ label }:</strong> { value }{ ' ' }
									<span className="flow-ew-wizard__was">
										{ String(
											i18n.was || '(was %s)'
										).replace( '%s', was ) }
									</span>
								</li>
							) ) }
						</ul>
					) }
				</div>
			) }
		</div>
	);
}
