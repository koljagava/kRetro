import * as ko from 'knockout';
import { Route, Router } from '../../router';
import { Team } from '../../models/persistency/team';
import { User } from '../../models/persistency/user';
import { UserService } from '../../services/user.service';
import './nav-menu.css';

interface NavMenuParams {
    router: Router;
}

class NavMenuViewModel {
    public router: Router;
    public route: KnockoutObservable<Route>;
    public user =  ko.observable<User>(null);
    

    constructor(params: NavMenuParams) {
        this.router = params.router;
        this.route = this.router.currentRoute;
        this.user = UserService.currentUser;
    };
}

export default { viewModel: NavMenuViewModel, template: require('./nav-menu.html') };
