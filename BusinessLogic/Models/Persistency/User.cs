using System;
using System.Collections.Generic;

namespace kRetro.BusinessLogic.Models.Persistency 
{
    public class User : IEquatable<User>
    {
        public int Id {get;set;}
        public string Username {get;set;}
        public string Password {get;set;}
        public string FirstName {get;set;}
        public string LastName {get;set;}
        public Team Team {get;set;}

        public bool Equals(User other)
        {
            //Check whether the compared object is null. 
            if (Object.ReferenceEquals(other, null)) return false;

            //Check whether the compared object references the same data. 
            if (Object.ReferenceEquals(this, other)) return true;

            //Check whether the products' properties are equal. 
            return Id.Equals(other.Id);
        }

        public override int GetHashCode()
        {
            //Calculate the hash code for the user. 
            return Id.GetHashCode();
        }        
    }
}