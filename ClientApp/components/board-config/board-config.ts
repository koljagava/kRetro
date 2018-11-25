import * as ko from 'knockout';
import { UserService } from "../../services/user.service";

export class BoardConfigViewModel {
    public userService = UserService;

    public saveBoardConfig = () =>{
        this.userService.boardService().updateBoardConfig(this.userService.currentTeam().boardConfiguration);
    };
}

const boardConfigComponent = { viewModel: BoardConfigViewModel, template: require('./board-config.html') };
ko.components.register("retro-board-config", boardConfigComponent);
export default boardConfigComponent;