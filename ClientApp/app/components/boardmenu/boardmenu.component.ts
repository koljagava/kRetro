import { Component } from '@angular/core';
import { Team } from '../../models/persistency/team';
import { UserService } from '../../services/user.service';
import { Observable } from 'rxjs/Observable';
import { User } from '../../models/persistency/user';
import { BoardService } from '../../services/board.service';

@Component({
    selector: 'board-menu',
    templateUrl: './boardmenu.component.html',
    styleUrls: ['./boardmenu.component.css']
})

export class BoardMenuComponent {
    
    constructor(private boardService : BoardService) {
            // if (userService.isBrowser) {
                
            // }
    }
}
