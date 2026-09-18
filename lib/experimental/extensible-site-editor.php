<?php
/**
 * Extensible Site Editor experiment integration.
 *
 * Only loaded while the `gutenberg-extensible-site-editor` experiment is
 * enabled (see lib/load.php).
 *
 * @package gutenberg
 */

/**
 * Returns the separate Site Editor pages shown under Appearance.
 *
 * @return array<string, array<string, bool|string>> Page definitions keyed by page ID.
 */
function gutenberg_get_site_editor_admin_pages() {
	return array(
		'site-styles'         => array(
			'page_title'   => __( 'Styles', 'gutenberg' ),
			'menu_title'   => __( 'Styles', 'gutenberg' ),
			'callback'     => 'gutenberg_site_styles_wp_admin_render_page',
			'is_available' => true,
		),
		'site-templates'      => array(
			'page_title'   => __( 'Templates', 'gutenberg' ),
			'menu_title'   => __( 'Templates', 'gutenberg' ),
			'callback'     => 'gutenberg_site_templates_wp_admin_render_page',
			'is_available' => current_theme_supports( 'block-templates' ),
		),
		'site-template-parts' => array(
			'page_title'   => __( 'Template Parts', 'gutenberg' ),
			'menu_title'   => __( 'Template Parts', 'gutenberg' ),
			'callback'     => 'gutenberg_site_template_parts_wp_admin_render_page',
			'is_available' => current_theme_supports( 'block-templates' ) || current_theme_supports( 'block-template-parts' ),
		),
		'site-patterns'       => array(
			'page_title'   => __( 'Patterns', 'gutenberg' ),
			'menu_title'   => __( 'Patterns', 'gutenberg' ),
			'callback'     => 'gutenberg_site_patterns_wp_admin_render_page',
			'is_available' => true,
		),
		'site-navigation'     => array(
			'page_title'   => __( 'Navigation', 'gutenberg' ),
			'menu_title'   => __( 'Navigation', 'gutenberg' ),
			'callback'     => 'gutenberg_site_navigation_wp_admin_render_page',
			'is_available' => wp_is_block_theme(),
		),
	);
}

/**
 * Replaces the single Site Editor menu entry with separate wp-admin pages.
 *
 * Each page uses the generated wp-admin page mode, which preserves the normal
 * WordPress admin sidebar. The original `site-editor-v2` page remains
 * registered as a hidden compatibility entry point for existing deep links.
 *
 * @global array $submenu WordPress admin submenu array.
 */
function gutenberg_register_separate_site_editor_admin_pages() {
	global $submenu;

	if ( isset( $submenu['themes.php'] ) && is_array( $submenu['themes.php'] ) ) {
		foreach ( $submenu['themes.php'] as $key => $item ) {
			if ( ! is_array( $item ) || ! isset( $item[2] ) || ! is_string( $item[2] ) ) {
				continue;
			}

			if ( 'site-editor.php' === $item[2] || 0 === strpos( $item[2], 'site-editor.php?' ) ) {
				unset( $submenu['themes.php'][ $key ] );
			}
		}
	}

	$pages         = gutenberg_get_site_editor_admin_pages();
	$enabled_pages = array_fill_keys( array_keys( $pages ), true );

	/**
	 * Filters which separate Site Editor pages are registered under Appearance.
	 *
	 * Set a page ID to false or remove it from the array to disable that page.
	 * Unknown page IDs are ignored.
	 *
	 * @param array<string, bool> $enabled_pages Page IDs mapped to enabled states.
	 */
	$enabled_pages = apply_filters( 'gutenberg_site_editor_admin_pages', $enabled_pages );

	// A malformed filtered value must not cause warnings while rendering wp-admin.
	if ( ! is_array( $enabled_pages ) ) {
		return;
	}

	foreach ( $pages as $page_id => $page ) {
		if ( true !== ( $enabled_pages[ $page_id ] ?? false ) || true !== $page['is_available'] ) {
			continue;
		}

		add_submenu_page(
			'themes.php',
			$page['page_title'],
			$page['menu_title'],
			'edit_theme_options',
			$page_id . '-wp-admin',
			$page['callback']
		);
	}
}
add_action( 'admin_menu', 'gutenberg_register_separate_site_editor_admin_pages', 100 );
