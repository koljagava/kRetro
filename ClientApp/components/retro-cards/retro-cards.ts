import * as ko from 'knockout';
import { CardBase } from '../../models/persistency/cardBase';
import { UserService } from '../../services/user.service';
import { BoardService } from '../../services/board.service';
import * as Card from '../../components/retro-card/retro-card';
import { Board, BoardStatus } from '../../models/persistency/board';
import { TeamBoardViewModel } from '../../pages/team-board/team-board';

export class RetroCardsViewModel {
    public userService = UserService;
    public boardStatus = BoardStatus;
    private isPublishCardsSubscribed = false;
    public othersCards : KnockoutObservableArray<CardBase> = ko.observableArray([]);
    private _cards = Card;

    constructor() {
        this.userService.boardService.subscribe((boardService : BoardService) =>{
            if (boardService == null){
                this.isPublishCardsSubscribed = false;
            }else if (this.isPublishCardsSubscribed == false){
                this.isPublishCardsSubscribed = true;
                this.userService.boardService().board.subscribe((board : Board) => {
                    if (board == null){
                        return;
                    }
                    if (board.status === this.boardStatus.WhatDoesntClosed || 
                        board.status === this.boardStatus.WhatWorksClosed){
                        this.othersCards(this.getOthersCards());    
                    }
                });
                boardService.doPublishCards.subscribe(()=>{
                    this.othersCards(this.getOthersCards());
                });
            }
        })
    };

    public personalCards = ko.computed(() : Array<CardBase> =>{
        if (this.userService.boardService()!=null && this.userService.boardService().board() != null){
            if (this.userService.boardService().board().status == this.boardStatus.WhatWorksOpened ||
                this.userService.boardService().board().status == this.boardStatus.WhatWorksClosed)
                return this.userService.boardService().board().whatWorks.filter((card)=> card.user.id == this.userService.currentUser().id && card.visible == true);
            else if (this.userService.boardService().board().status == this.boardStatus.WhatDoesntOpened ||
            this.userService.boardService().board().status == this.boardStatus.WhatDoesntClosed)
                return this.userService.boardService().board().whatDoesnt.filter((card)=> card.user.id == this.userService.currentUser().id && card.visible == true);
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
            if (this.userService.boardService().board().status == this.boardStatus.WhatWorksOpened ||
                this.userService.boardService().board().status == this.boardStatus.WhatWorksClosed)
                return this.userService.boardService().board().whatWorks.filter((card)=> card.user.id != this.userService.currentUser().id && card.visible == true);
            else if (this.userService.boardService().board().status == this.boardStatus.WhatDoesntOpened ||
            this.userService.boardService().board().status == this.boardStatus.WhatDoesntClosed)
                return this.userService.boardService().board().whatDoesnt.filter((card)=> card.user.id != this.userService.currentUser().id && card.visible == true);
            else return [];
        }else{
            return [];
        }
    };

    public checkEnter = (tvm : TeamBoardViewModel, kEvt : KeyboardEvent) : boolean => {
        if (kEvt.keyCode == 13){
            kEvt.preventDefault();
            this.userService.boardService().addCardMessage((<HTMLInputElement>kEvt.currentTarget ).value);
            (<HTMLInputElement>kEvt.currentTarget ).value = "";
            return false;
        }
        return true;
    }
}

const cardsComponent = { viewModel: RetroCardsViewModel, template: require('./retro-cards.html') };
ko.components.register("retro-cards", cardsComponent);
export default cardsComponent;