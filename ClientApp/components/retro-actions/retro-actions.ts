import * as ko from 'knockout';
import { UserService } from '../../services/user.service';
import { BoardStatus } from '../../models/persistency/board';
import * as Boostrap from 'bootstrap';
import { CardGood } from '../../models/persistency/cardGood';
import { CardBad, BadVoteType } from '../../models/persistency/cardBad';
import * as feather from 'feather-icons';

export class RetroActionsViewModel {
    public userService = UserService;
    public boardStatus = BoardStatus;
    public badVoteType = BadVoteType;
    private _bootstrap = Boostrap;
    public feather =  feather;

    constructor() {
    }

    public cardsGood = ko.computed(():Array<CardGood> =>{
            if (this.userService.boardService()!=null && 
                this.userService.boardService().board()!=null){
                return this.userService.boardService().board().whatWorks.filter((card)=> card.votes.length!=0).sort((prev,  curr) => {
                    if (prev.votes.length < curr.votes.length)
                        return 1;
                    if (prev.votes.length > curr.votes.length)
                        return -1;
                    return 0;
                });
            }
            return [];
    });

    public cardsBad = ko.computed(():Array<CardBad> =>{
        if (this.userService.boardService()!=null && 
            this.userService.boardService().board()!=null){
            return this.userService.boardService().board().whatDoesnt.filter((card)=> card.votes.length!=0).sort((prev,  curr) => {
                if (prev.votes.length < curr.votes.length)
                    return 1;
                if (prev.votes.length > curr.votes.length)
                    return -1;
                return 0;
            });
        }
        return [];
    });
}

const actionsComponent = { viewModel: RetroActionsViewModel, template: require('./retro-actions.html') };
ko.components.register("retro-actions", actionsComponent);
export default actionsComponent;