using System.Collections.Generic;

namespace kRetro.BusinessLogic.Models.Persistency
{
    public class BoardConfig
    {
        public int Id {get;set;}
        public int WhatWorksMinutes {get;set;}
        public int WhatWorksVotesPerUser {get;set;}
        public int WhatDoesntMinutes {get;set;}
        public int WhatDoesntVotesPerUser {get;set;}
        public bool ShowCardUser {get;set;}

        public BoardConfig Clone(){
            return this.MemberwiseClone() as BoardConfig;
        }
    }
}