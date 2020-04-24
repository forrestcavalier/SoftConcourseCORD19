import {getParserState} from "./parserState.js"
import splitWords from "./splitWords.js"
import dateFormatter from "./dateFormatter.js"

let {selector,counts,idxWords,obj,header,setFirstTime,getFirstTime,cache_Qualifiers} = getParserState()

function searchParse(s)
{
	//DEBUG: should adjacent words not enclosed in double quotes get automatically put in double quotes?
	var parts = s.replace(/\(/g,' ( ').replace(/\)/g,' ) ').split(' ');
	var i = 0;
	while(i < parts.length) {
		if (parts[i]=='') {
			parts.splice(i,1);
		} else if (parts[i].charCodeAt(0) == 0x22) {
			var i2 = i+1;
			while(i2 < parts.length) {
				parts[i] += ' ' + parts[i2];
				if (parts[i2].substr(parts[i2].length-1)=='\"') {
					parts.splice(i2,1);
					break;
				}
				parts.splice(i2,1);
			}
//			WScript.Echo('I-19 ' + i2 + ' of ' + parts.length);
			if (i2 >= parts.length) {
				parts[i] += '\x22'; /* Force close */
			}
			parts[i] = parts[i].replace(/ \( /g,'(').replace(/ \) /g,')');
			i++;
		} else {
			//ELSE: HANDLE punctuation like splitWords does.
			if (parts[i]=='OR' || parts[i]=='AND' || parts[i]=='NOT') {
			} else {
				parts[i] = parts[i].toLowerCase();
			}
			i++;
		}
	}
	return parts;
}

function hasWord(word, list)
{
	return list.indexOf(word) >= 0;
}
function searchReduce(parts,iStart,iStop,evalTerm,args)
{
	var i = iStart;
	do {
		if (0) {//For debugging
			var show = '';
			show = parts.slice(0,iStart).join('|');
			show += '[';
			show += parts.slice(iStart,iStop).join('|');
			show += ']';
			show += parts.slice(iStop).join('|');
			WScript.Echo("I-67 " + show);
		}
		if (parts[i]=='(') {
			/* Search forward */
			var i2 = i+1;
			var nest = 1;
			while(nest > 0 && i2 < iStop) {
				if (parts[i2] == '(') {
					nest++;
				} else if (parts[i2] == ')') {
					nest--;
				}
				i2++;
			}
			parts.splice(i2-1,1);
			parts.splice(i,1);
			searchReduce(parts,i,i2-2,evalTerm,args);
			iStop -= i2-i-1;
		} else if (parts[i]=='NOT') {
			searchReduce(parts,i+1,iStop,evalTerm,args);
			//WScript.Echo('I-87 ' + parts.join('|'));
			if (parts[i+1]===false) {
				parts[i+1] = true;
			} else {
				parts[i+1] = false;
			}
			parts.splice(i,1);
			iStop = i+1;
			
		} else if (parts[i]===true || (true==(parts[i] = evalTerm(parts[i],args)))) {
			if (i + 1 < iStop) {
				if (parts[i+1] == 'OR') {
					parts.splice(i+1,iStop-i-1); /* Short circuit */
					iStop = i+1;
				} else if (parts[i+1] == 'AND') {
					parts.splice(i,2);
					iStop -= 2;
				} else {
					parts.splice(i,1);
					iStop -= 1;
				}
			}
		} else {
			if (i + 1 < iStop) {
				if (parts[i+1] != 'OR') {
					parts.splice(i+1,iStop-i-1); /* Short circuit */
					iStop = i+1;
				} else {
					parts.splice(i,2);
					iStop -= 2;
				}
			}
		}
	} while(iStop > iStart+1);
	if (parts[iStart]!==true && parts[iStart]!==false) {
		parts[iStart] = evalTerm(parts[iStart],args);
	}
}

export default function selected(selector, obj) {
	if (selector.hasOwnProperty('runPT')) {
		selector.cpmid++
	} else {
		selector.cpmid = 1
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

		let DPstartTime = new Date(DPstart).getTime()
		let DPendTime = new Date(DPend).getTime()
		if (!DPstart || !DPend || DPstartTime > DPendTime) {
			// invalid
		} else {
			console.log("counts.yearMonths = ",counts.yearMonths)
			Object.keys(counts.yearMonths).forEach(a => {
				let aDate = (new Date(a.replace(/\//g,"-")))
				if (DPstartTime <= aDate.getTime() && aDate.getTime() <= DPendTime) {
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
		/* MeSH qualifiers */
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
			//All of them were marked. No need to runQ.
			delete selector.wantQ;
			selector.runQ = false;
		} else {
			selector.runQ = true;
		}
		if (selector.boxes.searchTerms) {
			//console.log("I-253");
            selector.terms = searchParse(selector.boxes.searchTerms, true);
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
	if (selector.runQ) {
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
		var terms = selector.terms.slice(0);
		var words = splitWords((obj.AB ? obj.AB.join(' ') : '') + ' ' + obj.TI.join(' '),false);
        searchReduce(terms,0,terms.length,hasWord,words);
        if (terms[0]===true) {
            return true;
		} else {
			return false;
		}
	}
	return true;
}
