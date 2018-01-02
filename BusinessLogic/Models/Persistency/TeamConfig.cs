using System.Collections.Generic;

namespace kRetro.BusinessLogic.Models.Persistency
{
    public class TeamConfig
    {
        public int Id {get;set;}
        public int WhatWorksMinutes {get;set;}
        public int WhatWorksVotesPerUser {get;set;}
        public int WhatDontMinutes {get;set;}
        public Dictionary<BadVoteType, int> WhatDontVotesPerUser {get;set;} = new Dictionary<BadVoteType, int>();

        public TeamConfig Clone(){
            return this.MemberwiseClone() as TeamConfig;
        }
    }
}