import {Route} from '../router';
import {Team} from '../models/persistency/team';
import {User} from '../models/persistency/user';
import {BoardService} from './board.service';
import { History } from 'history';
import * as ko from 'knockout';
import 'isomorphic-fetch';
import { Board } from '../models/persistency/board';

class UserServiceSingleton {
    private static _instance : UserServiceSingleton = null;
    public currentUser = ko.observable<User>(null);
    public currentTeam = ko.observable<Team>(null);
    public teams = ko.observableArray<Team>([]);
    public boardService = ko.observable<BoardService>(null);    
    private history : History = null;

    private constructor(){
        this.currentUser.subscribe((user: User) =>{
            if (user == undefined || user == null){
                return;
            }
            if (user.id != null && user.id != 0)
                localStorage.setItem('currentUser', user.id.toString());
                if (this.teams().length!=0 && user.team != null){
                    const team = this.teams().find(t=> t.id == user.team.id);
                    if (team!= null){
                        user.team = team;
                        this.currentTeam(team);
                        this.boardService(new BoardService(this.currentUser, this.currentTeam));
                        this.boardService().connectToBoard();        
                        this.currentUser.notifySubscribers()
                    } 
                }
        });
        this.teams.subscribe(teams => {
            if (this.currentUser()== null || this.currentUser().team == null){
                return;
            }
            const team = teams.find(t=> t.id == this.currentUser().team.id);
            if (team!= null){
                this.currentUser().team = team;
                this.currentTeam(team);
                this.boardService(new BoardService(this.currentUser, this.currentTeam));
                this.boardService().connectToBoard();        
                this.currentUser.notifySubscribers()
            } 
        });

        this.getTeams().then(teams =>{
            this.teams(teams);
        });

        if (localStorage.getItem('currentUser')!= null){
            let tempUser = new User();
            tempUser.id = Number(localStorage.getItem('currentUser'));
            this.currentUser(tempUser);
            this.setCurrenUserById(tempUser.id);
        }
    }

    public setCurrenUserById = (userId: number) : Promise<User> =>{
        return fetch ('api/User/Get', {
            method: "POST",
            body: JSON.stringify({userId:userId}),
            headers: {
              "Content-Type": "application/json"
            }})
            .then(this.setUser);
    };

    public getUserById = (userId: number) : Promise<User> =>{
        return fetch ('api/User/Get', {
            method: "POST",
            body: JSON.stringify({userId:userId}),
            headers: {
              "Content-Type": "application/json"
            }})
            .then(userResponse => {
                const user:Promise<User> = userResponse.json();
                return user;
            });
    };
    
    public getUserName = (user : User) : string => {        
        let name = ((user.firstName||'') + ' ' + (user.lastName||'')).trim();
        if (name == '')
            return user.username;
        return name;
    };

    public getBoardsHistory = async () : Promise<Array<Board>> => {
        if (this.currentTeam() == null){
            return new Promise<Array<Board>>((resolve, reject) => {
                reject(new Error("currentTeam is not defined."));
            });
        }
        return (await fetch('api/User/GetBoardsHistory', {
            method: "POST",
            body: JSON.stringify({ teamId: this.currentTeam().id }),
            headers: {
                "Content-Type": "application/json"
            }
        })).json() as Promise<Array<Board>>;
    }

    public getBoard = async (boardId : number) : Promise<Board> => {
        return (await fetch('api/User/GetBoard', {
            method: "POST",
            body: JSON.stringify({ boardId: boardId }),
            headers: {
                "Content-Type": "application/json"
            }
        })).json() as Promise<Board>;
    }

    public getTeamUsers = async () : Promise<Array<User>> =>{
        if (this.currentTeam()==null){
            return new Promise<Array<User>>((resolve, reject) => {
                reject(new Error("currentTeam is not defined."));
            });
        }
        const teamResponse = await fetch('api/User/GetTeamUsers', {
            method: "POST",
            body: JSON.stringify({ teamId: this.currentTeam().id }),
            headers: {
                "Content-Type": "application/json"
            }
        });
        return teamResponse.json() as Promise<Array<User>>;
    };

    private getTeams =async () : Promise<Array<Team>> =>{
        const result = await fetch('api/User/GetTeams', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });
        return result.json() as Promise<Array<Team>>;
    };

    public create = async (user: User|null) : Promise<User> =>{
        const result = await fetch('api/User/Create', {
            method: "POST",
            body: JSON.stringify(user),
            headers: {
                "Content-Type": "application/json"
            }
        });
        return result.json();        
    };

    public update = (user: User|null) : Promise<User> =>{
        return fetch ('api/User/Update', {
            method: "POST",
            body: JSON.stringify(user),
            headers: {
              "Content-Type": "application/json"
            }}).then(this.setUser);
    };

    public login = (username: string|null, password: string|null): Promise<User> =>{
        return fetch ('api/User/Authenticate', {
            method: "POST",
            body: JSON.stringify({ Username: username, Password: password }),
            headers: {
              "Content-Type": "application/json"
            }}).then(this.setUser);
    };

    private setUser = (userResponse: Response) : Promise<User> => {
        let user:Promise<User> = userResponse.json();
        user.then((user) => {
            this.currentUser(user);
        });
        return user;
    };

    public logout = () => {
         // remove user from local storage to log user out
         localStorage.removeItem('currentUser');
         this.boardService().disconnectFromBoard();
         this.boardService(null);
         this.currentUser(null);
         this.currentTeam(null);
         if (this.history!=null)
            this.history.push('#login');
    };

    public canActivate = (history: History, callingRoute : Route) : boolean => {
        this.history = history;
        if (this.currentUser()!= null) {
            return true;
        }
        // not logged in so redirect to login page with the return url
        history.push('#login/' + callingRoute.url as History.Path);
        return false;
    };

    public static get Instance(){
        return UserServiceSingleton._instance || (UserServiceSingleton._instance = new UserServiceSingleton())
    }    
}
export const UserService = UserServiceSingleton.Instance;