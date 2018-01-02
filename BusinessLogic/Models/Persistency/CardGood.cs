using System.Collections.Generic;

namespace kRetro.BusinessLogic.Models.Persistency
{
    public class CardGood : CardBase
    {
        public List<User> Votes {get;set;}
    }
}