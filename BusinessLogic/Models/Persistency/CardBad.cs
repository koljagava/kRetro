using System.Collections.Generic;

namespace kRetro.BusinessLogic.Models.Persistency
{
    public enum BadVoteType
    {
        Facile,
        Sentito,
        Inaspettato
    }

    public class BadVote
    {
        public BadVoteType Type {get;set;}
        public User User {get;set;}
    }

    public class CardBad : CardBase
    {
        public List<BadVote> Votes {get;set;}
    }
}