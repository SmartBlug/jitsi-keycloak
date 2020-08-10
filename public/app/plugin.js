    // add Style
    $('<link/>', {rel: 'stylesheet', href: '/keycloak/assets/styles.css'}).appendTo('head');

    // Remove tokens from recent-list
    const recentList = JSON.parse(localStorage.getItem("features/recent-list"));
    for (const i in recentList) {
      recentList[i].conference = recentList[i].conference.split('?')[0];
    }
    localStorage.setItem("features/recent-list",JSON.stringify(recentList));
  
    // Load keycloak js and init
    let kc;
    var script = document.createElement('script');
    script.src = "/keycloak/keycloak";
    script.onload = function () {

      kc = new Keycloak('/keycloak/keycloak.json');
      kc.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/keycloak/app/silent-check-sso.html'
      })
      .then(function(authenticated) {
        console.log('keycloak initialised -',authenticated ? 'authenticated' : 'not authenticated');
        if (authenticated) {
          // Keep token updated
          setInterval(function(){
            kc.updateToken(10);              
          }, 10*1000);
          // add Sign-Out button
          $('.welcome-page-settings').prepend('<div class="keycloak"><div class="name">'+kc.tokenParsed.name+'</div></div>');
          $('.welcome-page-settings .keycloak').append('<svg class="sign-out" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="sign-out-alt" class="svg-inline--fa fa-sign-out-alt fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>Sign Out</title><path fill="white" d="M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96c-53 0-96 43-96 96v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12z"></path></svg>');
          $('.keycloak .sign-out').click(function(){ 
            console.log('keycloak sign-out');
            $('.keycloak .name').text('');
            localStorage.removeItem('keycloak_name');
            kc.logout();
          });
          
          localStorage.setItem("keycloak_name", kc.tokenParsed.name);

          // if access to /, remove jwt
          if ((document.location.search)&&(document.location.pathname=='/')) {
            document.location.href=document.location.origin+document.location.pathname+document.location.hash
          }

          if ((!document.location.search)&&(document.location.pathname!='/')) {
            const room = document.location.pathname.split('/')[1];
            fetch("/keycloak/token",
            {
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  authorization: 'Bearer ' + kc.token
              },
              method: "POST",
              body: JSON.stringify({name: kc.tokenParsed.name, email: kc.tokenParsed.email, room:room})
            })
            .then(res => res.json())
            .then(function(res){ 
              // go to room with token
              document.location.href=document.location.origin+document.location.pathname+document.location.hash+'?jwt='+res.token;
            });         
          }
        }
        else {
          // add Sign-In Button
          $('.welcome-page-settings').prepend('<div class="keycloak"></div>');
          $('.welcome-page-settings .keycloak').append('<svg class="sign-in" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="sign-in-alt" class="svg-inline--fa fa-sign-in-alt fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>Sign In</title><path fill="currentColor" d="M416 448h-84c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h84c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32h-84c-6.6 0-12-5.4-12-12V76c0-6.6 5.4-12 12-12h84c53 0 96 43 96 96v192c0 53-43 96-96 96zm-47-201L201 79c-15-15-41-4.5-41 17v96H24c-13.3 0-24 10.7-24 24v96c0 13.3 10.7 24 24 24h136v96c0 21.5 26 32 41 17l168-168c9.3-9.4 9.3-24.6 0-34z"></path></svg>')
          $('.keycloak .sign-in').click(function(){ 
            console.log('keycloak sign-in');
            kc.login();
          });

        }
      }).catch(function() {
        alert('failed to initialize');
      });

    };
    document.head.appendChild(script);
  
    var observer = new MutationObserver(function (mutations, me) {
    if(!window.APP.conference.isJoined()){
      
      console.log("observer");
      var canvas = $('input[name ="username"]').length;
      if (canvas) {
        me.disconnect();
        // Change UX
        const dialog = $('input[name ="username"]').parent();
        dialog[1].innerHTML="Checking SSO Login...";

        //const room = document.location.pathname.split('/')[1];
        if (!kc.token) kc.login();
        return;
      }
    }
    else {
      console.log("you joined the conference");
      const name = localStorage.getItem("keycloak_name");
      if (name) {
        APP.conference.changeLocalDisplayName(name);
      }
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