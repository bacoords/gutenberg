/**
 * External dependencies
 */
import {
	Dimensions,
	FlatList,
	SectionList,
	StyleSheet,
	Text,
	TouchableWithoutFeedback,
	View,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { BottomSheet, InserterButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const MIN_COL_NUM = 3;

export default function BlockTypesList( {
	name,
	items,
	onSelect,
	listProps,
	initialNumToRender = 3,
} ) {
	const [ numberOfColumns, setNumberOfColumns ] = useState( MIN_COL_NUM );
	const [ itemWidth, setItemWidth ] = useState();
	const [ maxWidth, setMaxWidth ] = useState();

	useEffect( () => {
		const dimensionsChangeSubscription = Dimensions.addEventListener(
			'change',
			onLayout
		);
		onLayout();
		return () => {
			dimensionsChangeSubscription.remove();
		};
	}, [] );

	function calculateItemWidth() {
		const { paddingLeft: itemPaddingLeft, paddingRight: itemPaddingRight } =
			InserterButton.Styles.modalItem;
		const { width } = InserterButton.Styles.modalIconWrapper;
		return width + itemPaddingLeft + itemPaddingRight;
	}

	function onLayout() {
		const columnStyle = styles[ 'block-types-list__column' ];
		const sumLeftRightPadding =
			columnStyle.paddingLeft + columnStyle.paddingRight;

		const bottomSheetWidth = BottomSheet.getWidth();
		const containerTotalWidth = bottomSheetWidth - sumLeftRightPadding;
		const itemTotalWidth = calculateItemWidth();

		const columnsFitToWidth = Math.floor(
			containerTotalWidth / itemTotalWidth
		);

		const numColumns = Math.max( MIN_COL_NUM, columnsFitToWidth );

		setNumberOfColumns( numColumns );
		setMaxWidth( containerTotalWidth / numColumns );

		if ( columnsFitToWidth < MIN_COL_NUM ) {
			const updatedItemWidth =
				( bottomSheetWidth - 2 * sumLeftRightPadding ) / MIN_COL_NUM;
			setItemWidth( updatedItemWidth );
		}
	}

	const contentContainerStyle = StyleSheet.flatten(
		listProps.contentContainerStyle
	);

	const renderSection = ( { item } ) => {
		return (
			<TouchableWithoutFeedback accessible={ false }>
				<FlatList
					data={ item.list }
					numColumns={ numberOfColumns }
					ItemSeparatorComponent={ () => (
						<TouchableWithoutFeedback accessible={ false }>
							<View
								style={
									styles[ 'block-types-list__row-separator' ]
								}
							/>
						</TouchableWithoutFeedback>
					) }
					scrollEnabled={ false }
					renderItem={ renderListItem }
				/>
			</TouchableWithoutFeedback>
		);
	};

	const renderListItem = ( { item } ) => {
		return (
			<InserterButton
				{ ...{
					item,
					itemWidth,
					maxWidth,
					onSelect,
				} }
			/>
		);
	};

	return (
		<SectionList
			onLayout={ onLayout }
			key={ `InserterUI-${ name }-${ numberOfColumns }` } // Re-render when numberOfColumns changes.
			testID={ `InserterUI-${ name }` }
			keyboardShouldPersistTaps="always"
			sections={ items }
			initialNumToRender={ initialNumToRender }
			keyExtractor={ ( item ) => item.id }
			renderSectionHeader={ ( { section: { metadata } } ) => {
				return metadata.title ? (
					<TouchableWithoutFeedback accessible={ false }>
						<View
							style={ {
								justifyContent: 'center',
								flexDirection: 'row',
								paddingTop: 32,
								paddingBottom: 32,
							} }
						>
							{ metadata.icon || null }
							<Text>{ metadata.title }</Text>
						</View>
					</TouchableWithoutFeedback>
				) : null;
			} }
			renderItem={ renderSection }
			{ ...listProps }
			contentContainerStyle={ {
				...contentContainerStyle,
				paddingBottom: Math.max(
					listProps.safeAreaBottomInset,
					contentContainerStyle.paddingBottom
				),
			} }
		/>
	);
}
