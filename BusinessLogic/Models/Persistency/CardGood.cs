using System.Collections.Generic;

namespace kRetro.BusinessLogic.Models.Persistency
{
    public class CardGood : CardBase
    {
        public CardGood() : base(CardType.Good)
        {
        }

        public List<User> Votes {get;set;} = new List<User>();
    }
}