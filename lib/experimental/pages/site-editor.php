<?php
/**
 * Site Editor Page - Integration file for admin menu registration.
 *
 * @package gutenberg
 */

/**
 * Register site editor admin page in WordPress admin menu.
 */
function gutenberg_register_site_editor_admin_page() {
	add_submenu_page(
		'nothing',
		__( 'Site Editor', 'gutenberg' ),
		__( 'Site Editor', 'gutenberg' ),
		'manage_options',
		'site-editor-v2',
		'gutenberg_site_editor_v2_render_page'
	);
}
add_action( 'admin_menu', 'gutenberg_register_site_editor_admin_page' );
