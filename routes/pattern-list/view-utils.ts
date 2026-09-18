import { __ } from '@wordpress/i18n';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { SupportedLayouts, View } from '@wordpress/dataviews';
import { loadView } from '@wordpress/views';
import { unlock } from '@wordpress/routes-lock-unlock';

const PATTERN_POST_TYPE = 'wp_block';

interface PatternViewConfig {
	default_view: View | undefined;
	default_layouts: SupportedLayouts | undefined;
}

/**
 * Adds the split list layout owned by the Patterns route without exposing it
 * to other wp_block consumers that do not render a companion preview canvas.
 *
 * @param defaultLayouts Server-provided layouts for patterns.
 * @return Layouts supported by the Patterns route.
 */
export function addPatternListLayout(
	defaultLayouts: SupportedLayouts | undefined
): SupportedLayouts {
	const listLayout =
		defaultLayouts?.list === true ? {} : ( defaultLayouts?.list ?? {} );

	return {
		...defaultLayouts,
		list: {
			showMedia: false,
			...listLayout,
		},
	};
}

/**
 * Resolves the server-provided pattern view configuration outside React.
 *
 * @return The pattern view configuration.
 */
async function loadPatternViewConfig(): Promise< PatternViewConfig > {
	const config = await unlock( resolveSelect( coreStore ) ).getViewConfig(
		'postType',
		PATTERN_POST_TYPE
	);

	return {
		default_view: config?.default_view,
		default_layouts: config?.default_layouts,
	};
}

/**
 * Resolves the persisted pattern view for the route loader.
 *
 * @param search        URL-backed view state.
 * @param search.page   Current page number.
 * @param search.search Current search query.
 * @return The resolved view.
 */
export async function ensureView( search?: {
	page?: number;
	search?: string;
} ) {
	const { default_view: defaultView, default_layouts: defaultLayouts } =
		await loadPatternViewConfig();

	if ( ! defaultView ) {
		throw new Error(
			'Missing view configuration for the wp_block post type.'
		);
	}

	return loadView( {
		kind: 'postType',
		name: PATTERN_POST_TYPE,
		slug: 'default-new',
		defaultView,
		defaultLayouts: addPatternListLayout( defaultLayouts ),
		queryParams: search,
	} );
}

export const DEFAULT_VIEWS: {
	slug: string;
	label: string;
}[] = [
	{
		slug: 'all',
		label: __( 'All patterns' ),
	},
	{
		slug: 'my-patterns',
		label: __( 'My patterns' ),
	},
	{
		slug: 'registered',
		label: __( 'Registered' ),
	},
];
