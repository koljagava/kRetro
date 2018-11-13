using System.Collections.Generic;

namespace kRetro.BusinessLogic.Models.Persistency
{
    public enum BadVoteType
    {
        Easy = 0,
        Significant = 1,
        Unexpected = 2
    }

    public class BadVote
    {
        public BadVoteType Type {get;set;}
        public User User {get;set;}
    }

    public class CardBad : CardBase
    {
        public CardBad() : base(CardType.Bad)
        {
        }

        public List<BadVote> Votes {get;set;} = new List<BadVote>();
    }
}