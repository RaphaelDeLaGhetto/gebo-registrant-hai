'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
//  beforeEach(module('geboRegistrantHaiApp'));
//
//  var MainCtrl,
//    scope;
//
//  // Initialize the controller and a mock scope
//  beforeEach(inject(function ($controller, $rootScope) {
//    scope = $rootScope.$new();
//    MainCtrl = $controller('MainCtrl', {
//      $scope: scope
//    });
//  }));
//
//  it('should attach a list of awesomeThings to the scope', function () {
//    expect(scope.awesomeThings.length).toBe(3);
//  });


    var GEBO_ADDRESS = 'http://theirhost.com',
        REDIRECT_URI = 'http://myhost.com',
        LOCAL_STORAGE_NAME = 'accessToken',
        ACCESS_TOKEN = '1234';
 
    var VERIFICATION_DATA = {
                id: '1',
                name: 'dan',
                email: 'dan@email.com',
                admin: false,
            };

    var MainCtrl,
        $httpBackend,
        $location,
        $q,
        scope,
        token;

    /**
     * Initialize the controller and a mock scope
     */
    beforeEach(function() {
        module('geboRegistrantHaiApp');
            
        inject(function ($controller, $rootScope, $injector) {
            scope = $rootScope.$new();
            token = $injector.get('Token');
            $q = $injector.get('$q');
            $location = $injector.get('$location');

            MainCtrl = $controller('MainCtrl', {
                $scope: scope,
                Token: token
            });

            $httpBackend = $injector.get('$httpBackend');
            $httpBackend.when('GET', 'views/main.html').respond();
        });

        /**
         * Initialize the Token service
         */
        token.setEndpoints({
          gebo: GEBO_ADDRESS,
          redirect: REDIRECT_URI,
        });
 
        var store = {};
        spyOn(token, 'get').andCallFake(function() {
            return store[LOCAL_STORAGE_NAME];
        });
 
        spyOn(token, 'set').andCallFake(function(tokenString) {
            store[LOCAL_STORAGE_NAME] = tokenString;
        });

        spyOn(token, 'clear').andCallFake(function(tokenString) {
            delete store[LOCAL_STORAGE_NAME];
        });

         spyOn(token, 'verify').andCallFake(function(token) {
            var deferred = $q.defer();
            deferred.resolve(VERIFICATION_DATA);
            return deferred.promise;
        });
    });

//    afterEach(function() {
//        $httpBackend.verifyNoOutstandingExpectation();
//        $httpBackend.verifyNoOutstandingRequest();
//    });

    /**
     * Has this client already authenticated?
     */
    describe('onload', function() {

        beforeEach(inject(function($controller) {
            var ctrl = $controller('MainCtrl', {
                    $scope: scope,
                    Token: token
            });
        }));

        it('should look for a locally stored token', function() {
           expect(token.get).toHaveBeenCalled();
           expect(scope.accessToken).toBe(undefined);
        });

        it('should verify a locally stored token', inject(function($controller, $rootScope) {
            token.set(ACCESS_TOKEN);
            var ctrl = $controller('MainCtrl', {
                    $scope: scope,
                    Token: token
            });

            expect(token.get).toHaveBeenCalled();
            expect(scope.accessToken).toBe(ACCESS_TOKEN);
            expect(token.verify).toHaveBeenCalled();

            expect(scope.verified).toBe(false);
            expect(scope.agentName).toBe(undefined);
            $rootScope.$apply();
            expect(scope.verified).toBe(true);
            expect(scope.agentName).toBe('dan');
         }));
 
    });

    /**
     * authenticate
     */
    describe('authenticate', function() {
        beforeEach(function() {
            spyOn(token, 'getTokenByPopup').andCallFake(function() {
                var deferred = $q.defer();
                deferred.resolve({ access_token: ACCESS_TOKEN });
                return deferred.promise;
            });
        });

        it ('should store the token in local storage', inject(function($rootScope) {
            scope.authenticate();

            expect(token.getTokenByPopup).toHaveBeenCalled();
            $rootScope.$apply();
            expect(token.verify).toHaveBeenCalled();
            expect(token.set).toHaveBeenCalled();

            expect(scope.verified).toBe(true);
            expect(scope.agentName).toBe('dan');
            expect(scope.accessToken).toBe(ACCESS_TOKEN);
         }));
    });


    /**
     * deauthenticate
     */
    describe('deauthenticate', function() {

        beforeEach(function() {
            spyOn(token, 'getTokenByPopup').andCallFake(function() {
                var deferred = $q.defer();
                deferred.resolve({ access_token: ACCESS_TOKEN });
                return deferred.promise;
            });
        });


        it ('should erase the token from local storage', inject(function($rootScope) {
            scope.authenticate();
            $rootScope.$apply();
            expect(scope.verified).toBe(true);
            expect(scope.agentName).toBe('dan');
            expect(scope.accessToken).toBe(ACCESS_TOKEN);

            scope.deauthenticate();
            expect(scope.verified).toBe(false);
            expect(scope.agentName).toBe(undefined);
            expect(scope.accessToken).toBe(undefined);
            expect(token.get()).toBe(undefined);
            expect($location.path()).toBe('/');
         }));
    });

//    it('should load entries with HTTP', function() {
//        $httpBackend.expectGET('/test');
//        MainCtrl.load(function() {
//            expect(Object.keys(scope.entries).length).toBe(1);
//            expect(scope.entries.name).toBe('dan');
//        });
//        $httpBackend.flush();
//    });


});
