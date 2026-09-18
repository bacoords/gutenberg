import { useDispatch, useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';
import { keyboardShortcut } from '@wordpress/keycodes';
import { store as preferencesStore } from '@wordpress/preferences';
import { useViewportMatch } from '@wordpress/compose';
import { unlock } from '../../lock-unlock';

const { FullscreenMode, MoreMenuPreferenceItem, ViewMoreMenuGroup } =
	unlock( editorPrivateApis );

const preferenceScope = 'core/edit-post';
const preferenceName = 'fullscreenMode';
const shortcutName = 'core/edit-post/toggle-fullscreen';

/**
 * Whether the editor is using WordPress fullscreen mode.
 *
 * The regular post editor owns this preference. Sharing it gives every entity
 * opened in the single-page editor the same fullscreen setting.
 *
 * @return Whether fullscreen mode is active.
 */
export function useIsEditorFullscreenMode() {
	return useSelect(
		( select ) =>
			!! select( preferencesStore ).get(
				preferenceScope,
				preferenceName
			),
		[]
	);
}

/**
 * Connects a single-page editor to the fullscreen behavior of the post editor.
 *
 * @param props          Component props.
 * @param props.isActive Whether fullscreen mode is active.
 * @return The fullscreen controller and editor menu fill.
 */
export default function EditorFullscreenMode( {
	isActive,
}: {
	isActive: boolean;
} ) {
	const isLargeViewport = useViewportMatch( 'large' );
	const { toggle } = useDispatch( preferencesStore );
	const { registerShortcut, unregisterShortcut } = useDispatch(
		keyboardShortcutsStore
	);

	useEffect( () => {
		registerShortcut( {
			name: shortcutName,
			category: 'global',
			description: __( 'Enable or disable fullscreen mode.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 'f',
			},
		} );

		return () => {
			unregisterShortcut( shortcutName );
		};
	}, [ registerShortcut, unregisterShortcut ] );

	useShortcut( shortcutName, () => {
		toggle( preferenceScope, preferenceName );
	} );

	return (
		<>
			<FullscreenMode isActive={ isActive } />
			{ isLargeViewport && (
				<ViewMoreMenuGroup>
					<MoreMenuPreferenceItem
						scope={ preferenceScope }
						name={ preferenceName }
						label={ __( 'Fullscreen mode' ) }
						info={ __( 'Show and hide the admin user interface' ) }
						messageActivated={ __( 'Fullscreen mode activated.' ) }
						messageDeactivated={ __(
							'Fullscreen mode deactivated.'
						) }
						shortcut={ keyboardShortcut.secondary( 'f' ) }
					/>
				</ViewMoreMenuGroup>
			) }
		</>
	);
}
