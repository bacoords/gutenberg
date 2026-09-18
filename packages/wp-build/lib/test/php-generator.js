import { describe, expect, it } from 'vitest';
import { renderTemplateToString as generateTemplate } from '../php-generator.mjs';

describe( 'page-wp-admin.php template', () => {
	it( 'retains the Core Boot compatibility class on the mount element', async () => {
		const generatedPage = await generateTemplate(
			'page-wp-admin.php.template',
			{
				'{{PAGE_SLUG}}': 'example',
			}
		);

		expect( generatedPage ).toContain(
			'<div id="example-wp-admin-app" class="boot-layout-container"></div>'
		);
	} );

	it( 'forwards the configured default path to Boot', async () => {
		const generatedPage = await generateTemplate(
			'page-wp-admin.php.template',
			{
				'{{DEFAULT_PATH_JSON}}': '"/styles"',
			}
		);

		expect( generatedPage ).toContain(
			'mod.initSinglePage( { mountId, routes, initModules, defaultPath } );'
		);
		expect( generatedPage ).toContain(
			'wp_json_encode( "/styles", JSON_HEX_TAG | JSON_UNESCAPED_SLASHES )'
		);
	} );
} );

describe( 'page.php template', () => {
	it( 'guards the admin_init interceptor with authentication and the configured capability', async () => {
		const generatedPage = await generateTemplate( 'page.php.template', {
			'{{PAGE_SLUG}}': 'example',
			'{{PAGE_SLUG_UNDERSCORE}}': 'example',
			'{{PREFIX}}': 'wp',
			'{{CAPABILITY}}': 'edit_theme_options',
		} );

		const interceptor = generatedPage.slice(
			generatedPage.indexOf( 'function wp_example_intercept_render()' )
		);

		expect( interceptor ).toContain( 'is_user_logged_in()' );
		expect( interceptor ).toContain(
			"current_user_can( 'edit_theme_options' )"
		);
		expect( interceptor.indexOf( 'current_user_can' ) ).toBeLessThan(
			interceptor.indexOf( 'wp_example_render_page()' )
		);
	} );
} );
