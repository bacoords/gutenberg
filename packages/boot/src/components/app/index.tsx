import { createRoot, StrictMode, type ComponentType } from '@wordpress/element';
import { dispatch, useSelect } from '@wordpress/data';
import Router from './router';
import RootSinglePage from '../root/single-page';
import { store } from '../../store';
import type { MenuItem, Route } from '../../store/types';

interface AppProps {
	rootComponent?: ComponentType;
	defaultPath?: string;
}

function App( { rootComponent, defaultPath }: AppProps ) {
	const routes = useSelect( ( select ) => select( store ).getRoutes(), [] );

	return (
		<Router
			routes={ routes }
			rootComponent={ rootComponent }
			defaultPath={ defaultPath }
		/>
	);
}

/*
 * Import and run page init modules.
 * Each module must export an async `init` function,
 * awaited before the app renders so startup tasks finish first.
 */
async function runInitModules( initModules?: string[] ) {
	for ( const moduleId of initModules ?? [] ) {
		const module = await import( moduleId );
		await module.init();
	}
}

interface InitProps {
	mountId: string;
	menuItems?: MenuItem[];
	routes?: Route[];
	initModules?: string[];
	dashboardLink?: string;
	defaultPath?: string;
}

export async function init( {
	mountId,
	menuItems,
	routes,
	initModules,
	dashboardLink,
	defaultPath,
}: InitProps ) {
	( menuItems ?? [] ).forEach( ( menuItem ) => {
		dispatch( store ).registerMenuItem( menuItem.id, menuItem );
	} );

	( routes ?? [] ).forEach( ( route ) => {
		dispatch( store ).registerRoute( route );
	} );

	if ( dashboardLink ) {
		dispatch( store ).setDashboardLink( dashboardLink );
	}

	await runInitModules( initModules );

	// Render the app
	const rootElement = document.getElementById( mountId );
	if ( rootElement ) {
		const root = createRoot( rootElement );
		root.render(
			<StrictMode>
				<App defaultPath={ defaultPath } />
			</StrictMode>
		);
	}
}

interface InitSinglePageProps {
	mountId: string;
	routes?: Route[];
	initModules?: string[];
	defaultPath?: string;
}

export async function initSinglePage( {
	mountId,
	routes,
	initModules,
	defaultPath,
}: InitSinglePageProps ) {
	( routes ?? [] ).forEach( ( route ) => {
		dispatch( store ).registerRoute( route );
	} );

	await runInitModules( initModules );

	// Render the app without sidebar
	const rootElement = document.getElementById( mountId );
	if ( rootElement ) {
		const root = createRoot( rootElement );
		root.render(
			<StrictMode>
				<App
					rootComponent={ RootSinglePage }
					defaultPath={ defaultPath }
				/>
			</StrictMode>
		);
	}
}
