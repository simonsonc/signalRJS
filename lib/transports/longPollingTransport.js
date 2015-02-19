'use strict';

var fs = require('fs');
var url = require('url');
var path = require('path');
var TRANSPORT_TYPES = require('./transportTypes');
var messageFactory = require('../common/messageFactory');
var ClientManager = require('../clientManagement/clientManager');

module.exports = {
	_connectionManager : null,
	_connectionDetails : {
		"MessageId": + new Date(),
		"LongPollDelay": 0,
		"Initialized": true,
		"Messages" : []
	},
	canConnect : function(req){
		if(req.query.transport === TRANSPORT_TYPES.longPolling)
			return true;
		return false;
	},
	hasConnectionToken : function(connectionToken){
		return this._connectionManager.get(connectionToken);
	},
	init : function(){
		this._connectionManager = new ClientManager();
	},
	connect : function(req,res){
		res.writeHead(200, {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-cache'
		});
		res.write(messageFactory.connectionResponse(this._connectionDetails));
		res.end();
		res.didSend = true;
		this._connectionManager.put(req.query.connectionToken,res);
	},
	poll : function(req,res){
		var self = this;
		this._connectionManager.put(req.query.connectionToken,res);
		setTimeout(function(){
			self._writeResponse(res,[]);
		},30000);
	},
	broadcast : function(messageData) {
		var self = this;
		this._connectionManager.getAll(function(clients){
			clients.forEach(function(client){
				self._writeResponse(client,messageData);
			});
		});
	},
	_writeResponse : function(res,messageData){
		if(res.didSend) return;
		res.didSend = true;
		res.writeHead(200, {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-cache'
		});
		res.write(messageFactory.message(messageData));
		res.end();
	},
	abort : function(connectionToken){
		this._connectionManager.del(connectionToken);	
	}
};