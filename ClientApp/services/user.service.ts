import {Route} from '../router';
import {Team} from '../models/persistency/team';
import {User} from '../models/persistency/user';
import {BoardService} from './board.service';
import { History } from 'history';
import * as ko from 'knockout';
import 'isomorphic-fetch';

class UserServiceSingleton {
    private static _instance : UserServiceSingleton = null;
    //TODO: pensare se definire il papping degli oggetti completo (knockout-mapping) - verifica le necessità della register
    public currentUser = ko.observable<User>(null);
    public currentTeam = ko.observable<Team>(null);
    public boardService = ko.observable<BoardService>(null);
    private history : History = null;

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
    
    public getUserName = (user : User) : string => {        
        let name = ((user.firstName||'') + ' ' + (user.lastName||'')).trim();
        if (name == '')
            return user.username;
        return name;
    };

    public getUserTeam = () : Promise<Team> =>{
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
        return fetch ('api/User/GetUserTeams', {
            method: "POST",
            body: JSON.stringify({userId:this.currentUser().id}),
            headers: {
              "Content-Type": "application/json"
            }}).then(result => {
                let teams = result.json() as Promise<Array<Team>>;
                return teams.then((teams:Array<Team>)=> {
                    this.currentTeam(teams[0]);
                    return new Promise<Team>((resolve, reject) => {
                        if (teams.length == 0)
                            reject(new Error("user has no team associated"))
                        else
                            resolve(teams[0]);
                    });
                });         
         });
    };

    public getTeams =() : Promise<Array<Team>> =>{
        return fetch ('api/User/GetUserTeams', {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            }}).then(result => {
                return result.json() as Promise<Array<Team>>;
         });
    };

    public create = (user: User) : Promise<User> =>{
        return fetch ('api/User/Create', {
            method: "POST",
            body: JSON.stringify(user),
            headers: {
              "Content-Type": "application/json"
            }}).then(result => {
                return result.json();
            });        
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