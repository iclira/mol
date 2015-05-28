ListParser = function()
{
	
}

ListParser.prototype = {
	parse: function(string)
	{
		this.buffer = string;
		this.position = 0;

		return this.parseValue();
	},

	parseValue: function()
	{
		var token = this.getToken(false);
		if(token == "list_begin")
			return this.parseListOrDict();
		else if(token == "symbol")
			return this.parseSymbol();
		else if(token == "number" || token == "dash")
			return this.parseNumber();
		else if(token == "string")
			return this.parseString();
		else
			throw new Error("Unexpected token '" + token + "' at " + this.position);
	},

	parseStringOrSymbol: function()
	{
		var token = this.getToken(false);
		if(token != "string" && token != "symbol")
			throw new Error("Unexpected token '" + token + "' at " + (this.position - 1));

		if(token == "string")
		{
			return this.parseString();
		}
		else
		{
			return this.parseSymbol();
		}
	},

	parseString: function()
	{
		var token = this.getToken(true);
		if(token != "string")
			throw new Error("Unexpected token '" + token + "' at " + (this.position - 1));

		var result = "";
		var chr;
		while((chr = this.buffer[this.position++]) != '"')
		{
			result += chr;
		}

		return result;
	},

	parseSymbol: function()
	{
		var token = this.getToken(true);
		if(token != "symbol")
			throw new Error("Unexpected token '" + token + "' at " + (this.position - 1));

		var result = "";
		var chr;

		while(this.isValidCharForSymbol(chr = this.buffer[this.position++]))
		{
			result += chr;
		}

		this.position--;

		return result;
	},

	isValidCharForSymbol: function(ch)
	{
		if((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z'))
			return true;
		
		if(ch >= '0' && ch <= '9')
			return true;
		
		if(ch == '_')
			return true;
		
		return false;
	},

	parseListOrDict: function()
	{
		var token = this.getToken(true);
		if(token != "list_begin")
			throw new Error("Unexpected token '" + token + "' at " + (this.position - 1));

		var result = null;
		var isDict = false;
		while((token = this.getToken(false)) != "list_end")
		{
			var keyType = token;
			var key = this.parseValue();

			if(result == null)
			{
				if(this.getToken(false) == "dict_assign")
				{
					result = {};
					isDict = true;
				}
				else
				{
					result = [];
					isDict = false;
				}
			}

			if(isDict)
			{
				var t = this.getToken(true);
				if(t != "dict_assign")
					throw new Error("Unexpected token '" + t + "' at " + (this.position - 1));
				var value = this.parseValue();

				result[key] = value
			}
			else
			{
				result.push(key);
			}

			var t = this.getToken(false);
			if(t != "comma" && t != "list_end")
				throw new Error("Unexpected token '" + t + "' at " + (this.position));

			if(t == "comma")
				this.position++;
		}

		this.position++;

		if(result == null)
			result = [];

		return result;
	},

	parseNumber: function()
	{
		var result = 0;
		var isNegative = false;
		var isFirst = true;

		var tok = this.getToken(false);
		if(tok == "dash")
		{
			isNegative = true;
			this.position++;
		}

		while(true)
		{
			var token = this.getToken(false);
			ch = this.buffer[this.position];

			if(token != "number")
			{
				if(isFirst)
					throw new Error("Unexpected token '" + token + "' at " + this.position);
				else
					break;
			}
			else
			{
				isFirst = false;
				result *= 10;
				result += (ch - '0');

				this.position++;
			}
		}

		if(isNegative)
			result *= -1;

		return result;
	},

	getToken: function(consume)
	{
		while(this.buffer[this.position] == ' ' || this.buffer[this.position] == '\t' || this.buffer[this.position] == '\r' || this.buffer[this.position] == '\n')
		{
			this.position++;
		}

		if(this.position >= this.buffer.length)
			return "eof";

		var ch = this.buffer[this.position];
		if(consume)
			this.position++;

		if(ch == '[')
			return "list_begin";
		else if(ch == ']')
			return "list_end";
		else if(ch == '#')
			return "symbol";
		else if((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z'))
			return "char";
		else if(ch == '"')
			return "string";
		else if(ch >= '0' && ch <= '9')
			return "number";
		else if(ch == '-')
			return "dash";
		else if(ch == ':')
			return "dict_assign";
		else if(ch == ',')
			return "comma";

		return "unknown";
	}
}