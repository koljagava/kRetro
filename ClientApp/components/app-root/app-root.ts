import * as ko from 'knockout';
import * as History from 'history';
import { Route, Router } from '../../router';
import navMenu from '../nav-menu/nav-menu';
import {UserService} from '../../services/user.service';
import './app-root.css';

// Declare the client-side routing configuration
const routes: Route[] = [
    { url: '#register', params: { page: 'register' }},
    { url: '#login/:caller:', params: { page: 'login' }},
    { url: '', params: { page: 'board' }, canActivate : UserService.canActivate },
    { url: '#history', params: { page: 'boards-history' }, canActivate : UserService.canActivate }
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
        ko.components.register('login', require('bundle-loader?lazy!../../pages/login/login'));
        ko.components.register('register', require('bundle-loader?lazy!../../pages/register/register'));
        ko.components.register('board', require('bundle-loader?lazy!../../pages/team-board/team-board'));
        ko.components.register('boards-history', require('bundle-loader?lazy!../../pages/team-boards-history/team-boards-history'));
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
