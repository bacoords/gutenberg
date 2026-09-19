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
 * Returns the Site Editor destinations shown under Appearance.
 *
 * @return array<string, array<string, bool|string|string[]>> Destination definitions keyed by destination ID.
 */
function gutenberg_get_site_editor_admin_menu_items() {
	return array(
		'site-styles'         => array(
			'page_title'     => __( 'Styles', 'gutenberg' ),
			'menu_title'     => __( 'Styles', 'gutenberg' ),
			'path'           => '/styles',
			'match_prefixes' => array( '/styles' ),
			'is_available'   => true,
		),
		'site-templates'      => array(
			'page_title'     => __( 'Templates', 'gutenberg' ),
			'menu_title'     => __( 'Templates', 'gutenberg' ),
			'path'           => '/templates',
			'match_prefixes' => array( '/templates', '/types/wp_template/' ),
			'is_available'   => current_theme_supports( 'block-templates' ),
		),
		'site-template-parts' => array(
			'page_title'     => __( 'Template Parts', 'gutenberg' ),
			'menu_title'     => __( 'Template Parts', 'gutenberg' ),
			'path'           => '/template-parts',
			'match_prefixes' => array( '/template-parts', '/types/wp_template_part/' ),
			'is_available'   => current_theme_supports( 'block-templates' ) || current_theme_supports( 'block-template-parts' ),
		),
		'site-patterns'       => array(
			'page_title'     => __( 'Patterns', 'gutenberg' ),
			'menu_title'     => __( 'Patterns', 'gutenberg' ),
			'path'           => '/patterns',
			'match_prefixes' => array( '/patterns', '/types/wp_block/' ),
			'is_available'   => true,
		),
		'site-navigation'     => array(
			'page_title'     => __( 'Navigation', 'gutenberg' ),
			'menu_title'     => __( 'Navigation', 'gutenberg' ),
			'path'           => '/navigation',
			'match_prefixes' => array( '/navigation' ),
			'is_available'   => wp_is_block_theme(),
		),
	);
}

/**
 * Returns the wp-admin URL for a Site Editor destination.
 *
 * @param string $path Site Editor route path.
 * @return string Destination URL.
 */
function gutenberg_get_site_editor_admin_url( $path ) {
	return add_query_arg(
		array(
			'page' => 'site-editor-v2-wp-admin',
			'p'    => $path,
		),
		'themes.php'
	);
}

/**
 * Replaces the single Site Editor menu entry with route aliases.
 *
 * All destinations share one WordPress admin screen and one client-side route
 * tree. This preserves the normal wp-admin sidebar without splitting Site
 * Editor extensions across separate screen IDs.
 *
 * @global array $submenu WordPress admin submenu array.
 */
function gutenberg_register_site_editor_admin_menu_items() {
	global $submenu;

	// Register one shared wp-admin host for every client-side destination.
	add_submenu_page(
		'themes.php',
		__( 'Site Editor', 'gutenberg' ),
		__( 'Site Editor', 'gutenberg' ),
		'edit_theme_options',
		'site-editor-v2-wp-admin',
		'gutenberg_site_editor_v2_wp_admin_render_page'
	);

	if ( isset( $submenu['themes.php'] ) && is_array( $submenu['themes.php'] ) ) {
		foreach ( $submenu['themes.php'] as $key => $item ) {
			if ( ! is_array( $item ) || ! isset( $item[2] ) || ! is_string( $item[2] ) ) {
				continue;
			}

			if (
				'site-editor-v2-wp-admin' === $item[2] ||
				'site-editor.php' === $item[2] ||
				0 === strpos( $item[2], 'site-editor.php?' )
			) {
				unset( $submenu['themes.php'][ $key ] );
			}
		}
	}

	$destinations         = gutenberg_get_site_editor_admin_menu_items();
	$enabled_destinations = array_fill_keys( array_keys( $destinations ), true );

	/**
	 * Filters which Site Editor destinations are shown under Appearance.
	 *
	 * Set a destination ID to false or remove it from the array to hide that
	 * destination. Unknown destination IDs are ignored.
	 *
	 * @param array<string, bool> $enabled_destinations Destination IDs mapped to enabled states.
	 */
	$enabled_destinations = apply_filters( 'gutenberg_site_editor_admin_pages', $enabled_destinations );

	// A malformed filtered value must not cause warnings while rendering wp-admin.
	if ( ! is_array( $enabled_destinations ) ) {
		return;
	}

	foreach ( $destinations as $destination_id => $destination ) {
		if ( true !== ( $enabled_destinations[ $destination_id ] ?? false ) || true !== $destination['is_available'] ) {
			continue;
		}

		$submenu['themes.php'][] = array(
			$destination['menu_title'],
			'edit_theme_options',
			gutenberg_get_site_editor_admin_url( $destination['path'] ),
			$destination['page_title'],
		);
	}
}
add_action( 'admin_menu', 'gutenberg_register_site_editor_admin_menu_items', 100 );

/**
 * Highlights the Appearance destination that owns the current client route.
 *
 * @param string|null $submenu_file Current submenu file.
 * @param string|null $parent_file  Current parent file.
 * @return string|null Filtered submenu file.
 */
function gutenberg_site_editor_admin_submenu_file( $submenu_file, $parent_file ) {
	if (
		'themes.php' !== $parent_file ||
		! isset( $_GET['page'] ) ||
		'site-editor-v2-wp-admin' !== $_GET['page']
	) {
		return $submenu_file;
	}

	$path         = isset( $_GET['p'] ) ? sanitize_text_field( wp_unslash( $_GET['p'] ) ) : '/styles';
	$destinations = gutenberg_get_site_editor_admin_menu_items();

	foreach ( $destinations as $destination ) {
		foreach ( $destination['match_prefixes'] as $prefix ) {
			if ( 0 === strpos( $path, $prefix ) ) {
				return gutenberg_get_site_editor_admin_url( $destination['path'] );
			}
		}
	}

	return $submenu_file;
}
add_filter( 'submenu_file', 'gutenberg_site_editor_admin_submenu_file', 10, 2 );
