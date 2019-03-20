class AmplifyStorage {
    // set item with the key
    setItem(key,value){
		console.log("Setting Amplify Cookie");
		var d = new Date(); //Create an date object
		d.setTime(d.getTime() + (1*1000*60*60*24)); //Set the time to exdays from the current date in milliseconds. 1000 milliseonds = 1 second
		var expires = "expires=" + d.toGMTString(); //Compose the expirartion date
		window.document.cookie = key+"="+value+"; "+expires;
	}
    // get item with the key
    getItem(key){
		console.log("Getting Amplify Cookie");
		var name = key + "="; //Create the cookie name variable with cookie name concatenate with = sign
		var cArr = window.document.cookie.split(';'); //Create cookie array by split the cookie by ';'
     
		//Loop through the cookies and return the cooki value if it find the cookie name
		for(var i=0; i<cArr.length; i++) {
			var cookie = cArr[i].trim();
			//If the name is the cookie string at position 0, we found the cookie and return the cookie value
			if (cookie.indexOf(name) == 0) 
				return cookie.substring(name.length, cookie.length);
		}	
     
		//If we get to this point, that means the cookie wasn't find in the look, we return an empty string.
		return "";
	}
    // remove item with the key
    removeItem(key){
		var d = new Date(); //Create an date object
		d.setTime(d.getTime() - (1000*60*60*24)); //Set the time to the past. 1000 milliseonds = 1 second
		var expires = "expires=" + d.toGMTString(); //Compose the expirartion date
		window.document.cookie = key+"="+"; "+expires;//Set the cookie with name and the expiration date
	}
    // clear out the storage
    clear(){
		var cookieDiv = window.document.getElementById('cookies');
		var cArr = window.document.cookie.split(';'); 
		for(var i=0; i<cArr.length; i++)
		{
			var cookieName = cArr[i].substring(0, cArr[i].indexOf('='));
			this.removeItem(cookieName);
		}
	}
    // If the storage operations are async(i.e AsyncStorage)
    // Then you need to sync those items into the memory in this method
    sync(){
		
	}
}