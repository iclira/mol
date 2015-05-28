CastLib = function($http, fileName, resolve, reject)
{
	this.errorMembers = 0;
	this.successfulMembers = 0;
	this.finishedMembers = 0;
	this.rejected = false;

	this.name = fileName;
	this.manifest = null;
	this.fileName = fileName;
	this.members = [];
	this.resolve = resolve;
	this.reject = reject;
	this.load($http, resolve, reject);
};

CastLib.prototype = {
	load: function($http, resolve, reject)
	{
		console.log("Loading cast: " + this.fileName);
		$http.get("resources/" + this.fileName + "/manifest.txt", 
			{ transformResponse: null, scope: this, resolve: resolve, reject: reject }).success(function(x, a, b, c)
		{
			c.scope.manifest = new ListParser().parse(x);
			c.scope.manifestLoaded($http);
		});
	},

	downloadableCount: function()
	{
		var count = 0;

		for(var i = 0; i < this.manifest.length; i++)
		{
			var memberManifest = this.manifest[i];
			if(memberManifest['type'] == 'field' || memberManifest['type'] == 'bitmap' || memberManifest['type'] == 'script')
				count++;
		}

		return count;
	},

	manifestLoaded: function($http)
	{
		for(var i = 0; i < this.manifest.length; i++)
		{
			var memberManifest = this.manifest[i];
			this.members.push(new CastMember($http, memberManifest, this));
		}
	},

	loadFinished: function()
	{
		var threadIndex = this.member("thread.index");
		if(threadIndex)
		{
			threadIndex = threadIndex.text;

			var data = {};

			var lines = threadIndex.split("\r");
			for(var i = 0; i < lines.length; i++)
			{
				var line = lines[i];

				if(line.length == 0 || line[0] == '#')
					continue;

				var matches = line.match(/^(.*)=(.*)$/);
				var key = matches[1].trim();
				var value;
				try
				{
					value = new ListParser().parse(matches[2].trim());
				}
				catch(e)
				{
					value = matches[2].trim();
				}

				data[key] = value;
			}

			var threadId = data['thread.id'];
			if(data['interface.class'])
			{
				var interfaceClass = data['interface.class'];
				if(typeof(interfaceClass) == 'string')
					interfaceClass = [interfaceClass];

				var resultingClass = null;
				for(var i = 0; i < interfaceClass.length; i++)
				{
					var normalizedName = this.normalizeScriptName(interfaceClass[i]);
					var instance = new window[normalizedName]();
					instance.init();

					if(resultingClass == null)
						resultingClass = instance;
					else
						this.extend(resultingClass, instance);
				}

				gCore.set(threadId + "_interface", resultingClass);
			}
		}
	},

	extend: function(a, b)
	{
		for(var k in b.__proto__)
		{
			a.__proto__[k] = b.__proto__[k];
		}

		for(var k in b)
		{
			a[k] = b[k];
		}
	},

	normalizeScriptName: function(name)
	{
		var initial = name[0].toLowerCase();
		var rest = name.substr(1, name.length - 1);

		return initial + rest.replace(/ /g, "");
	},

	memberResolve: function()
	{
		this.successfulMembers++;
		this.finishedMembers++;

		if(this.finishedMembers == this.downloadableCount() && this.errorMembers == 0 && this.resolve)
		{
			this.resolve();
			this.loadFinished();
		}
	},

	memberReject: function()
	{
		console.log("error");

		this.errorMembers++;
		this.finishedMembers++;

		if(!this.rejected && this.reject)
			this.reject();

		this.rejected = true;
	},

	member: function(name)
	{
		for (var i = 0; i < this.members.length; i++) {
			var member = this.members[i];

			if(member.getName() == name)
				return member;
		};

		return null;
	}
}

CastMember = function($http, manifest, castlib)
{
	this.manifest = manifest;
	this.castLib = castlib;
	this.text = null;

	if(this.getType() == 'field')
		this.loadField($http);
	else if(this.getType() == 'bitmap')
		this.loadBitmap($http);
	else if(this.getType() == 'script')
		this.loadScript();
	else
		this.castLib.memberResolve();
};

CastMember.prototype = {
	getType: function() {
		return this.manifest['type'];
	},

	getName: function() {
		return this.manifest['name'];
	},

	loadField: function($http) {
		$http.get("resources/" + this.castLib.name + "/" + this.getName() + ".txt",
		{ transformResponse: null, scope: this })
		.success(function(data, a, b, c)
		{
			c.scope.text = data;
			c.scope.castLib.memberResolve();
		})
		.error(function(a, b, c, d)
		{
			d.scope.castLib.memberReject();
		});
	},

	loadBitmap: function($http) {
		var url = "resources/" + this.castLib.name + "/" + this.getName() + ".png";
		var img = new Image();
		img.src = url;
		img.member = this;

		img.onload = function() { this.member.castLib.memberResolve(); this.member.imageLoaded(); };
		this.image = img;
	},

	loadScript: function() {
		var url = "resources/" + this.castLib.name + "/" + this.getName() + ".js";
		var img = document.createElement("script");
		img.src = url;
		img.member = this;
		document.head.appendChild(img);

		img.onload = function() { this.member.castLib.memberResolve(); };
		this.script = img;
	},

	floodClear: function(data, stack, w, h) {
		while(stack.length > 0)
		{
			var params = stack.pop();
			var x = params[0];
			var y = params[1];

			if(x < 0 || x >= w || y < 0 || y >= h)
				continue;

			var i = (y * w * 4) + (x * 4);

			var r = data[i];
			var g = data[i + 1];
			var b = data[i + 2];

			if(!(r == 255 & g == 255 && b == 255))
				continue;

			data[i] = 255;
			data[i + 1] = 0;
			data[i + 2] = 0;
			data[i + 3] = 0;

			stack.push([x - 1, y]);
			stack.push([x + 1, y]);
			stack.push([x, y - 1]);
			stack.push([x, y + 1]);
		}
	},

	imageLoaded: function() {
		var tmpCanvas = document.createElement("canvas");
		tmpCanvas.width = this.image.width + 2;
		tmpCanvas.height = this.image.height + 2;
		var tmpCtx = tmpCanvas.getContext("2d");
		tmpCtx.fillStyle = "#ffffff";
		tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
		tmpCtx.drawImage(this.image, 1, 1, this.image.width, this.image.height);

		var imageData = tmpCtx.getImageData(0,0,tmpCanvas.width, tmpCanvas.height);
  		var data = imageData.data;
  		this.floodClear(data, [[0, 0]], tmpCanvas.width, tmpCanvas.height);
    	tmpCtx.putImageData(imageData, 0, 0);

    	var resultingCanvas = document.createElement("canvas");
    	resultingCanvas.width = this.image.width;
    	resultingCanvas.height = this.image.height;
    	var resultingCtx = resultingCanvas.getContext("2d");
    	resultingCtx.putImageData(imageData, -1, -1);

		var dataURL = resultingCanvas.toDataURL();
		var tmpImg = new Image();
		tmpImg.src = dataURL;
		
		this.image = tmpImg;
		//ctx.drawImage(tmpImg, 0, 0, this.getWidth(), this.getHeight());
	},

	getRegX: function() {
		return this.manifest['regPoint'][0];
	},

	getRegY: function() {
		return this.manifest['regPoint'][1];
	},

	parseXml: function() {
		var xmlDoc;

		if (window.DOMParser)
		{
			parser=new DOMParser();
			xmlDoc=parser.parseFromString(this.text,"text/xml");
		}
		else // Internet Explorer
		{
			xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async=false;
			xmlDoc.loadXML(this.text); 
		}

		return xmlDoc;
	}
};

CastManager = function() {
	this.casts = [];
}

CastManager.prototype = {
	load: function($http, name, resolve, reject) {
		this.casts.push(new CastLib($http, name, resolve, reject));
	},

	member: function(name) {
		for(var i = 0; i < this.casts.length; i++)
		{
			var m = this.casts[i].member(name);
			if(m)
				return m;
		}

		return null;
	}
};