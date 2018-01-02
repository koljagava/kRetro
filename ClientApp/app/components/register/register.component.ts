import {User} from '../../models/persistency/user';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AlertService} from '../../services/alert.service';
import { UserService } from '../../services/user.service';
import { Team } from '../../models/persistency/team';

@Component({
    moduleId: module.id.toString(),
    templateUrl: 'register.component.html'
})

export class RegisterComponent {
    user: User = new User();
    loading = false;
    availableTeams : Team[];

    constructor(
        private router: Router,
        private userService: UserService,
        private alertService: AlertService) {
        this.userService.getUserTeams()
        .subscribe(
            data => this.availableTeams = data
            ,
            error => {
                this.alertService.error(error);
            });

        if (this.userService.currentUserId!=null){
            this.userService.getById(this.userService.currentUserId).subscribe(res=> this.user = res);
        }
    }

    register() {
        this.loading = true;
        if (this.userService.currentUserId!=null){
            this.userService.update(this.user)
                .subscribe(
                    data => {
                        this.alertService.success('Update successful', true);
                        this.loading = false;
                    },
                    error => {
                        this.alertService.error(error);
                        this.loading = false;
                    });
        }else{
            this.userService.create(this.user)
                .subscribe(
                    data => {
                        this.alertService.success('Registration successful', true);
                        this.router.navigate(['/login']);
                    },
                    error => {
                        this.alertService.error(error);
                        this.loading = false;
                    });
        }
    }
}
