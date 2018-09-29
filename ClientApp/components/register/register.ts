import * as ko from 'knockout';
import { UserService } from '../../services/user.service';
import {User} from '../../models/persistency/user';
import {Team} from '../../models/persistency/team';
import * as komap from 'knockout-mapping';

export class RegisterViewModel {
    public user :KnockoutObservable<KnockoutObservableType<User>>  = ko.observable(komap.fromJS(new User(), RegisterViewModel.userMappingOptions));
    public loading = ko.observable<boolean>(false);
    public submitted = ko.observable<boolean>(false);
    public availableTeams = ko.observableArray<Team>();

    private static userMappingOptions = {
            'teams': {
                create: (options:any) => {
                    return options.data;
                }
            }
        };
    constructor() {
        UserService.getTeams()
        .then(
            data => {
                let selected = new Array<Team>();
                let tt = data.map((team)=>{
                    if (this.user()!=null){
                        let ele = this.user().teams().filter((ele:Team)=> ele.id == team.id);
                        if (ele.length==1)
                            selected.push(team)
                        return team;
                    }
                    return team;
                });
                this.availableTeams(tt);
                if (selected.length!=0)
                    this.user().teams(selected);
            },
            error => {
                alert(error);                    
            });
        if (UserService.currentUser()!=null){
            this.user(komap.fromJS(UserService.currentUser(), RegisterViewModel.userMappingOptions));
        }
    }

    register() {
        this.loading(true);
        if (UserService.currentUser()!=null){
            UserService.update(komap.toJS<User>(this.user()))
                .then(
                    data => {
                        alert('Update successful');
                        this.loading(false);
                    },
                    error => {
                        alert(error);
                        this.loading(false);
                    });
        }else{
            UserService.create(komap.toJS<User>(this.user()))
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
