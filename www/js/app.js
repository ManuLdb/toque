// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ngCordova'])


    .service('UserService', function() {
        // For the purpose of this example I will store user data on ionic local storage but you should save it on a database
        var setUser = function (user_data) {
            window.localStorage.starter_facebook_user = JSON.stringify(user_data);
        };

        var getUser = function () {
            return JSON.parse(window.localStorage.starter_facebook_user || '{}');
        };

        return {
            getUser: getUser,
            setUser: setUser
        };
    })
    .run(function($ionicPlatform) {
      $ionicPlatform.ready(function() {
        if(window.cordova && window.cordova.plugins.Keyboard) {
          // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
          // for form inputs)
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);


          cordova.plugins.Keyboard.disableScroll(true);
        }
        if(window.StatusBar) {
          StatusBar.styleDefault();
        }
      });
    })


    .config(function($stateProvider, $urlRouterProvider) {
      $stateProvider
      // setup an abstract state for the tabs directive
          .state('photo',{
              url:'/photo',
              templateUrl:'templates/photo.html',
              controller:'photoCtrl'
          })
        .state('login',{
            url:'/login',
            templateUrl:'templates/login.html',
            controller:'loginCtrl'

        })
        $urlRouterProvider.otherwise('login');
    })

    //Photo
    .controller("photoCtrl", function($scope, $cordovaCamera) {
        $scope.takePicture = function() {
            var options = {
                quality : 75,
                destinationType : Camera.DestinationType.DATA_URL,
                sourceType : Camera.PictureSourceType.CAMERA,
                allowEdit : true,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 300,
                targetHeight: 300,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false
            };

            $cordovaCamera.getPicture(options).then(function(imageData) {
                $scope.imgURI = "data:image/jpeg;base64," + imageData;
            }, function(err) {
                // An error occured. Show a message to the user
            });
        }
    })
    //fb
    .controller('loginCtrl', function($scope, $state, $q, UserService, $ionicLoading) {
        // This is the success callback from the login method
        var fbLoginSuccess = function(response) {
            if (!response.authResponse){
                fbLoginError("Cannot find the authResponse");
                return;
            }

            var authResponse = response.authResponse;

            getFacebookProfileInfo(authResponse)
                .then(function(profileInfo) {
                    // For the purpose of this example I will store user data on local storage
                    UserService.setUser({
                        authResponse: authResponse,
                        userID: profileInfo.id,
                        name: profileInfo.name,
                        email: profileInfo.email,
                        picture : "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
                    });
                    $ionicLoading.hide();
                    $state.go('app.home');
                }, function(fail){
                    // Fail get profile info
                    console.log('profile info fail', fail);
                });
        };

        // This is the fail callback from the login method
        var fbLoginError = function(error){
            console.log('fbLoginError', error);
            $ionicLoading.hide();
        };

        // This method is to get the user profile info from the facebook api
        var getFacebookProfileInfo = function (authResponse) {
            var info = $q.defer();

            facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
                function (response) {
                    console.log(response);
                    info.resolve(response);
                },
                function (response) {
                    console.log(response);
                    info.reject(response);
                }
            );
            return info.promise;
        };

        //This method is executed when the user press the "Login with facebook" button
        $scope.facebookSignIn = function() {
            facebookConnectPlugin.getLoginStatus(function(success){
                if(success.status === 'connected'){
                    // The user is logged in and has authenticated your app, and response.authResponse supplies
                    // the user's ID, a valid access token, a signed request, and the time the access token
                    // and signed request each expire
                    console.log('getLoginStatus', success.status);

                    // Check if we have our user saved
                    var user = UserService.getUser('facebook');

                    if(!user.userID){
                        getFacebookProfileInfo(success.authResponse)
                            .then(function(profileInfo) {
                                // For the purpose of this example I will store user data on local storage
                                UserService.setUser({
                                    authResponse: success.authResponse,
                                    userID: profileInfo.id,
                                    name: profileInfo.name,
                                    email: profileInfo.email,
                                    picture : "http://graph.facebook.com/" + success.authResponse.userID + "/picture?type=large"
                                });

                                $state.go('app.home');
                            }, function(fail){
                                // Fail get profile info
                                console.log('profile info fail', fail);
                            });
                    }else{
                        $state.go('app.home');
                    }
                } else {
                    // If (success.status === 'not_authorized') the user is logged in to Facebook,
                    // but has not authenticated your app
                    // Else the person is not logged into Facebook,
                    // so we're not sure if they are logged into this app or not.

                    console.log('getLoginStatus', success.status);

                    $ionicLoading.show({
                        template: 'Logging in...'
                    });

                    // Ask the permissions you need. You can learn more about
                    // FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
                    facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
                }
            });
        };
    })
