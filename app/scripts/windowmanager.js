WindowManager = function()
{
	this.draggingWindow = null;
	this.draggingPivot = [];
	this.windows = [];
};

WindowManager.prototype = {
	get: function(name) {
		for (var i = 0; i < this.windows.length; i++)
		{
			var wnd = this.windows[i];
			if(wnd.getName() == name)
				return wnd;
		}

		return null;
	},

	create: function(a, b) {
		var name, xml;
		var load = false;

		name = a;
		xml = b;

		if(xml)
			load = true;

		if(this.get(name))
		{
			console.log("Window already exists: " + name);
			return this.get(name);
		}
		else
		{
			var wnd = new Window(this, name);

			this.windows.push(wnd);
			if(load)
				wnd.load(xml);
			return wnd;
		}
	},

	draw: function(ctx) {
		for (var i = 0; i < this.windows.length; i++)
		{
			var wnd = this.windows[i];
			wnd.draw(ctx);
		};
	},

	getWindowAt: function(x, y) {
		for (var i = this.windows.length - 1; i >= 0; i--) {
			var wnd = this.windows[i];

			if(wnd.hitTest(x, y))
			{
				return wnd;
			}
		};

		return null;
	},

	sendWindowToBack: function(window) {
		var index = -1;

		for (var i = 0; i < this.windows.length; i++)
		{
			var wnd = this.windows[i];
			if(wnd == window)
			{
				index = i;
				break;
			}
		}

		for(var i = index; i >= 0; i--)
		{
			if(i - 1 >= 0)
				this.windows[i] = this.windows[i - 1];
			else
				this.windows[i] = null;
		}

		this.windows[0] = window;
	},

	mouseDown: function(x, y) {
		var wnd = this.getWindowAt(x, y);
		if(wnd)
		{
			if(wnd.isDragElement(x - wnd.getX(), y - wnd.getY()))
			{
				this.draggingWindow = wnd;
				this.draggingPivot = [x - wnd.getX(), y - wnd.getY()];
			}
			else
				wnd.mouseDown(x - wnd.getX(), y - wnd.getY());
		}
	},

	mouseMove: function(x, y) {
		if(this.draggingWindow)
		{
			this.draggingWindow.setPos(x - this.draggingPivot[0], y - this.draggingPivot[1]);
			return;
		}

		var wnd = this.getWindowAt(x, y);
		if(wnd)
		{
			wnd.mouseMove(x - wnd.getX(), y - wnd.getY());
		}
	},

	mouseUp: function(x, y) {
		if(this.draggingWindow)
		{
			this.draggingWindow = null;
			return;
		}

		var wnd = this.getWindowAt(x, y);
		if(wnd)
		{
			wnd.mouseUp(x - wnd.getX(), y - wnd.getY());
		}
	}
};

Window = function(manager, name)
{
	this.loaded = false;

	this.name = name;
	this.manager = manager;

	this.isDragging = false;
	this.dragPivot = [];

	this.position = [100, 100];
	this.clickListener = null;

	this.clear();
};

Window.prototype = {
	clear: function() {
		this.size = [0, 0];
		this.elements = [];

		this.clientRect = [0, 0, 0, 0];
	},

	getName: function() {
		return this.name;
	},

	setOnClickListener: function(listener) {
		this.clickListener = listener;
	},

	setPos: function(x, y) {
		this.position = [x, y];
	},

	setSize: function(w, h) {
		var oldSize = this.size;
		this.size = [w, h];

		var deltaX = w - oldSize[0];
		var deltaY = h - oldSize[1];

		for (var i = 0; i < this.elements.length; i++)
		{
			var element = this.elements[i];
			var stretchType = this.elements[i].manifest['strech'];
			var x = element.getX();
			var y = element.getY();
			var width = element.getWidth();
			var height = element.getHeight();

			if(stretchType == 'moveH')
				x += deltaX;
			else if(stretchType == 'moveV')
				y += deltaY;
			else if(stretchType == 'moveHV')
			{
				x += deltaX;
				y += deltaY;
			}
			else if(stretchType == 'strechH')
				width += deltaX;
			else if(stretchType == 'strechV')
				height += deltaY;
			else if(stretchType == 'strechHV')
			{
				width += deltaX;
				height += deltaY;
			}
			else if(stretchType == 'moveHstrechV')
			{
				x += deltaX;
				height += deltaY;
			}
			else if(stretchType == 'moveVstrechH')
			{
				y += deltaY;
				width += deltaX;
			}
			else if(stretchType == 'centerH')
			{
				x += deltaX / 2;
			}
			else if(stretchType == 'centerV')
			{
				y += deltaY / 2;
			}
			else if(stretchType == 'centerHV')
			{
				x += deltaX / 2;
				y += deltaY / 2;
			}

			this.elements[i].setPos(x, y);
			this.elements[i].setSize(width, height);
		};
	},

	sendToBack: function() {
		this.manager.sendWindowToBack(this);
	},

	getPos: function() {
		return this.position;
	},

	getX: function() {
		return this.position[0];
	},

	getY: function() {
		return this.position[1];
	},

	getWidth: function() {
		return this.size[0];
	},

	getHeight: function() {
		return this.size[1];
	},

	hitTest: function(x, y) {
		return (x >= this.getX() && x < this.getX() + this.getWidth()) && (y >= this.getY() && y < this.getY() + this.getHeight());
	},

	draw: function(ctx) {
		//ctx.fillStyle = "#ffffff";
		//ctx.fillRect(0, 0, this.size[0], this.size[1]);

		for (var i = 0; i < this.elements.length; i++) {
			var scaleX = 1;
			var scaleY = 1;
			var x = this.getX();
			var y = this.getY();

			if(this.elements[i].manifest['flipH'] == 1)
			{
				scaleX = -1;
				x = this.getX() + this.elements[i].getX() * 2;
			}
			if(this.elements[i].manifest['flipV'] == 1)
			{
				scaleY = -1;
				y = this.getY() + this.elements[i].getY() * 2;
			}

			ctx.setTransform(scaleX,0,0,scaleY,x,y);
			this.elements[i].draw(ctx, Core);
		};

		ctx.fillStyle = "#ff0000";
		ctx.fillRect(this.clientRect[0], 0, 1, this.getHeight());
		ctx.fillRect(this.clientRect[2], 0, 1, this.getHeight());

		ctx.fillRect(0, this.clientRect[1], this.getWidth(), 1);
		ctx.fillRect(0, this.clientRect[3], this.getWidth(), 1);
	},

	load: function(memberName) {
		var doc = gCore.castManager().member(memberName).parseXml();

		var borderLeft = this.clientRect[0];
		var borderRight = this.size[0] - this.clientRect[2];

		var borderTop = this.clientRect[1];
		var borderBottom = this.size[1] - this.clientRect[3];

		var deltaW = -this.getWidth();
		var deltaH = -this.getHeight();

		var rect = new ListParser().parse(doc.getElementsByTagName("rect")[0].childNodes[0].nodeValue);
		if(!this.loaded)
			this.setPos(rect[0], rect[1]);
		this.loaded = true;
		this.setSize(rect[2] - rect[0] + borderLeft + borderRight, rect[3] - rect[1] + borderTop + borderBottom);

		deltaW += this.getWidth();
		deltaH += this.getHeight();

		var txt = "[" + doc.getElementsByTagName("elements")[0].innerHTML.toString().replace(/\t|\r|\n/g, "").replace(/\]\[/g, "],[") + "]";
		var elements = new ListParser().parse(txt);

		for (var i = 0; i < elements.length; i++) {
			var element = elements[i];

			var newElement = new WindowElement(element);
			newElement.setPos(newElement.getX() + this.clientRect[0], newElement.getY() + this.clientRect[1]);
			this.elements.push(newElement);
		};

		if(doc.getElementsByTagName("clientrect").length > 0)
		{
			var crText = doc.getElementsByTagName("clientrect")[0].childNodes[0].nodeValue;
			var cr = crText.match(/rect\(([0-9]+), ([0-9]+), ([0-9]+), ([0-9]+)\)/);

			this.clientRect[2] = parseInt(cr[3]) + this.clientRect[0];
			this.clientRect[3] = parseInt(cr[4]) + this.clientRect[1];
			this.clientRect[0] += parseInt(cr[1]);
			this.clientRect[1] += parseInt(cr[2]);
		}
		else
		{
			this.clientRect[2] += deltaW;
			this.clientRect[3] += deltaH;
		}
		// + this.clientRect[2];
	},

	isDragElement: function(x, y) {
		var element = this.getElementAt(x, y);

		if(element && element.manifest['id'] == 'drag')
			return true;

		return false;
	},

	getElementAt: function(x, y) {
		var keys = Object.keys(this.elements);
		for (var i = keys.length - 1; i >= 0; i--) {
			var w = keys[i];

			var wnd = this.elements[w];
			if(wnd.hitTest(x, y))
			{
				return wnd;
			}
		};

		return null;
	},

	mouseDown: function(x, y) {
		var element = this.getElementAt(x, y);

		if(element)
			this.clickListener.click(this, element);
		//this.isDragging = true;
		//this.dragPivot = [x, y];
	},

	mouseMove: function(x, y) {
		//if(this.isDragging)
		//	this.setPos(x, y);
			//this.setPos(x - this.dragPivot[0], y - this.dragPivot[1]);
	},

	mouseUp: function(x, y) {
		//if(this.isDragging)
		//	this.setPos(x, y);
			//this.setPos(x - this.dragPivot[0], y - this.dragPivot[1]);
	}
};

WindowElement = function(manifest)
{
	this.frameCount = 0;
	this.manifest = manifest;
	this.position = [0, 0];
	this.size = [0, 0];

	this.init();
}

WindowElement.prototype = {
	init: function()
	{
		this.setPos(this.manifest['locH'], this.manifest['locV']);
		this.setSize(this.manifest['width'], this.manifest['height']);
	},

	setPos: function(x, y) {
		this.position = [x, y];
	},

	setSize: function(w, h) {
		this.size = [w, h];
	},

	getPos: function() {
		return this.position;
	},

	getX: function() {
		return this.position[0];
	},

	getY: function() {
		return this.position[1];
	},

	getWidth: function() {
		return this.size[0];
	},

	getHeight: function() {
		return this.size[1];
	},

	getId: function() {
		return this.manifest['id'];
	},

	hitTest: function(x, y) {
		return (x >= this.getX() && x < this.getX() + this.getWidth()) && (y >= this.getY() && y < this.getY() + this.getHeight());
	},

	draw: function(ctx, Core)
	{
		ctx.globalAlpha = 1;
		if(this.manifest['blend'])
		{
			ctx.globalAlpha = this.manifest['blend'] / 100;
		}

		if(this.manifest['id'] == 'car2' || this.manifest['id'] == 'car4')
		{
			/*if(this.frameCount % 3 == 0)
			{
				this.position[0] -= 2;
				this.position[1] -= 1;
			}*/

			this.frameCount++;
		}

		//if(this.manifest['type'] == 'piece')
		{
			if(this.manifest['media'] == 'bitmap')
			{
				var member = gCore.castManager().member(this.manifest['member']);
				ctx.drawImage(member.image, this.getX() - member.getRegX(), this.getY() - member.getRegY(), this.getWidth(), this.getHeight());
			}
			else if(this.manifest['media'] == 'shape')
			{
				ctx.fillStyle = this.manifest['color'];
				//ctx.fillRect(this.getX(), this.getY(), this.getWidth(), this.getHeight());
			}
			else if(this.manifest['media'] == 'field')
			{
				ctx.fillStyle = "#000000";
				ctx.font = this.manifest['fontSize'] + "px Volter (Goldfish)";
				ctx.fillText(this.manifest['key'], this.getX(), this.getY() + (this.getHeight() - this.manifest['fontSize']) / 2);
			}
		}
	}
};