{
	"name": "hasCode.com Blog Search",
	"description": "Search the hasCode.com Blog for articles for a given tag using /hascode tag",
	"key": "com.hascode.hc.blogsearch",
	"links": {
		"homepage": "http://www.hascode.com/",
		"self": "http://www.hascode.com/"
	},
	"capabilities": {
		"hipchatApiConsumer": {
			"scopes": [
			"send_notification",
			"view_messages"
		]},
		"installable": {
			"callbackUrl": "http://c07269ba.ngrok.io/install"
		},
		"webhook": {
			"url": "http://c07269ba.ngrok.io/message",
			"pattern": "^/hascode .+",
			"event": "room_message",
			"name": "Message Listener"
		}
	}
}