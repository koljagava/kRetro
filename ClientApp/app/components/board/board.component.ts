import {UserService} from '../../services/user.service';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { BoardService } from '../../services/board.service';
import {Params, ActivatedRoute} from '@angular/router';

@Component({
    selector: 'board',
    templateUrl: './board.component.html'
})

export class BoardComponent implements OnInit{
    @Input() teamId : number;
    constructor(private activatedRoute : ActivatedRoute, private userService: UserService, private boardService : BoardService) {
    }
    
    ngOnInit() {
        // subscribe to router event
        this.activatedRoute.params.subscribe((params: Params) => {
            this.teamId =  Number(params['teamId']);
            if (this.userService.currentUserId!=null)
                this.boardService.connectToBoard(this.userService.currentUserId, this.teamId);
        });
    }

    createRetro(){
        //this.boardService
    }
}