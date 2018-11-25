import * as ko from 'knockout';
import { UserService } from '../../services/user.service';
import * as Actions from '../../components/retro-actions/retro-actions';
import { Board } from '../../models/persistency/board';

export class TeamBoardViewModel {    
    public boardName : KnockoutObservable<string> = ko.observable<string>('');
    public userService = UserService;
    private _actions = Actions;
    public boards: KnockoutObservableArray<Board>;
    public selectedBoard = ko.observable<Board>(null);

    constructor() {
        this.boards = ko.observableArray<Board>([]);
        this.userService.currentTeam.subscribe((value) =>{
            if (value != null){
                this.userService.getBoardsHistory()
                .then((boards:Array<Board>) =>{
                        this.boards(boards);
                }, (error : any) =>{
                    throw new Error("Error retreiving Historycal Boards ["+ error + "]");
                });
            }
        });
    };

    public selectBoard = (board : Board) =>{
        this.selectedBoard(board);
    }
};

export default { viewModel: TeamBoardViewModel, template: require('./team-boards-history.html') };
