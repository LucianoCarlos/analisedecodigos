var app = angular.module('BomCodigo', ['ngRoute', 'ngMaterial', 'ngAnimate', 'ngAria', 'ngCookies']);

/* Configuraçao do visual*/
app.config(function($mdThemingProvider) {
  // Cor do cabeçalho.
  $mdThemingProvider.theme('default')
    .primaryPalette('cyan')
    .accentPalette('orange')
    .warnPalette('orange');
});


/* Configuraçao de rotas*/
app.config(['$routeProvider', function($routerProvider){
	$routerProvider
		.when('/repositorios-usuario', {
			controller: "ReposController",
			templateUrl: 'templates/repositoriosUsuario.tmpl.html'
		})
		.when('/ranking', {
			controller: "TudoController",
			templateUrl: 'templates/ranking.tmpl.html'
		})
	  .when('/', {
      templateUrl: 'templates/inicio.tmpl.html'
    })
    .otherwise({
  		templateUrl: 'templates/pageNotFound.tmpl.html'
	});
}]);


/* Realiza requisiçao ajax */
app.factory('RankingAPI', function($http){
	var _getLista =  function(url){
		return $http.get(url);
	};
	return {
		getLista: _getLista
	};
});

/* Retorna o usuario logado no momento. */
app.factory('GetUsuario', function($cookies){
    var _getUsuario =  function(){
       return $cookies.get('login');
    };
    return {
       getUsuario: _getUsuario
    };
});


/* Controla ranking*/
app.controller('TudoController', function( $rootScope, $scope, RankingAPI, config){
	var url = config.baseURL + '/ranking';

	$scope.ranking = [];
	$scope.user = {};

	RankingAPI.getLista(url).then(function(response) {         
		var r = response.data;
		$scope.ranking = r;

		for (var i = 0; i < r.length; i++){  
			$scope.ranking[i]['posicao']  = i + 1;
			var url = 'https://api.github.com/users/'+ r[i].login;
			RankingAPI.getLista(url).then(function(response) {  
				$scope.user[response.data.login] = response.data;
			});
		} 
	});
});


/* Controla repositorios do usuario*/
app.controller('ReposController', function($http, $rootScope, $scope, $mdDialog, GetUsuario, RankingAPI, config, $cookies){
  $scope.repositorios = [];
  $scope.resposta;

  var user = GetUsuario.getUsuario();

  if(user != ''){
    RankingAPI.getLista('https://api.github.com/users/'+ user +'/repos').then (function(response) {
      $scope.repositorios = response.data;
    });
  }

  $scope.showTabDialog = function(ev, repositorio) {
    var url = config.baseURL + '/analysis/' + repositorio.html_url;

    RankingAPI.getLista(url).then(function(response){
      resposta = response.data.nota;
      $mdDialog.show({
        controller: DialogController,
        templateUrl: 'templates/tabDialog.tmpl.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose:false
      });
    });
  };
 
  	function DialogController($scope, $mdDialog) {
   		$scope.cancel = function() {
      		$mdDialog.cancel();
    	};
  	}

});

/* Controla login */
app.controller("LoginController", function($scope, $http, $window, $cookies, config){
  $scope.login = '';
  $scope.avatar = ''; 

  $scope.is_autenticado = function(){
    var user = firebase.auth().currentUser;
    
    if (user){
      $scope.user = user.displayName;
      $scope.avatar = user.photoURL;
      return true;
    }else
      return false;
  }

  $scope.entrar = function(){
	var provider = new firebase.auth.GithubAuthProvider(); 
	firebase.auth().signInWithPopup(provider).then(function(result) {

	// This gives you a GitHub Access Token. You can use it to access the GitHub API.
	var token = result.credential.accessToken;
	repositoriosGit = config.baseURLGIT + '/user?access_token=' + token;

	$http.get(repositoriosGit).then(function(response) {
		// Armazena o usuario logado no cookie.
		$cookies.put('login', response.data.login);

		// Atualiza a pagina apos login.
		$window.location.reload();
		});

		}).catch(function(error) {
		// Handle Errors here.
		var errorCode = error.code;
		var errorMessage = error.message;
	});
  }

  $scope.sair = function(){
    firebase.auth().signOut().then(function() {
      $cookies.put('login', '')
      $window.location.reload();  
    }, function(error) {
      // An error happened.
    });
  }
})


app.controller('AppCtrl', function($scope, $mdDialog) {
	$scope.status = '  ';
	$scope.customFullscreen = false;

	$scope.showTabDialog = function(ev) {
		$mdDialog.show({
		controller: DialogController,
		templateUrl: 'tabDialog.tmpl.html',
		parent: angular.element(document.body),
		targetEvent: ev,
		clickOutsideToClose:true
		})
		.then(function(answer) {
		$scope.status = 'You said the information was "' + answer + '".';
		}, function() {
		$scope.status = 'You cancelled the dialog.';
		});
	};

	function DialogController($scope, $mdDialog) {
		$scope.cancel = function() {
		$mdDialog.cancel();
		};
	}
});