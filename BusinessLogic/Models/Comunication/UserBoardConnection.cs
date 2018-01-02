namespace kRetro.BusinessLogic.Models.Comunication
{
    public class UserBoardConnection
    {
        public string ConnectionId {get;private set;}
        public int UserId {get;private set;}
        public int TeamId {get;private set;}

        public UserBoardConnection(string connectionId, int userId, int teamId){
            ConnectionId = connectionId;
            UserId = userId;
            TeamId = teamId;
        }
    }
}