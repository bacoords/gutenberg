const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function visitTemplatePartEditor( admin ) {
	const editorPath = '/types/wp_template_part/edit/emptytheme%2F%2Fheader';
	await admin.visitAdminPage(
		'themes.php',
		`page=site-template-parts-wp-admin&p=${ encodeURIComponent(
			editorPath
		) }`
	);
}

test.describe( 'Separate Site Editor admin pages @site-editor-v2-only', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'replaces the Site Editor menu with five Appearance destinations', async ( {
		admin,
		page,
	} ) => {
		await admin.visitAdminPage( 'index.php' );

		const appearanceMenu = page.locator( '#menu-appearance' );
		const expectedPages = [
			[ 'Styles', 'site-styles-wp-admin' ],
			[ 'Templates', 'site-templates-wp-admin' ],
			[ 'Template Parts', 'site-template-parts-wp-admin' ],
			[ 'Patterns', 'site-patterns-wp-admin' ],
			[ 'Navigation', 'site-navigation-wp-admin' ],
		];

		for ( const [ label, pageId ] of expectedPages ) {
			await expect(
				appearanceMenu.getByRole( 'link', { name: label, exact: true } )
			).toHaveAttribute( 'href', `themes.php?page=${ pageId }` );
		}

		await expect(
			appearanceMenu.getByRole( 'link', { name: 'Editor', exact: true } )
		).toHaveCount( 0 );
		await expect(
			appearanceMenu.getByRole( 'link', { name: 'Pages', exact: true } )
		).toHaveCount( 0 );
	} );

	test( 'opens every destination as its own page with the wp-admin sidebar', async ( {
		admin,
		page,
	} ) => {
		const destinations = [
			[ 'site-styles-wp-admin', 'Styles' ],
			[ 'site-templates-wp-admin', 'Templates' ],
			[ 'site-template-parts-wp-admin', 'Template Parts' ],
			[ 'site-patterns-wp-admin', 'Patterns' ],
			[ 'site-navigation-wp-admin', 'Navigation' ],
		];

		for ( const [ pageId, heading ] of destinations ) {
			await admin.visitAdminPage( 'themes.php', `page=${ pageId }` );

			await expect( page.locator( '#adminmenuwrap' ) ).toBeVisible();
			await expect(
				page.getByRole( 'heading', { name: heading, exact: true } )
			).toBeVisible();
			await expect( page ).toHaveURL(
				new RegExp( `[?&]page=${ pageId }(?:&|$)` )
			);
		}
	} );

	test( 'offers Fullscreen mode while editing an entity', async ( {
		admin,
		page,
	} ) => {
		await visitTemplatePartEditor( admin );

		const editorTopBar = page.getByRole( 'region', {
			name: 'Editor top bar',
		} );
		await expect( editorTopBar ).toBeVisible();
		await editorTopBar.getByRole( 'button', { name: 'Options' } ).click();

		await expect(
			page.getByRole( 'menuitemcheckbox', { name: /Fullscreen mode/ } )
		).toBeChecked();
	} );

	test( 'toggles the wp-admin sidebar without leaving the entity', async ( {
		admin,
		page,
	} ) => {
		await visitTemplatePartEditor( admin );

		const entityUrl = page.url();
		const adminMenu = page.locator( '#adminmenuwrap' );
		const editorTopBar = page.getByRole( 'region', {
			name: 'Editor top bar',
		} );
		const optionsButton = editorTopBar.getByRole( 'button', {
			name: 'Options',
		} );

		await expect( adminMenu ).toBeHidden();
		await optionsButton.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: /Fullscreen mode/ } )
			.click();

		await expect( adminMenu ).toBeVisible();
		await expect( page ).toHaveURL( entityUrl );

		const adminMenuBox = await adminMenu.boundingBox();
		const editorTopBarBox = await editorTopBar.boundingBox();
		expect( adminMenuBox ).not.toBeNull();
		expect( editorTopBarBox ).not.toBeNull();
		expect( editorTopBarBox.x ).toBeGreaterThanOrEqual(
			adminMenuBox.x + adminMenuBox.width
		);

		await page
			.getByRole( 'menuitemcheckbox', { name: /Fullscreen mode/ } )
			.click();

		await expect( adminMenu ).toBeHidden();
		await expect( page ).toHaveURL( entityUrl );
	} );
} );
