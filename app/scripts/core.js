Core = function()
{
	this.objects = {};
};

Core.prototype = {
	init: function()
	{
		this._windowManager = new WindowManager();
		this._castManager = new CastManager();
	},

	windowManager: function()
	{
		return this._windowManager;
	},

	castManager: function()
	{
		return this._castManager;
	},

	get: function(name) {
		return this.objects[name];
	},

	set: function(nome, value) {
		this.objects[nome] = value;
	}
};

gCore = new Core();