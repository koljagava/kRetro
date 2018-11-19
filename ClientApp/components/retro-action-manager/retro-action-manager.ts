import * as ko from 'knockout';
import { UserService } from '../../services/user.service';
import * as Boostrap from 'bootstrap';
import { CardGood } from '../../models/persistency/cardGood';
import * as feather from 'feather-icons';
import { CardBase } from '../../models/persistency/cardBase';

interface IRetroActionManagerParams {
    card : CardBase
}

export class RetroActionManagerViewModel {
    public userService = UserService;
    private _bootstrap = Boostrap;
    public feather =  feather;
    public card : CardBase;

    constructor(params:IRetroActionManagerParams) {

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