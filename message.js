'use strict'

const moment = require('moment')
const round = require('lodash.round')
const distribution = require('sainte-lague')
const chart = require('parliament-svg')
const str = require('virtual-dom-stringify')
const converter = require('svg2png')

const instituteNames = {
    allensbach: 'Allensbach',
    emnid: 'Emnid',
    forsa: 'Forsa',
    politbarometer: 'Forschungsgruppe Wahlen',
    gms: 'GMS',
    dimap: 'Infratest Dimap',
    insa: 'INSA',
}
const partyNames = {
	union: 'CDU/CSU',
	spd: 'SPD',
	'grüne': 'Grüne',
	linke: 'Linke',
	fdp: 'FDP',
	afd: 'AfD',
	sonstige: 'Sonstige'
}
const spectrum = ['linke', 'spd', 'grüne', 'fdp', 'union', 'afd']
const colours = {
	linke: '#a08',
	spd: '#e02',
	'grüne': '#0b2',
	union: '#333',
	afd: '#0ae',
	fdp: '#fd0'
}

const threshold = (results) => {
	const res = Object.assign({}, results)
	delete res.sonstige
	for(let party in res){
		if(res[party] < 0.05) delete res[party]
	}
	return res
}

const chartAdapter = (results) => {
	const res = {}
	for(let party of spectrum){
		res[party] = {
			seats: results[party],
			colour: colours[party]
		}
	}
	return res
}

const toPercent = (result) => round(result*100, 2) + ' %'

const pollText = (poll) => {
	let text = instituteNames[poll.institute] + ' - ' + moment(poll.date).format('DD.MM.YYYY') + '\n\n'
	for(let party in poll.results){
		text += partyNames[party] + ': ' + toPercent(poll.results[party]) + '\n'
	}
	text += '\n'
	text += poll.sampleSize + ' Befragte, ' + poll.period
	return text
}

const seatText = (poll) => {
	const bundestag = distribution(threshold(poll.results), 598)
	let text = 'Mögliche Sitzverteilung im Bundestag (598 Abgeordnete):\n\n'
	for(let party in bundestag){
		text += partyNames[party] + ': ' + bundestag[party] + '\n'
	}
	text += '\n'
	return text
}

const chartImage = (poll) => converter(new Buffer(str(chart(chartAdapter(distribution(threshold(poll.results), 598))))), {height: 1000, width: 2000})

module.exports = {pollText, seatText, chartImage}