<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Breakdance extends Breakdance_Family {

	protected function slug(): string {
		return 'breakdance';
	}
}
