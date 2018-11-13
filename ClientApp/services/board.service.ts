import * as ko from 'knockout';
import {Team} from '../models/persistency/team';
import {Board, BoardStatus, WhatDoesntUserVoteStatus, WhatWorksUserVoteStatus} from '../models/persistency/board';
import * as signalR from "@aspnet/signalr";
import { User } from '../models/persistency/user';
import { BadVoteType } from '../models/persistency/cardBad';
//import * as komap from 'knockout-mapping';

export interface IBoardServiceMessage {
    message : string;
    time : Date;
}

class BoardServiceMessage implements IBoardServiceMessage{
    public time: Date;
    constructor(public message : string){
        this.time = new Date();
    }
}

export class BoardService {
    private boardHub : signalR.HubConnection|null = null;
    public connectedUsers = ko.observableArray<User>(new Array<User>());
    //public board : KnockoutObservable<KnockoutObservableType<Board>> = ko.observable<KnockoutObservableType<Board>>(null);
    public board : KnockoutObservable<Board> = ko.observable<Board>(null);
    public doPublishCards : KnockoutSubscribable<void> = new ko.subscribable();
    public serviceMessages : KnockoutObservableArray<IBoardServiceMessage> = ko.observableArray([]);
    public maxServiceMessagesAllowed : number = 4;
    public minutesServiceMessagesInQueue : number = 1;
    private serviceMessagesIntervalId : number = null;  

    constructor(public user: KnockoutObservable<User> , public team : KnockoutObservable<Team>) {         
    }

    public connectToBoard(){
        this.disconnectFromBoard();
        this.boardHub = new signalR.HubConnectionBuilder().withUrl('http://localhost:5000/boards?userId=' + this.user().id + '&teamId=' + this.team().id).build();
        this.boardHub.on('ConnectedUsersUpdate',this.connectedUserUpdate);
        this.boardHub.on('BoardUpdate',this.boardUpdate);
        this.boardHub.on('SendMessage',this.messageSent);
        this.boardHub.on('PublishCards',this.publishCards);
        this.boardHub.start().catch((reason:any)=>{
            alert("errore connessione: " + reason + ".");
         });
    }

    public disconnectFromBoard(){
        if (this.boardHub== null)
            return;
        this.boardHub.off('ConnectedUsersUpdate',this.connectedUserUpdate)
        this.boardHub.off('BoardUpdate',this.boardUpdate)
        this.boardHub.off('SendMessage',this.messageSent);
        this.boardHub.off('PublishCards',this.publishCards);
        this.boardHub.stop();
    }

    public startNewBoard(boardName : string) : void {
        this.boardHub.invoke("StarNewBoard", boardName).catch((reason:any)=>{
            throw new Error(reason);
        });
    }

    public addCardMessage(message : string) : void{
        this.boardHub.invoke("AddCardMessage", message).catch((reason:any)=>{
            throw new Error(reason);
        });
    }

    public updateCardGoodVote(cardId: number) : void{
        this.boardHub.invoke("UpdateCardGoodVote", cardId).catch((reason:any)=>{
            throw new Error(reason);
        });
    }
    
    public updateCardBadVote(cardId: number, type: BadVoteType) : void{
        this.boardHub.invoke("UpdateCardBadVote", cardId, type).catch((reason:any)=>{
            throw new Error(reason);
        });
    }    
    public updateCardMessage(id : number, message : string) : void{
        this.boardHub.invoke("UpdateCardMessage", id, message).catch((reason:any)=>{
            throw new Error(reason);
        });
    }

    public changeBoardStatus = () : void => {
        if (this.board()== null)
            throw new Error("board is not opened.");
        if (this.board().manager.id != this.user().id)
            throw new Error("only board manager can change board status");
        this.boardHub.invoke("ChangeBoardStatus").catch((reason:any)=>{
            throw new Error(reason);
        });
    }

    public getWhatDoesntUserVoteStatus(userId : number) : WhatDoesntUserVoteStatus{
        return this.board().whatDoesntUserVoteStatues.find((vote: WhatDoesntUserVoteStatus)=> vote.id == userId);
    }

    public getWhatWorksUserVoteStatus(userId : number) : WhatWorksUserVoteStatus{
        return this.board().whatWorksUserVoteStatues.find((vote: WhatWorksUserVoteStatus)=> vote.id == userId);
    }

    private connectedUserUpdate = (users : Array<User>) : void => {
        if(users!= null)
            this.connectedUsers(users);
    }

    private boardUpdate = (board : Board) : void => {
        if(board!= null)
            this.board(board);
            //this.board(komap.fromJS(board, {}, this.board()));
        var x = this.board();
    }

    private messageSent = (msg : string) : void => {
        if (this.serviceMessages.length==this.maxServiceMessagesAllowed){
            this.serviceMessages.shift();
        }
        this.serviceMessages.push(new BoardServiceMessage(msg));
        if (this.serviceMessagesIntervalId == null){
            this.serviceMessagesIntervalId = setInterval(this.serviceMessagesHandler, 60000);
        }
    }

    private serviceMessagesHandler = () =>{
        const now = new Date().getTime();
        this.serviceMessages.remove((msg) => (now - msg.time.getTime())/1000 >= 60);
        if (this.serviceMessages.length == 0){
            clearInterval(this.serviceMessagesIntervalId);
            this.serviceMessagesIntervalId = null;
        }
    }

    private publishCards = () => {
        this.doPublishCards.notifySubscribers();
    }    
}