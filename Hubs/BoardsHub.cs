using System;
using System.Threading.Tasks;
using kRetro.BusinessLogic;
using kRetro.BusinessLogic.Context;
using kRetro.BusinessLogic.Models.Comunication;
using kRetro.BusinessLogic.Models.Persistency;
using Microsoft.AspNetCore.SignalR;

namespace kRetro.Hubs
{
    public class BoardsHub : Hub
    {
        private BoardsManager _boardsManager;

        public BoardsHub(BoardsManager boardsManager)
        {
            _boardsManager = boardsManager;
        }

        public override Task OnConnectedAsync()
        {
            // Add your own code here.
            // For example: in a chat application, record the association between
            // the current connection ID and user name, and mark the user as online.
            // After the code in this method completes, the client is informed that
            // the connection is established; for example, in a JavaScript client,
            // the start().done callback is executed.

            var userId = this.Context.GetHttpContext().Request.Query["userId"];
            var teamId = this.Context.GetHttpContext().Request.Query["teamId"];

            if(string.IsNullOrEmpty(userId))
                throw new ArgumentException("value expected", nameof(userId));
            if(string.IsNullOrEmpty(teamId))
                throw new ArgumentException("value expected", nameof(teamId));

            _boardsManager.AddUserAsync(
                        new UserBoardConnection(Context.ConnectionId, Convert.ToInt32(userId), Convert.ToInt32(teamId))
                        ).Wait();
            return base.OnConnectedAsync();
        }
        
        public override Task OnDisconnectedAsync(Exception exception)
        {
            // Add your own code here.
            // For example: in a chat application, you might have marked the
            // user as offline after a period of inactivity; in that case 
            // mark the user as online again.
            _boardsManager.RemoveUser(Context.ConnectionId);
            return base.OnDisconnectedAsync(exception);
        }

        public Task StarNewBoard(string boardName){            
            return this._boardsManager.StarNewBoardAsync(Context.ConnectionId, boardName);
        }
        
        public Task AddCardMessage(string message){            
            return this._boardsManager.AddCardMessageAsync(Context.ConnectionId, message);
        }
        public Task UpdateCardMessage(int id, string message){
            return this._boardsManager.UpdateCardMessageAsync(Context.ConnectionId, id, message);
        }

        public Task ChangeBoardStatus(){            
            return this._boardsManager.ChangeBoardStatusAsync(Context.ConnectionId, false);
        }

        public Task UpdateCardGoodVote(int cardId){            
            return this._boardsManager.UpdateCardGoodVoteAsync(Context.ConnectionId, cardId);
        }

        public Task UpdateCardBadVote(int cardId, BadVoteType type){            
            return this._boardsManager.UpdateCardBadVoteAsync(Context.ConnectionId, cardId, type);
        }

        public Team GetTeam(int? id)
        {
            if (!id.HasValue)
                return null;
            using(var dbContext = new LiteDbContext()){
                return dbContext.Teams.Include(t => t.BoardConfiguration).FindById(id.Value);
            }
        }

        public Task UpdateBoardConfig(BoardConfig boardConfig){
            using(var dbContext = new LiteDbContext()){
                dbContext.BoardConfigs.Update(boardConfig);
            }
            return this._boardsManager.UpdateBoardConfigAsync(Context.ConnectionId, boardConfig);
        }

        public Task UpdateAction(RetroAction action){
            return this._boardsManager.UpdateActionAsync(Context.ConnectionId, action);
        }

    }
}