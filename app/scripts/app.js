angular.module("mol", ['ngRoute', 'ngCookies'])
.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider)
{
	$routeProvider.when("/", { controller: "dsadsa", templateUrl: "index.g" });
}])
.run(['LoadCastLib', 'CreateWindow', function(LoadCastLib, CreateWindow)
{
	gCore.init();

	LoadCastLib("hh_entry_br")
	.then(function()
	{
		CreateWindow("entry", "entry.visual");
		gCore.windowManager().get("entry").sendToBack();
	});

	LoadCastLib("hh_interface");
	LoadCastLib("hh_navigator");
}])
.directive("stage", ['$window', 'Stage', function($window, Stage)
{
	return {
		template: '<canvas></canvas>',
		scope: {
	
		},
		link: function(scope, element, attr) {
			scope.canvas = element[0].getElementsByTagName("canvas")[0];
			scope.fps = 24;
			scope.draw = function()
			{
				scope.canvas.width = $window.innerWidth;
				scope.canvas.height = $window.innerHeight;

				Stage.draw(scope.canvas.getContext("2d"), scope.canvas.width, scope.canvas.height);
			}

			$window.setInterval(scope.draw, 1000 / scope.fps);

			scope.canvas.addEventListener("mousedown", function(e)
			{
				gCore.windowManager().mouseDown(e.clientX, e.clientY);
			});

			scope.canvas.addEventListener("touchstart", function(e)
			{
				gCore.windowManager().mouseDown(e.touches[0].clientX, e.touches[0].clientY);
			});

			scope.canvas.addEventListener("mousemove", function(e)
			{
				gCore.windowManager().mouseMove(e.clientX, e.clientY);
			});

			scope.canvas.addEventListener("touchmove", function(e)
			{
				gCore.windowManager().mouseMove(e.touches[0].clientX, e.touches[0].clientY);
				e.preventDefault();
			});

			scope.canvas.addEventListener("mouseup", function(e)
			{
				gCore.windowManager().mouseUp(e.clientX, e.clientY);
			});

			scope.canvas.addEventListener("touchend", function(e)
			{
				gCore.windowManager().mouseUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
			});
		}
	};
}])
.service("Stage", [function()
{
	return {
		draw: function(ctx, w, h)
		{
			ctx.imageSmoothingEnabled = false;
			ctx.fillStyle = "#000000";
			ctx.fillRect(0,0,w,h);

			gCore.windowManager().draw(ctx, gCore);
		}
	};
}])
.factory("LoadCastLib", ['$http', '$q', function castLibFactory($http, $q)
{
	return function(name)
	{
		var promise = $q(function(resolve, reject)
		{
			gCore.castManager().load($http, name, resolve, reject);
		});
		return promise;
	};
}])
.factory("CreateWindow", [function createWindowFactory()
{
	return function(name, xml)
	{
		return gCore.windowManager().create(name, xml);
	};
}]);