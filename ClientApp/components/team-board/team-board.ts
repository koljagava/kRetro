import * as ko from 'knockout';
import { UserService } from '../../services/user.service';
import { BoardService } from '../../services/board.service';
import { User } from '../../models/persistency/user';
import { Team } from '../../models/persistency/team';
import { Board, BoardStatus } from '../../models/persistency/board';
import { BoardConfig, } from '../../models/persistency/boardConfig';
import { BadVoteType } from '../../models/persistency/cardBad';

export class TeamBoardViewModel {
    public boardName : KnockoutObservable<string> = ko.observable<string>('');
    public userService = UserService;
    public boardStatus = BoardStatus;

    constructor() {
    };

    public createBoard() : void {
        this.userService.boardService().startNewBoard(this.boardName());
    }

    public getUserName = (user : User) : string => {        
        let name = ((user.firstName||'') + ' ' + (user.lastName||'')).trim();
        if (name == '')
            return user.username;
        return name;
    }
    public test = ()=>{
        let bb = this.userService.currentTeam().boardConfiguration;
    }
};

export default { viewModel: TeamBoardViewModel, template: require('./team-board.html') };
