import * as ko from 'knockout';
import { Route, Router } from '../../router';
import { Team } from '../../models/persistency/team';
import { User } from '../../models/persistency/user';
import { UserService } from '../../services/user.service';
import './nav-menu.css';
import * as feather from 'feather-icons';

interface NavMenuParams {
    router: Router;
}

class NavMenuViewModel {
    private router: Router;
    public route: KnockoutObservable<Route>;
    public userService = UserService;
    public feather = feather;

    constructor(params: NavMenuParams) {
        this.router = params.router;
        this.route = this.router.currentRoute;
    };
}

export default { viewModel: NavMenuViewModel, template: require('./nav-menu.html') };