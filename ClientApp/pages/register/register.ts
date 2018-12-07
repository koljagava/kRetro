import * as ko from 'knockout';
import { UserService } from '../../services/user.service';
import {User} from '../../models/persistency/user';
import {Team} from '../../models/persistency/team';

export class RegisterViewModel {
    public user :KnockoutObservable<User> = ko.observable(new User());
    public loading = ko.observable<boolean>(false);
    public submitted = ko.observable<boolean>(false);
    public availableTeams = UserService.teams;
    public userService = UserService;

    constructor() {     
        if (this.userService.currentUser() != null && 
            this.userService.currentUser().id != 0){            
            this.user(this.cloneUser(this.userService.currentUser()));
        }
        this.userService.currentUser.subscribe((value) => {
            if (value != undefined &&  value!= null){
                this.user(this.cloneUser(value));
            }
        });
    }


    private cloneUser = (user: User) : User => {
        if (user == undefined || user == null){
            return null;
        }
        const clone = new User();
        clone.id = user.id;
        clone.firstName = user.firstName;
        clone.lastName = user.lastName;
        clone.username = user.username;
        clone.password = user.password;
        clone.team = user.team;
        return clone;
    }

    register() {
        this.loading(true);
        if (UserService.currentUser()!=null){
            UserService.update(this.user())
                .then(
                    data => {
                        alert('Update successful');
                        this.loading(false);
                    },
                    error => {
                        alert(error);
                        this.loading(false);
                    });
        } else {
            UserService.create(this.user())
                .then(
                    data => {
                        alert('Registration successful');
                        document.location.href = "login";
                    },
                    error => {
                        alert(error);
                        this.loading(false);
                    });
        }
    }
}

export default { viewModel: RegisterViewModel, template: require('./register.html') };
