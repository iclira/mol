navigatorRoomlistInterfaceClass = function() {

}

navigatorRoomlistInterfaceClass.prototype = {
	init: function() {
		
	},

	a: function() {

	}
}

navigatorWindowInterfaceClass = function() {

}

navigatorWindowInterfaceClass.prototype = {
	init: function() {
		this.window = gCore.windowManager().create("navigator", "habbo_basic.window");
		this.window.load("nav_pr.window");
		this.window.setOnClickListener(this);
	},

	click: function(window, element) {
		window.clear();
		window.load("habbo_basic.window");

		if(element.getId() == 'nav_tb_publicRooms')
			window.load("nav_pr.window");
		else if(element.getId() == 'nav_tb_guestRooms')
			window.load("nav_gr0.window");
	},

	b: function() {
		console.log(this.aPar);
	}
}