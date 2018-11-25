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
    public boardService = ko.observable<BoardService>(null);
    private history : History = null;
    testResult: Response;

    private constructor(){
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
        this.testResult = await fetch('api/User/GetBoardsHistory', {
            method: "POST",
            body: JSON.stringify({ teamId: this.currentTeam().id }),
            headers: {
                "Content-Type": "application/json"
            }
        });
        return this.testResult.json() as Promise<Array<Board>>;
    }

    public getUserTeam = async () : Promise<Team> =>{
        if (this.currentUser()==null){
            return new Promise<Team>((resolve, reject) => {
                reject(new Error("currentUser is not defined."));
            });
        }
        if (this.currentTeam() != null){
            return new Promise<Team>((resolve, reject) => {
                    resolve(this.currentTeam());
            });
        }
        const result = await fetch('api/User/GetUserTeams', {
            method: "POST",
            body: JSON.stringify({ userId: this.currentUser().id }),
            headers: {
                "Content-Type": "application/json"
            }
        });
        let teams = (result.json() as Promise<Array<Team>>);
        const teams_1 = await teams;
        this.currentTeam(teams_1[0]);
        return new Promise<Team>((resolve, reject) => {
            if (teams_1.length == 0)
                reject(new Error("user has no team associated"));
            else
                resolve(teams_1[0]);
        });
    };

    public getTeams =async () : Promise<Array<Team>> =>{
        const result = await fetch('api/User/GetUserTeams', {
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
            }}).then(result => {
                let user = result.json() as Promise<User>;
                user.then((user:User)=> {this.currentUser(user);});
                return user;
            });
    };

    public login = (username: string|null, password: string|null): Promise<User> =>{
        return fetch ('api/User/Authenticate', {
            method: "POST",
            body: JSON.stringify({ Username: username, Password: password }),
            headers: {
              "Content-Type": "application/json"
            }}).then(this.setUser);
    };

    private setUser = (userResponse: Response) => {
        let user:Promise<User> = userResponse.json();
        user.then((user) => {
            this.currentUser(user);
            if (user.id != null)
                localStorage.setItem('currentUser', user.id.toString());
                this.getUserTeam().then((team:Team)=>{
                    this.boardService(new BoardService(this.currentUser, this.currentTeam));
                    this.boardService().connectToBoard();
                });
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
            this.history.push('/login');
    };

    public canActivate = (history: History, callingRoute : Route) : boolean => {
        this.history = history;
        if (this.currentUser()!= null) {
            return true;
        }
        // not logged in so redirect to login page with the return url
        history.push('/login/' + callingRoute.url as History.Path);
        return false;
    };

    public static get Instance(){
        return UserServiceSingleton._instance || (UserServiceSingleton._instance = new UserServiceSingleton())
    }    
}
export const UserService = UserServiceSingleton.Instance;