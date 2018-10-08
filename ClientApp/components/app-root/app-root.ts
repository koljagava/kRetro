// vedi https://bootsnipp.com/snippets/featured/social-network-layout-bootstrap-4
//      https://bootsnipp.com/snippets/0e5xd
//      https://bootsnipp.com/snippets/8MmZ5


import * as ko from 'knockout';
import * as History from 'history';
import { Route, Router } from '../../router';
import navMenu from '../nav-menu/nav-menu';
import {UserService} from '../../services/user.service';
import './app-root.css';

// Declare the client-side routing configuration
const routes: Route[] = [
    // { url: '',              params: { page: 'home-page' }, canActivate : UserService.canActivate },
    // { url: 'counter',       params: { page: 'counter-example',}, canActivate : UserService.canActivate },
    // { url: 'fetch-data/:id:',    params: { page: 'fetch-data' }, canActivate : UserService.canActivate },
    { url: 'register', params: { page: 'register' }},
    { url: 'login/:caller:', params: { page: 'login' }},
    { url: '', params: { page: 'board' }, canActivate : UserService.canActivate }
];

class AppRootViewModel {
    public route: KnockoutObservable<Route>;
    public router: Router;

    constructor(params: { history: History.History, basename: string }) {
        // Activate the client-side router
        this.router = new Router(params.history, routes, params.basename);
        this.route = this.router.currentRoute;

        // Load and register all the KO components needed to handle the routes
        // The optional 'bundle-loader?lazy!' prefix is a Webpack feature that causes the referenced modules
        // to be split into separate files that are then loaded on demand.
        // For docs, see https://github.com/webpack/bundle-loader
        ko.components.register('nav-menu', navMenu);
        ko.components.register('login', require('bundle-loader?lazy!../login/login'));
        ko.components.register('register', require('bundle-loader?lazy!../register/register'));
        ko.components.register('board', require('bundle-loader?lazy!../team-board/team-board'));
    }

    // To support hot module replacement, this method unregisters the router and KO components.
    // In production scenarios where hot module replacement is disabled, this would not be invoked.
    public dispose() {
        this.router.dispose();
        // TODO: Need a better API for this
        Object.getOwnPropertyNames((<any>ko).components._allRegisteredComponents).forEach(componentName => {
            ko.components.unregister(componentName);
        });
    }
}

export default { viewModel: AppRootViewModel, template: require('./app-root.html') };
