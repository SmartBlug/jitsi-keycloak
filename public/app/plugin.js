    console.log("hook plugin.head.html");
    var kc;
  
    var script = document.createElement('script');
    script.src = "/keycloak/keycloak";
    script.onload = function () {
      fetch("/keycloak/keycloak.json")
        .then(res => res.json())
        .then(function(front){
  
      /*const front = {
        realm: "global",
        url: "https://iam.bouffel.com/auth/",
        clientId: "dev_frontend",
      };*/
      kc = Keycloak(front);
      //window.onload = function() {
      console.log("### Script loaded");
      kc.init()
        .then(function(authenticated) {
          console.log('keycloak initialised');
          /*console.log(kc);
          if (kc.token) {
            console.log(kc.tokenParsed);
            console.log("### Fetch JITSI TOKEN")
            const room = document.location.pathname.split('/')[1];
            fetch("/keycloak/token/",
                {
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json',
                      authorization: 'Bearer ' + kc.token
                    },
                    method: "POST",
                    //mode: 'no-cors',
                    body: JSON.stringify({name: kc.tokenParsed.name, email: kc.tokenParsed.email, room:room})
                })
                .then(res => res.json())
                .then(function(res){ 
                  document.location.href=res.url;
                  //console.log("### Result of Jitsi Token",res);
                });
          }
          else {
            console.log("No Token");
          }*/
        });
      });
    };
    document.head.appendChild(script);
    //*  console.log("### Script loaded",typeof Keycloak);
      //window.onload = function() {
      //  console.log("### Page loaded");
        //kc = Keycloak(front);
        
     // };
  /*
      setTimeout(function(){
      //do what you need here
        console.log("### timer done",typeof Keycloak);
        var kc = Keycloak(front);
        kc.init()
          .then(function(authenticated) {
            console.log('keycloak initialised');
          });
      }, 10000);
    //};
    //script.src = "https://share.bouffel.com/keycloak";
  */
    //document.head.appendChild(script); //or something of the likes
  
    /*window.onload = function() {
      console.log("### Page loaded");
      kc = Keycloak();
      kc.init()
        .success(function(authenticated) {
          console.log('keycloak initialised');
        });
    };*/
  
  
    var observer = new MutationObserver(function (mutations, me) {
    if(!window.APP.conference.isJoined()){
      
      console.log("observer");
      var canvas = $('input[name ="username"]').length;
      if (canvas) {
        me.disconnect();
        // Change UX
        //const dialog = $('.jqi.dialog form');
        const dialog = $('input[name ="username"]').parent();
        dialog[1].innerHTML="Checking SSO Login...";
        //console.log("### DIALOG",dialog[1].innerHTML="Checking SSO Login...");
        //console.log(dialog.find('.jqimessage.aui-dialog2-content'));
        //$(dialog.firstChild).html("<div>SSO enabled</div>");
        // First get Token
        console.log("### Check if Token");
        const room = document.location.pathname.split('/')[1];
        APP.conference.changeLocalDisplayName("MyNewName");
        if (!kc.token) kc.login({redirectUri: "https://meet.ztag.me/keycloak/retour/"+room});
        //$('input[name ="username"]').attr('placeholder', 'login');
        console.log('###',$('.jqi.dialog')[1]);
        return;
      }
    }
    else {
      console.log("you joined the conference");
      const name = localStorage.getItem("keycloak_name");
      if (name) {
        APP.conference.changeLocalDisplayName(name);
      }
      //
      me.disconnect(); // we joined a conference, stop observing
    }
  });
  
  $(document).ready(function() {
    // start observing
    observer.observe(document, {
      childList: true,
      subtree: true
    });
  });