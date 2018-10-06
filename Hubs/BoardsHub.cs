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
        public Task SendCardMessage(string message){            
            return this._boardsManager.SendCardMessageAsync(Context.ConnectionId, message);
        }
        public Task ChangeBoardStatus(BoardStatus boardStatus){            
            return this._boardsManager.ChangeBoardStatusAsync(Context.ConnectionId, boardStatus);
        }

        public Team GetTeam(int? id)
        {
            if (!id.HasValue)
                return null;
            using(var dbContext = new LiteDbContext()){
                return dbContext.Teams.Include(t => t.BoardConfiguration).FindById(id.Value);
            }
        }
    }
}