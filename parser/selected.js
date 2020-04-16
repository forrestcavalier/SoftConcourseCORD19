import {getParserState} from "./parserState.js"
import splitWords from "./splitWords.js"
import dateFormatter from "./dateFormatter.js"

let {selector,counts,idxWords,obj,header,setFirstTime,getFirstTime,cache_Qualifiers} = getParserState()

export default function selected(selector, obj) {
	if (selector.hasOwnProperty('runPT')) {
	} else {
		/* This section runs one time */
		selector.wantPT = {};
		var hasFalse = false;
		for (var a in selector.boxes.chkPT) {
			if (selector.boxes.chkPT[a]) {
				selector.wantPT[a] = true;
			} else {
				hasFalse = true;
			}
		}
		if (!hasFalse) {
			delete selector.wantPT;
			selector.runPT = false;
		} else {
			selector.runPT = true;
		}
		selector.wantDP = {};
		var hasFalse = false;

		var DPstart = selector.boxes.dropdownDPstart;
		//DPstart = DPstart ? DPstart.substr(0,DPstart.indexOf(' (')) : '';
		var DPend = selector.boxes.dropdownDPend;
		//DPend = DPend ? DPend.substr(0,DPend.indexOf(' (')) : '';
		if (!DPstart || !DPend || DPstart > DPend) {
			// invalid
		} else {
			Object.keys(counts.yearMonths).forEach(a => {
				if (DPstart <= a && DPend >= a) {
					selector.wantDP[a] = true;
				} else {
					hasFalse = true;
				}
			});
		}
		if (!hasFalse) {
			delete selector.wantDP;
			selector.runDP = false;
		} else {
			selector.runDP = true;
		}
		selector.wantQ = {};
		var hasFalse = false;
		for (var a in selector.boxes.chkQualifiers) {
			if (selector.boxes.chkQualifiers[a]) {
				selector.wantQ[a] = true;
			} else {
				hasFalse = true;
			}
		}
		if (!hasFalse) {
			delete selector.wantQ;
			selector.runQ = false;
		} else {
			selector.runQ = true;
		}
		if (selector.boxes.searchTerms) {
			//console.log("I-253");
			selector.terms = splitWords(selector.boxes.searchTerms, true);
			/* DEBUG: handle OR, AND, double quotes, parens, etc. */

		} else {
			delete selector.terms;
		}
	}
	var isWanted = false;
	if (selector.wantPT) {
		var ar = obj['PT'];
		for (var i = 0;i < ar.length;i++) {
			if (selector.wantPT[ar[i]]) {
				isWanted = true;
				break;
			}
		}
		if (!isWanted) {
			return false;
		}
	}
	isWanted = false;
	if (selector.wantDP) {
		if (selector.wantDP[
			dateFormatter(obj,'DP')]) {
			isWanted = true;
		}
		if (!isWanted) {
			return false;
		}
	}
	isWanted = false;
	if (selector.wantQ) {
		var ar = cache_Qualifiers[obj['PMID']];
		if (ar) {
			for (var i = 0;i < ar.length;i++) {
				if (selector.wantQ[ar[i]]) {
					isWanted = true;
					break;
				}
			}
			if (!isWanted) {
				return false;
			}
		}
	}
	if (selector.terms) {
		var terms = selector.terms;
		var words = splitWords((obj.AB ? obj.AB.join(' ') : '') + ' ' + obj.TI.join(' '),false);
		for(var iWord = 1;iWord < terms.length;iWord += 2) {
			if (terms[iWord] == 'AND') {
				continue;
			} else if (words.indexOf(terms[iWord]) >= 0) {
				if (iWord + 2 < terms.length && terms[iWord+2] == 'OR') {
					iWord = terms.length;
					break;
				}
			} else {
				if (iWord + 2 < terms.length && terms[iWord+2] == 'OR') {
					/* Keep looking */
					iWord += 2;
				} else {
					break;
				}
			}
		}
		if (iWord < terms.length) {//Word not found.
			return false;
		}
	}
	return true;
}
