const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const destinations = [
	[ 'Styles', '/styles', '/styles' ],
	[ 'Templates', '/templates', '/templates/list/all' ],
	[ 'Template Parts', '/template-parts', '/template-parts/list/all-parts' ],
	[ 'Patterns', '/patterns', '/patterns/list/all' ],
	[ 'Navigation', '/navigation', '/navigation/list' ],
];

async function visitSiteEditorRoute( admin, path ) {
	await admin.visitAdminPage(
		'themes.php',
		`page=site-editor-v2-wp-admin&p=${ encodeURIComponent( path ) }`
	);
}

async function visitTemplatePartEditor( admin ) {
	await visitSiteEditorRoute(
		admin,
		'/types/wp_template_part/edit/emptytheme%2F%2Fheader'
	);
}

test.describe( 'Site Editor admin menu routes @site-editor-v2-only', () => {
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

	test( 'shows five Appearance destinations that share the Site Editor host', async ( {
		admin,
		page,
	} ) => {
		await admin.visitAdminPage( 'index.php' );

		const appearanceMenu = page.locator( '#menu-appearance' );

		for ( const [ label, path ] of destinations ) {
			const link = appearanceMenu.getByRole( 'link', {
				name: label,
				exact: true,
			} );
			const href = await link.getAttribute( 'href' );
			expect( href ).not.toBeNull();

			const url = new URL( href, page.url() );
			expect( url.pathname ).toMatch( /\/wp-admin\/themes\.php$/ );
			expect( url.searchParams.get( 'page' ) ).toBe(
				'site-editor-v2-wp-admin'
			);
			expect( url.searchParams.get( 'p' ) ).toBe( path );
		}

		await expect(
			appearanceMenu.getByRole( 'link', { name: 'Editor', exact: true } )
		).toHaveCount( 0 );
		await expect(
			appearanceMenu.getByRole( 'link', { name: 'Pages', exact: true } )
		).toHaveCount( 0 );
	} );

	test( 'opens each destination at its expected client route with the wp-admin sidebar', async ( {
		admin,
		page,
	} ) => {
		await admin.visitAdminPage(
			'themes.php',
			'page=site-editor-v2-wp-admin'
		);
		await expect(
			page.getByRole( 'heading', { name: 'Styles', exact: true } )
		).toBeVisible();

		for ( const [ heading, path, expectedPath ] of destinations ) {
			await visitSiteEditorRoute( admin, path );

			await expect( page.locator( '#adminmenuwrap' ) ).toBeVisible();
			await expect(
				page.getByRole( 'heading', { name: heading, exact: true } )
			).toBeVisible();

			const url = new URL( page.url() );
			expect( url.searchParams.get( 'page' ) ).toBe(
				'site-editor-v2-wp-admin'
			);
			expect( url.searchParams.get( 'p' ) ).toBe( expectedPath );
		}
	} );

	test( 'switches Appearance destinations without reloading the document', async ( {
		admin,
		page,
	} ) => {
		await visitSiteEditorRoute( admin, '/styles' );
		await page.evaluate( () => {
			window.__siteEditorDocumentMarker = true;
		} );

		await page
			.locator( '#menu-appearance' )
			.getByRole( 'link', { name: 'Patterns', exact: true } )
			.click();

		await expect(
			page.getByRole( 'heading', { name: 'Patterns', exact: true } )
		).toBeVisible();
		expect(
			await page.evaluate( () => window.__siteEditorDocumentMarker )
		).toBe( true );
		expect( new URL( page.url() ).searchParams.get( 'p' ) ).toBe(
			'/patterns/list/all'
		);
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
