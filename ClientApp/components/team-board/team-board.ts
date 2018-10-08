import * as ko from 'knockout';
import { UserService } from '../../services/user.service';
import { BoardService } from '../../services/board.service';
import { User } from '../../models/persistency/user';
import { Team } from '../../models/persistency/team';
import { Board, BoardStatus } from '../../models/persistency/board';
import { BoardConfig, } from '../../models/persistency/boardConfig';
import { BadVoteType } from '../../models/persistency/cardBad';
import { CardBase } from '../../models/persistency/cardBase';

export class TeamBoardViewModel {
    public boardName : KnockoutObservable<string> = ko.observable<string>('');
    public userService = UserService;
    public boardStatus = BoardStatus;
    public othersCards : KnockoutObservableArray<CardBase> = ko.observableArray([]);
    private isPublishCardsSubscribed = false;

    constructor() {
        this.userService.boardService.subscribe((boardService : BoardService) =>{
            if (boardService == null){
                this.isPublishCardsSubscribed = false;
            }else if (this.isPublishCardsSubscribed == false){
                this.isPublishCardsSubscribed = true;
                boardService.doPublishCards.subscribe(()=>{
                    this.othersCards(this.getOthersCards());
                });
            }
        })
    };  

    public personalCards = ko.computed(() : Array<CardBase> =>{
        if (this.userService.boardService()!=null && this.userService.boardService().board() != null){
            if (this.userService.boardService().board().status == this.boardStatus.WhatWorksOpened)
                return this.userService.boardService().board().whatWorks.filter((card)=> card.user.id == this.userService.currentUser().id && card.visible == true);
            else if (this.userService.boardService().board().status == this.boardStatus.WhatDesntOpened)
                return this.userService.boardService().board().whatDont.filter((card)=> card.user.id == this.userService.currentUser().id && card.visible == true);
            else return [];
        }else{
            return [];
        }
        });

    public othersCards1 = ko.computed(() : Array<CardBase> =>{
        if (this.userService.boardService()!=null && this.userService.boardService().board() != null){
            return this.othersCards().filter((card, index) => (index % 5) == 0);
        }else{
            return [];
        }
        });

    public othersCards2 = ko.computed(() : Array<CardBase> =>{
        if (this.userService.boardService()!=null && this.userService.boardService().board() != null){
            return this.othersCards().filter((card, index) => (index % 5) == 1);
        }else{
            return [];
        }
        });

    public othersCards3 = ko.computed(() : Array<CardBase> =>{
        if (this.userService.boardService()!=null && this.userService.boardService().board() != null){
            return this.othersCards().filter((card, index) => (index % 5) == 2);
        }else{
            return [];
        }
        });

    public othersCards4 = ko.computed(() : Array<CardBase> =>{
        if (this.userService.boardService()!=null && this.userService.boardService().board() != null){
            return this.othersCards().filter((card, index) => (index % 5) == 3);
        }else{
            return [];
        }
        });

    public othersCards5 = ko.computed(() : Array<CardBase> =>{
        if (this.userService.boardService()!=null && this.userService.boardService().board() != null){
            return this.othersCards().filter((card, index) => (index % 5) == 4);
        }else{
            return [];
        }
        });
                            
    public getOthersCards () : Array<CardBase> {
        if (this.userService.boardService()!=null && this.userService.boardService().board() != null){
            if (this.userService.boardService().board().status == this.boardStatus.WhatWorksOpened)
                return this.userService.boardService().board().whatWorks.filter((card)=> card.user.id != this.userService.currentUser().id && card.visible == true);
            else if (this.userService.boardService().board().status == this.boardStatus.WhatDesntOpened)
                return this.userService.boardService().board().whatDont.filter((card)=> card.user.id != this.userService.currentUser().id && card.visible == true);
            else return [];
        }else{
            return [];
        }
    };

    public createBoard() : void {
        this.userService.boardService().startNewBoard(this.boardName());
    };

    public btnStatusDescr = () : string => {
        if (this.userService.boardService()!=null && this.userService.boardService().board() != null){
            switch (this.userService.boardService().board().status){
                case this.boardStatus.New:
                case this.boardStatus.WhatWorksOpened:
                return "Start What works";
                case this.boardStatus.WhatWorksClosed:
                case this.boardStatus.WhatDesntOpened:
                return "Start What does not work";
                case this.boardStatus.WhatDesntClosed:
                case this.boardStatus.ActionsOpened:
                return "Start Actions";
            }
        }
        return "";
    };

    public btnStatusDisabled = () : boolean =>{
        switch (this.userService.boardService().board().status){
            case this.boardStatus.New:
            case this.boardStatus.WhatWorksClosed:
            case this.boardStatus.WhatDesntClosed:
            return false;
        }
        return true;
    };

    public btnStatusChng = () =>{
        this.userService.boardService().changeBoardStatus();
    }

    public checkEnter = (tvm : TeamBoardViewModel, kEvt : KeyboardEvent) : boolean => {
        if (kEvt.keyCode == 13){
            kEvt.preventDefault();
            this.userService.boardService().sendCardMessage((<HTMLInputElement>kEvt.currentTarget ).value);
            (<HTMLInputElement>kEvt.currentTarget ).value = "";
            return false;
        }
        return true;
    }
};

export default { viewModel: TeamBoardViewModel, template: require('./team-board.html') };
