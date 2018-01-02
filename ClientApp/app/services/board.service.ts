import {Team} from '../models/persistency/team';
import {Board} from '../models/persistency/board';
import { Injectable } from '@angular/core';
import * as signalR from "@aspnet/signalr-client";
import { User } from '../models/persistency/user';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs';
var _self:BoardService;
@Injectable()
export class BoardService {
    private boardHub : signalR.HubConnection|null = null;
    private connectedUser = new Subject<Array<User>>();
    public ConnectedUser = this.connectedUser.asObservable();
    private openedBoard = new Subject<Board>();
    public OpenedBoard = this.openedBoard.asObservable();
    public userId : number|null = null;
    public teamId : number|null = null;
    private team = new Subject<Team>();
    public Team = this.team.asObservable();

    constructor() { 
        _self = this;
    }

    public connectToBoard(userId : number, teamId:number){
        this.disconnectFromBoard();

        this.boardHub = new signalR.HubConnection('http://localhost:5000/boards?userId=' + userId + '&teamId=' + teamId);
        this.boardHub.on('ConnectedUsersUpdate',this.connectedUserUpdate)
        this.boardHub.on('OpenedBoardUpdate',this.openedBoardUpdate)
        this.boardHub.start().then(()=> {
            if (this.boardHub!=null)
                this.boardHub.invoke("GetTeam", teamId).then(function(result){
                  var team = <Team>result;
                  if(team!= null)
                    _self.team.next(team);
                }).catch(function(e){
                    var x = e;
                });
//                if(team!= null)
//                this.team.next(team);                        
        })
        .catch((reason)=>{
            //TODO: aggiungere gestione errore
            alert('errore connessione');
        });
    }

    public disconnectFromBoard(){
        if (this.boardHub== null)
            return;
        this.boardHub.off('ConnectedUsersUpdate',this.connectedUserUpdate)
        this.boardHub.off('OpenedBoardUpdate',this.openedBoardUpdate)
        this.boardHub.stop();
    }

    private connectedUserUpdate(users : Array<User>) : void {
        if(users!= null)
            this.connectedUser.next(users);
    }

    private openedBoardUpdate(board : Board) : void {
        if(board!= null)
        this.openedBoard.next(board);
    }

    private getTeam(team : Team) : void {
        if(team!= null)
        this.team.next(team);
    }
    
}
