import { createRoot, useState, useEffect, useMemo, Fragment } from '@wordpress/element';
import {
	Button,
	Modal,
	Notice,
	Spinner,
	CheckboxControl,
	__experimentalText as Text,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import domReady from '@wordpress/dom-ready';
import './style.scss';

const cfg = window.flowEWSetup || {};
const i18n = cfg.i18n || {};
const choices = cfg.choices || { postTypes: [], roles: [] };
const reviewerRoleSlug = cfg.reviewerRoleSlug || 'flow_reviewer';
const initial = cfg.current || {
	mandatory: false,
	postTypes: [],
	reviewerRoles: [],
};

const TOTAL_STEPS = 3;

function ModeStep( { value, onChange } ) {
	return (
		<div className="flow-ew-wizard__step">
			<h2 className="flow-ew-wizard__step-title">{ i18n.modeTitle }</h2>
			<p className="flow-ew-wizard__step-desc">{ i18n.modeDesc }</p>

			<label
				className={ `flow-ew-wizard__option ${ value === false ? 'is-selected' : '' }` }
			>
				<input
					type="radio"
					name="flow-ew-mode"
					checked={ value === false }
					onChange={ () => onChange( false ) }
				/>
				<div>
					<strong>{ i18n.modeOptional }</strong>
					<Text variant="muted" as="p">
						{ i18n.modeOptionalDesc }
					</Text>
				</div>
			</label>

			<label
				className={ `flow-ew-wizard__option ${ value === true ? 'is-selected' : '' }` }
			>
				<input
					type="radio"
					name="flow-ew-mode"
					checked={ value === true }
					onChange={ () => onChange( true ) }
				/>
				<div>
					<strong>{ i18n.modeMandatory }</strong>
					<Text variant="muted" as="p">
						<u>{ i18n.modeMandatoryDescBlocked }</u>{ ' ' }
						{ i18n.modeMandatoryDescRest }
					</Text>
				</div>
			</label>
		</div>
	);
}

function SelectAllToggle( { all, value, onChange } ) {
	const allChecked = all.length > 0 && all.every( ( s ) => value.includes( s ) );
	function handle( e ) {
		e.preventDefault();
		onChange( allChecked ? [] : all.slice() );
	}
	return (
		<a
			href="#"
			className="flow-ew-wizard__select-all"
			onClick={ handle }
		>
			{ allChecked ? i18n.deselectAll : i18n.selectAll }
		</a>
	);
}

function PostTypesStep( { value, onChange } ) {
	const list = choices.postTypes || [];
	if ( list.length === 0 ) {
		return (
			<div className="flow-ew-wizard__step">
				<h2 className="flow-ew-wizard__step-title">{ i18n.typesTitle }</h2>
				<p className="flow-ew-wizard__step-desc">{ i18n.typesEmpty }</p>
			</div>
		);
	}

	function toggle( slug, on ) {
		const next = new Set( value );
		if ( on ) next.add( slug );
		else next.delete( slug );
		onChange( Array.from( next ) );
	}

	return (
		<div className="flow-ew-wizard__step">
			<h2 className="flow-ew-wizard__step-title">{ i18n.typesTitle }</h2>
			<p className="flow-ew-wizard__step-desc">{ i18n.typesDesc }</p>
			<SelectAllToggle
				all={ list.map( ( pt ) => pt.slug ) }
				value={ value }
				onChange={ onChange }
			/>
			<div className="flow-ew-wizard__check-list">
				{ list.map( ( pt ) => (
					<CheckboxControl
						key={ pt.slug }
						label={ `${ pt.label }  (${ pt.slug })` }
						checked={ value.includes( pt.slug ) }
						onChange={ ( on ) => toggle( pt.slug, on ) }
						__nextHasNoMarginBottom
					/>
				) ) }
			</div>
		</div>
	);
}

function RolesStep( { value, onChange } ) {
	const list = choices.roles || [];

	function toggle( slug, on ) {
		const next = new Set( value );
		if ( on ) next.add( slug );
		else next.delete( slug );
		onChange( Array.from( next ) );
	}

	return (
		<div className="flow-ew-wizard__step">
			<h2 className="flow-ew-wizard__step-title">{ i18n.rolesTitle }</h2>
			<p className="flow-ew-wizard__step-desc">{ i18n.rolesDesc }</p>
			<SelectAllToggle
				all={ list.map( ( r ) => r.slug ) }
				value={ value }
				onChange={ onChange }
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
							onChange={ ( on ) => toggle( r.slug, on ) }
							__nextHasNoMarginBottom
						/>
					</Fragment>
				) ) }
			</div>
		</div>
	);
}

function Wizard( { onClose } ) {
	const [ step, setStep ] = useState( 1 );
	const [ mandatory, setMandatory ] = useState( !! initial.mandatory );
	const [ postTypes, setPostTypes ] = useState(
		Array.isArray( initial.postTypes ) ? initial.postTypes : []
	);
	const [ reviewerRoles, setReviewerRoles ] = useState(
		Array.isArray( initial.reviewerRoles ) ? initial.reviewerRoles : []
	);
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState( '' );

	const isFirst = step === 1;
	const isLast = step === TOTAL_STEPS;

	function next() {
		setError( '' );
		if ( isLast ) {
			save();
		} else {
			setStep( step + 1 );
		}
	}

	function back() {
		setError( '' );
		if ( ! isFirst ) setStep( step - 1 );
	}

	async function save() {
		setSaving( true );
		setError( '' );
		try {
			await apiFetch( {
				url: cfg.restUrl,
				method: 'POST',
				headers: { 'X-WP-Nonce': cfg.nonce },
				data: {
					mandatory,
					post_types: postTypes,
					reviewer_roles: reviewerRoles,
				},
			} );
			onClose( { saved: true } );
		} catch ( e ) {
			setError( ( e && e.message ) || i18n.errorGeneric );
		} finally {
			setSaving( false );
		}
	}

	const stepEl = useMemo( () => {
		if ( step === 1 ) {
			return <ModeStep value={ mandatory } onChange={ setMandatory } />;
		}
		if ( step === 2 ) {
			return (
				<PostTypesStep value={ postTypes } onChange={ setPostTypes } />
			);
		}
		return (
			<RolesStep value={ reviewerRoles } onChange={ setReviewerRoles } />
		);
	}, [ step, mandatory, postTypes, reviewerRoles ] );

	return (
		<Modal
			title={ i18n.title }
			onRequestClose={ () => onClose( { saved: false } ) }
			className="flow-ew-wizard"
			size="medium"
			shouldCloseOnClickOutside={ false }
		>
			<div className="flow-ew-wizard__body">
				<p className="flow-ew-wizard__lead">{ i18n.lead }</p>

				<div className="flow-ew-wizard__progress" aria-hidden="true">
					{ Array.from( { length: TOTAL_STEPS } ).map( ( _, i ) => (
						<span
							key={ i }
							className={ `flow-ew-wizard__progress-dot ${
								i + 1 === step ? 'is-current' : ''
							} ${ i + 1 < step ? 'is-done' : '' }` }
						/>
					) ) }
					<span className="flow-ew-wizard__progress-label">
						{ i18n.step } { step } { i18n.of } { TOTAL_STEPS }
					</span>
				</div>

				{ stepEl }

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
						{ saving ? (
							<>
								<Spinner /> { i18n.saving }
							</>
						) : isLast ? (
							i18n.finish
						) : (
							i18n.next
						) }
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
		// Allow opening the wizard from any "Run setup again" trigger we add elsewhere.
		function onOpen() {
			setOpen( true );
		}
		document.addEventListener( 'flow-ew:open-setup-wizard', onOpen );
		return () =>
			document.removeEventListener(
				'flow-ew:open-setup-wizard',
				onOpen
			);
	}, [] );

	useEffect( () => {
		if ( ! savedNotice ) return undefined;
		const t = setTimeout( () => setSavedNotice( false ), 4000 );
		return () => clearTimeout( t );
	}, [ savedNotice ] );

	function onClose( { saved } ) {
		setOpen( false );
		if ( saved ) {
			setSavedNotice( true );
		}
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
