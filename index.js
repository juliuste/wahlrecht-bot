'use strict'

const telegramBot = require('node-telegram-bot-api')
const config = require('config')
const sort = require('lodash.sortby')
const wahlrecht = require('wahlrecht')
const level = require('level')
const equal = require('deep-equal')
const db = level('subscribers', {valueEncoding: 'json'})

const token = config.token
const bot = new telegramBot(token, {polling: true})
const message = require('./message')

let currentPoll

let subscribers

const poll = () => {
	return wahlrecht.all()
	.then((r) => sort(r, 'date').reverse()[0])
}

db.get('poll', (err, value) => {
	if(!err) currentPoll = value || null
})

db.get('subs', (err, value) => {
	if(!err) subscribers = new Set(value) || new Set()
	else subscribers = new Set()
})


const subscribe = (bot) => (msg) => {
	if(!subscribers.has(msg.chat.id)){
		subscribers.add(msg.chat.id)
		db.put('subs', Array.from(subscribers))
		help(bot)(msg)
		bot.sendMessage(msg.chat.id, "WahlrechtBot aktiviert.")
		poll().then((p) => send(bot)(msg.chat.id, p))
	}
}

const unsubscribe = (bot) => (msg) => {
	subscribers.delete(msg.chat.id)
	db.put('subs', Array.from(subscribers))
	bot.sendMessage(msg.chat.id, "WahlrechtBot deaktiviert.")
}

const help = (bot) => (msg) => {
	bot.sendMessage(msg.chat.id, "/start zum Aktivieren\n/stop zum Deaktivieren\n/help für Hilfe")
}

const send = (bot) => (id, p) => {
	bot.sendMessage(id, message.pollText(p))
	bot.sendMessage(id, message.seatText(p))
	bot.sendMessage(id, message.coalitionText(p))
	message.chartImage(p).then((buffer) => bot.sendPhoto(id, buffer, {caption: 'Mögliche Sitzverteilung im deutschen Bundestag'}))
}

const sendAll = (bot) => (p) => {
	for(let subscriber of subscribers.values()){
		if(subscriber) send(bot)(subscriber, p)
	}
}

const updatePoll = (bot) => () => {
	poll().then((p) => {
		if(!currentPoll || !equal(currentPoll, p)){
			currentPoll = p
			db.put('poll', p)
			sendAll(bot)(p)
		}
	})
}

setInterval(updatePoll(bot), 60*60*1000)

bot.onText(/\/start/, subscribe(bot))
bot.onText(/\/stop/, unsubscribe(bot))
bot.onText(/\/help/, help(bot))