import { __ } from '@wordpress/i18n';
import { ensureView } from './view-utils';

/**
 * Route configuration for pattern list.
 */
export const route = {
	title: () => __( 'Patterns' ),
	async canvas( context: {
		search: {
			page?: number;
			search?: string;
		};
	} ) {
		const view = await ensureView( context.search );

		// The route's custom canvas renders the selected pattern preview.
		return view.type === 'list' ? null : undefined;
	},
};
