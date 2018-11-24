import * as ko from 'knockout';
import { UserService } from '../../services/user.service';
import { BoardStatus } from '../../models/persistency/board';
import {BoardConfigViewModel} from '../../components/board-config/board-config';
import * as Cards from '../../components/retro-cards/retro-cards';
import * as Actions from '../../components/retro-actions/retro-actions';

export class TeamBoardViewModel {    
    public boardName : KnockoutObservable<string> = ko.observable<string>('');
    public userService = UserService;
    public boardStatus = BoardStatus;
    private _boardConfig = BoardConfigViewModel;
    private _cards= Cards;
    private _actions = Actions;

    constructor() {
    };

    public createBoard() : void {
        this.userService.boardService().startNewBoard(this.boardName());
    };

    public btnStatusDescr = ko.computed(() : string => {
        if (this.userService.boardService()!=null && this.userService.boardService().board() != null){
            switch (this.userService.boardService().board().status){
                case this.boardStatus.New:
                case this.boardStatus.WhatWorksOpened:
                return "Start What works";
                case this.boardStatus.WhatWorksClosed:
                case this.boardStatus.WhatDoesntOpened:
                return "Start What does not work";
                case this.boardStatus.WhatDoesntClosed:
                return "Start Actions";
                case this.boardStatus.ActionsOpened:
                return "Close Action";
                case this.boardStatus.ActionsClosed:
                return "Close Board";
            }
        }
        return "";
    });

    public btnStatusDisabled = ko.computed(() : boolean =>{
        if (this.userService.boardService()!=null && this.userService.boardService().board() != null){
            switch (this.userService.boardService().board().status){
                case this.boardStatus.New:
                case this.boardStatus.ActionsOpened:
                case this.boardStatus.ActionsClosed:
                    return false;
                case this.boardStatus.WhatWorksClosed:
                case this.boardStatus.WhatDoesntClosed:
                    if (this.userService.boardService().getMissingVotes()!=0){
                        return true;
                    }
                    return false;
            }
        }
        return true;
    });

    public btnStatusChng = () =>{
        this.userService.boardService().changeBoardStatus();
    }
};

export default { viewModel: TeamBoardViewModel, template: require('./team-board.html') };
