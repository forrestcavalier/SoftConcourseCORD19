import splitWords from "./parser/splitWords.js"

function termToRegexp(term) {
	let regexpCode = term.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
	let regexp = new RegExp(`\\b${regexpCode}(s\\b|\\b)`,"i")
	return regexp
}

function highlightResult(html,query,marginLen=-1,maxLen=Infinity) {
	let inTag = false
	const start = "<mark>"
	const end = "</mark>"
	let firstMatch
	let foundMatch = false
	let lastMatch
	let i = 0
	debugger
	const queryTermsRegexps = query.split(" ").map(term => termToRegexp(term))


	while (i < html.length) {
		let c = html[i]
		if (c === "<") {
			inTag = true
			i++
		} else if (c === ">") {
			inTag = false
			i++
		} else if (!inTag) {
			let foundMatchHere = false
			for (let queryTermRegexp of queryTermsRegexps) {
				queryTermRegexp.lastIndex = i
				let match = queryTermRegexp.exec(html)
				if (match && match.index === i) {
					let matchLen = match[0].length
					foundMatchHere = true
					if (!foundMatch) {
						firstMatch = i
						foundMatch = true
					}

					html = wrapInsert(i,start,html,end,i+matchLen)
					i += start.length+matchLen+end.length
					lastMatch = i
				}
			}
			if (!foundMatchHere) {
				i++
			}
		} else {
			i++
		}
		if (foundMatch && i > firstMatch+maxLen) {
			break
		}
	}

	if (marginLen === -1) {
		return html
	}

	if (foundMatch) {
		const startSubst = Math.max(html.lastIndexOf(" ",Math.max(firstMatch-marginLen,0)),Math.max(0,firstMatch-marginLen*2))
		let endSubst = html.indexOf(" ",lastMatch+query.length+marginLen)
		if (endSubst === -1) {
			endSubst = html.length
		}
		endSubst = Math.min(endSubst,lastMatch+query.length+marginLen*2)
		return substringHTML(html,startSubst,endSubst)
	} else {
		return substringHTML(html,0,maxLen)
	}
}

function wrapInsert(startI,start,str,end,endI) {
	let before = str.substring(0,startI)
	let inside = str.substring(startI,endI)
	let after = str.substring(endI)
	return before+start+inside+end+after
}

function substringHTML(html,start,end) {
	let substr = html.substring(start,end) //TODO: fix broken opening tags?
	return (start > 0 ? "..." : "")+balanceTags(substr).trim()+(end < html.length ? "..." : "")
}

const autoClosingTags = ["br","hr","meta","link"] //TODO: add more?
function balanceTags(html) {
	var tags = []

	var foundTag = false
	var inTag = false
	var tag = ""
	var tagIsClose = false
	var tagIsSelfClose = false
	var foundNonWhitespaceAfterStart = false
	var reachedTagEnd = true
	var lastTagOpenedAt = undefined
	var trimStart = 0
	for (var i = 0; i<html.length; i++) {
		var c = html[i]
		//console.log("c = ",c,"area = ",html.substring(i-5,i+5))
		if (inTag && c !== "<") {
			if (c == "/") {
				if (foundNonWhitespaceAfterStart) {
					//console.log("set selfClose = true")
					tagIsSelfClose = true
				} else {
					//console.log("set isClose = true")
					tagIsClose = true
				}
			} else {
				if (!/\s/.test(c)) {
					foundNonWhitespaceAfterStart = true
				}
				if (c === ">") {
					inTag = false
					if (!tagIsSelfClose) {
						tags.push([tagIsClose,tag.toLowerCase()])
					}
				} else {
					if (foundNonWhitespaceAfterStart) {
						if (/\s/.test(c)) {
							reachedTagEnd = true
						}
					 	if (!reachedTagEnd) {
							tag += c
						}
					}
				}
			}
		}
		if (c === "<") {
			inTag = true
			foundTag = true
			lastTagOpenedAt = i

			//do a reset here to deal with several < in a row
			tagIsClose = false
			tagIsSelfClose = false
			tag = ""
			foundNonWhitespaceAfterStart = false
			reachedTagEnd = false
		} else if (c === ">" && !inTag && !foundTag) {
			trimStart = i+1
		}
	}

	if (inTag) {
		html = html.substring(0,lastTagOpenedAt)
	}

	let toOpen = []
	let stack = [] //just tag
	for (let [close,tag] of tags) {
		if (close) {
			if (stack[stack.length-1] === tag) {
				stack.pop()
			} else {
				toOpen.unshift(tag)
			}
		} else {
			if (!autoClosingTags.includes(tag)) {
				stack.push(tag)
			}
		}
	}

	html = html.substring(trimStart)
	html = toOpen.map(tag => `<${tag}>`).join("")+html+stack.map(tag => `</${tag}>`).join("")
	return html
}

export default function highlightQueryInAbstract(query,abstract) {
	if (!query || !query.trim()) {
		return abstract
	} else {
		console.log("query = ",query)
		return highlightResult(abstract,query)
	}
}
