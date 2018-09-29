import * as ko from 'knockout';
import {Team} from '../models/persistency/team';
import {Board, BoardStatus} from '../models/persistency/board';
import * as signalR from "@aspnet/signalr";
import { User } from '../models/persistency/user';

export class BoardService {
    private boardHub : signalR.HubConnection|null = null;
    public connectedUsers = ko.observableArray<User>(new Array<User>());
    public board = ko.observable<Board>(null);

    constructor(public user: KnockoutObservable<User> , public team : KnockoutObservable<Team>) {         
    }

    public connectToBoard(){
        this.disconnectFromBoard();
        this.boardHub = new signalR.HubConnectionBuilder().withUrl('http://localhost:5000/boards?userId=' + this.user().id + '&teamId=' + this.team().id).build();
        this.boardHub.on('ConnectedUsersUpdate',this.connectedUserUpdate)
        this.boardHub.on('BoardUpdate',this.boardUpdate)
        this.boardHub.start().catch((reason:any)=>{
            alert("errore connessione: " + reason + ".");
         });
    }

    public disconnectFromBoard(){
        if (this.boardHub== null)
            return;
        this.boardHub.off('ConnectedUsersUpdate',this.connectedUserUpdate)
        this.boardHub.off('BoardUpdate',this.boardUpdate)
        this.boardHub.stop();
    }

    public startNewBoard(boardName : string) : void {
        this.boardHub.invoke("StarNewBoard", boardName).catch((reason:any)=>{
            throw new Error(reason);
        });
    }

    public sendCardMessage(message : string) : void{
        this.boardHub.invoke("SendCardMessage", message).catch((reason:any)=>{
            throw new Error(reason);
        });
    }

    public changeBoardStatus = (status : BoardStatus) : void => {
        if (this.board()== null)
            throw new Error("board is not opened.");
        if (this.board().manager.id != this.user().id)
            throw new Error("only board manager can change board status");
        this.boardHub.invoke("")
    }

    private connectedUserUpdate = (users : Array<User>) : void => {
        if(users!= null)
            this.connectedUsers(users);
    }

    private boardUpdate = (board : Board) : void => {
        if(board!= null)
            this.board(board);
    }
}