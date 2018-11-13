import * as ko from 'knockout';
import { UserService } from '../../services/user.service';

export class LoginViewModel {
    public username = ko.observable<string>(null);
    public password = ko.observable<string>(null);
    public loading = ko.observable<boolean>(false);
    public submitted = ko.observable<boolean>(false);    
    returnUrl: string;

    constructor(params :any ) {
        this.returnUrl = params.caller;
    }

    login() {
        this.loading(true);
        this.submitted(true);
        UserService.login(this.username(), this.password())
            .then(
                (data:any) => {
                    document.location.href = this.returnUrl||"";
                    this.loading(false);
                },
                (error:any) => {
                    this.loading(false);
                    alert(error);                    
                });
    }
}

export default { viewModel: LoginViewModel, template: require('./login.html') };
