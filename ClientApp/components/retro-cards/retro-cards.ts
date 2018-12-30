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
    private _cardNeededforHtml = Card;

    constructor() {
    };

    public personalCards = ko.computed(() : Array<CardBase> =>{
        if (this.userService.boardService()!=null && this.userService.boardService().board() != null){
            if (this.userService.boardService().board().status == this.boardStatus.WhatWorksOpened ||
                this.userService.boardService().board().status == this.boardStatus.WhatWorksClosed)
                return this.userService.boardService().board().whatWorks.filter((card)=> card.user.id == this.userService.currentUser().id);
            else if (this.userService.boardService().board().status == this.boardStatus.WhatDoesntOpened ||
            this.userService.boardService().board().status == this.boardStatus.WhatDoesntClosed)
                return this.userService.boardService().board().whatDoesnt.filter((card)=> card.user.id == this.userService.currentUser().id);
            else return [];
        }else{
            return [];
        }
    });

    public othersCards = ko.computed(() : Array<CardBase> => {
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
    });
    
    public othersCards1 = ko.computed(() : Array<CardBase> =>{
        return this.othersCards().filter((card, index) => (index % 5) == 0);
    });

    public othersCards2 = ko.computed(() : Array<CardBase> =>{
        return this.othersCards().filter((card, index) => (index % 5) == 1);
    });

    public othersCards3 = ko.computed(() : Array<CardBase> =>{
        return this.othersCards().filter((card, index) => (index % 5) == 2);
    });

    public othersCards4 = ko.computed(() : Array<CardBase> =>{
        return this.othersCards().filter((card, index) => (index % 5) == 3);
    });

    public othersCards5 = ko.computed(() : Array<CardBase> =>{
        return this.othersCards().filter((card, index) => (index % 5) == 4);
    });

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