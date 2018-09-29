using System.Collections.Generic;

namespace kRetro.BusinessLogic.Models.Persistency 
{
    public class User {
        public int Id {get;set;}
        public string Username {get;set;}
        public string Password {get;set;}
        public string FirstName {get;set;}
        public string LastName {get;set;}
        public List<Team> Teams {get;set;}
    }
}