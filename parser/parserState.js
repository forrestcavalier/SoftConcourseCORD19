import HeaderInitial from "./HeaderInitial.js"

let selector
let counts
let idxWords
let cache_Qualifiers
let obj
let header
let firstTime = false;

function reset_selector() {
	selector = {boxes:null}
}
function reset_counts() {
	counts = {
		pmid: 0
		,primaryMH: {}
		,secondaryMH: {}
		,primaryQualifiers: {}
		,publicationTypes: {}
		,yearMonths: {}
	};
}
function reset_idxWords() {
	idxWords = {};
}
function reset_cache_Qualifiers() {
	cache_Qualifiers = {}
}
function reset_obj() {
	obj = {
		lastField: '',
		raw: []
	};
}

function reset_header() {
	console.log("reset_header")
	header = new HeaderInitial()
}

function initParserState() {
	console.log("init parser state")
	reset_selector()
	reset_counts()
	reset_idxWords()
	reset_cache_Qualifiers()
	reset_obj()
	reset_header()
}

function setFirstTime(val) {
	firstTime = val
}

function getFirstTime() {
	return firstTime
}

let parserStateInitialized = false
function getParserState() {
	if (!parserStateInitialized) {
		initParserState()
		parserStateInitialized = true

	}
	return {selector,counts,idxWords,obj,header,setFirstTime,getFirstTime,cache_Qualifiers}
}

export {
	getParserState
	,reset_selector
	,reset_counts
	,reset_idxWords
	,reset_cache_Qualifiers
	,reset_obj
	,reset_header
}
