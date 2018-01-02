import { Component } from '@angular/core';
import { Team } from '../../models/persistency/team';
import { UserService } from '../../services/user.service';
import { Observable } from 'rxjs/Observable';
import { User } from '../../models/persistency/user';

@Component({
    selector: 'nav-menu',
    templateUrl: './navmenu.component.html',
    styleUrls: ['./navmenu.component.css']
})

export class NavMenuComponent {
    public oTeams : Observable<Array<Team>>;
    public oUser : Observable<User>;
    
    constructor(private userService : UserService ) {
            if (userService.isBrowser) {
                this.oTeams = this.userService.getUserTeams(this.userService.currentUserId);
                this.oUser = this.userService.getById(this.userService.currentUserId);
            }
    }

    public logout():void {
        this.userService.logout();
    }
}
