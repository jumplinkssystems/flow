import { createRoot, useState, useEffect } from '@wordpress/element';
import { Button, Modal, Notice, Spinner } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import domReady from '@wordpress/dom-ready';
import { EDITORIAL, USE_CASES, alwaysHasAgent, pathFor } from './paths';
import {
	UseCaseStep,
	ModeStep,
	PostTypesStep,
	RolesStep,
	ExtrasStep,
	AgentStep,
	DoneStep,
	agentStepBlocked,
} from './steps';
import './style.scss';

const cfg = window.flowEWSetup || {};
const i18n = cfg.i18n || {};

const STEPS = {
	useCase: UseCaseStep,
	mode: ModeStep,
	types: PostTypesStep,
	roles: RolesStep,
	extras: ExtrasStep,
	agent: AgentStep,
	done: DoneStep,
};

/** Start from what the site has, so a re-run only changes what the person touches. */
function initialAnswers() {
	const current = cfg.current || {};
	let autoAssign = null;
	if ( current.autoAssignReviewer ) {
		autoAssign = current.autoAssignReviewer;
	} else if ( current.autoAssignEmail ) {
		autoAssign = { email: current.autoAssignEmail };
	}
	return {
		useCase: USE_CASES.includes( current.useCase )
			? current.useCase
			: EDITORIAL,
		reviewMode:
			current.reviewMode === 'mandatory' ? 'mandatory' : 'optional',
		postTypes: Array.isArray( current.postTypes ) ? current.postTypes : [],
		reviewerRoles: Array.isArray( current.reviewerRoles )
			? current.reviewerRoles
			: [],
		allowExternal: current.allowExternal !== false,
		selfReview: false,
		showReviewedBy: !! current.showReviewedBy,
		autoAssign,
		agentEnabled: !! current.agentComments,
		agentComments: !! current.agentComments,
		agentAuthor: current.agentAuthor || null,
		agentResolveNotes: current.agentResolveNotes !== false,
		agentFollowup: current.agentFollowup !== false,
		agentMarker: current.agentMarker !== false,
		agentAskBeforeEditing: !! current.agentAskBeforeEditing,
	};
}

function payload( answers ) {
	const auto = answers.autoAssign;
	return {
		use_case: answers.useCase,
		review_mode: answers.reviewMode,
		post_types: answers.postTypes,
		reviewer_roles: answers.reviewerRoles,
		allow_external: answers.allowExternal,
		self_review: answers.selfReview,
		show_reviewed_by: answers.showReviewedBy,
		auto_assign_reviewer_id: auto && auto.id ? auto.id : 0,
		auto_assign_email: auto && auto.email ? auto.email : '',
		agent_enabled:
			alwaysHasAgent( answers.useCase ) || answers.agentEnabled,
		agent_comments: answers.agentComments,
		agent_author_id: answers.agentAuthor ? answers.agentAuthor.id : 0,
		agent_resolve_notes: answers.agentResolveNotes,
		agent_followup: answers.agentFollowup,
		agent_marker: answers.agentMarker,
		agent_ask_before_edit: answers.agentAskBeforeEditing,
	};
}

function Wizard( { onClose } ) {
	const [ answers, setAnswers ] = useState( initialAnswers );
	const [ index, setIndex ] = useState( 0 );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState( '' );
	const [ showErrors, setShowErrors ] = useState( false );

	const steps = pathFor( answers.useCase );
	const key = steps[ Math.min( index, steps.length - 1 ) ];
	const StepComponent = STEPS[ key ];
	const isFirst = index === 0;
	const isLast = index >= steps.length - 1;

	function update( patch ) {
		setAnswers( ( prev ) => ( { ...prev, ...patch } ) );
	}

	async function save() {
		setSaving( true );
		setError( '' );
		try {
			await apiFetch( {
				url: cfg.restUrl,
				method: 'POST',
				headers: { 'X-WP-Nonce': cfg.nonce },
				data: payload( answers ),
			} );
			onClose( { saved: true } );
		} catch ( e ) {
			setError( ( e && e.message ) || i18n.errorGeneric );
		} finally {
			setSaving( false );
		}
	}

	function next() {
		setError( '' );
		if ( key === 'agent' && agentStepBlocked( answers ) ) {
			setShowErrors( true );
			return;
		}
		setShowErrors( false );
		if ( isLast ) {
			save();
		} else {
			setIndex( index + 1 );
		}
	}

	function back() {
		setError( '' );
		setShowErrors( false );
		if ( ! isFirst ) {
			setIndex( index - 1 );
		}
	}

	return (
		<Modal
			title={ i18n.title }
			onRequestClose={ () => onClose( { saved: false } ) }
			className="flow-ew-wizard"
			size="medium"
			shouldCloseOnClickOutside={ false }
		>
			<div className="flow-ew-wizard__body">
				{ isFirst ? (
					<p className="flow-ew-wizard__lead">{ i18n.lead }</p>
				) : null }

				<div className="flow-ew-wizard__progress" aria-hidden="true">
					{ steps.map( ( stepKey, i ) => (
						<span
							key={ stepKey }
							className={ `flow-ew-wizard__progress-dot ${
								i === index ? 'is-current' : ''
							} ${ i < index ? 'is-done' : '' }` }
						/>
					) ) }
					<span className="flow-ew-wizard__progress-label">
						{ i18n.step } { index + 1 } { i18n.of } { steps.length }
					</span>
				</div>

				<StepComponent
					answers={ answers }
					update={ update }
					showErrors={ showErrors }
				/>

				{ error ? (
					<Notice
						status="error"
						isDismissible={ false }
						className="flow-ew-wizard__notice"
					>
						{ error }
					</Notice>
				) : null }
			</div>

			<div className="flow-ew-wizard__actions">
				<Button
					variant="link"
					onClick={ () => onClose( { saved: false } ) }
					disabled={ saving }
					className="flow-ew-wizard__skip"
				>
					{ i18n.skip }
				</Button>
				<div className="flow-ew-wizard__actions-right">
					<Button
						variant="tertiary"
						onClick={ back }
						disabled={ isFirst || saving }
					>
						{ i18n.back }
					</Button>
					<Button
						variant="primary"
						onClick={ next }
						disabled={ saving }
					>
						{ saving && (
							<>
								<Spinner /> { i18n.saving }
							</>
						) }
						{ ! saving && ( isLast ? i18n.finish : i18n.next ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
}

function App() {
	const [ open, setOpen ] = useState( !! cfg.autoOpen );
	const [ savedNotice, setSavedNotice ] = useState( false );

	useEffect( () => {
		function onOpen() {
			setOpen( true );
		}
		function onClick( event ) {
			if ( event.target.closest( '[data-flow-ew-open-setup]' ) ) {
				event.preventDefault();
				setOpen( true );
			}
		}
		document.addEventListener( 'flow-ew:open-setup-wizard', onOpen );
		document.addEventListener( 'click', onClick );
		return () => {
			document.removeEventListener( 'flow-ew:open-setup-wizard', onOpen );
			document.removeEventListener( 'click', onClick );
		};
	}, [] );

	useEffect( () => {
		if ( ! savedNotice ) {
			return undefined;
		}
		const t = setTimeout( () => setSavedNotice( false ), 4000 );
		return () => clearTimeout( t );
	}, [ savedNotice ] );

	function onClose( { saved } ) {
		setOpen( false );
		if ( saved ) {
			setSavedNotice( true );
			// Settings on this screen were rendered before the save.
			if ( document.querySelector( '[data-flow-ew-open-setup]' ) ) {
				window.location.reload();
			}
			return;
		}
		apiFetch( {
			url: cfg.skipUrl,
			method: 'POST',
			headers: { 'X-WP-Nonce': cfg.nonce },
		} ).catch( () => {} );
	}

	return (
		<>
			{ open ? <Wizard onClose={ onClose } /> : null }
			{ savedNotice ? (
				<div className="flow-ew-wizard__toast" role="status">
					{ i18n.saved }
				</div>
			) : null }
		</>
	);
}

domReady( () => {
	const host = document.createElement( 'div' );
	host.id = 'flow-ew-setup-wizard-host';
	document.body.appendChild( host );
	const root = createRoot( host );
	root.render( <App /> );
} );
