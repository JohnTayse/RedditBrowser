import { ErrorComponent } from './components/error.js';

import { HomeComponent } from './components/home.js';
import { SubredditComponent } from './components/subreddit.js';
import { UserComponent } from './components/user.js';
import { FavoritesComponent } from './components/favorites.js';

const routes = [
	{ path: '/', component: HomeComponent, },
	{ path: '/subreddit/:subreddit', component: SubredditComponent, },
	{ path: '/user/:user', component: UserComponent, },
	{ path: '/favorites', component: FavoritesComponent, }
];

const router = () => {
	const path = parseLocation();
	const route = findRouteByPath(path, routes) || { path: 'error', component: ErrorComponent };
	var id = '';
	if(path !== '/' && route.path !== 'error'){
		var baseRoute = route.path.replace(/:[^\s/]+/g, '')
		if(baseRoute !== path){
			id = path.replace(baseRoute, '')
		}
	}
	route.component.render(id);
};

const parseLocation = () => location.hash.slice(1).toLowerCase() || '/';
const findRouteByPath = (path, routes) => routes.find(r => path.match(new RegExp("^" + r.path.replace(/\/:[^\s/]+/g, '(\/.*)') + "$"))) || undefined;

export { router };