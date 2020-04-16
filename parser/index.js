import {getParserState} from "./parserState.js"
import selected from "./selected.js"
import splitWords from "./splitWords.js"
import dateFormatter from "./dateFormatter.js"

let {selector,counts,idxWords,obj,header,setFirstTime,getFirstTime,cache_Qualifiers} = getParserState()

function processOneLine(documentList,line) {
	line = line.replace('\r', '');
	var parseError = [];
	if (line.charCodeAt(0) == 0x20 && line.charCodeAt(1) == 0x20) {
		//		console.log("I-140b " + line);
		/* Continuation */
		if (obj.lastField != '') {
			var ar = obj[obj.lastField];
			ar[ar.length - 1] += '\n' + line.substr(6);
		} else {
			// error
		}
	} else if (line.charCodeAt(0) == 0x20) {
		if (!getFirstTime()) {
			return;
		}
		//Header
		var tField = line.substr(0, 4);
		var ar = header[tField];
		if (ar) {} else {
			ar = [];
			header[tField] = ar;
		}
		ar.push(line.substr(line.indexOf('\t') + 1));
		var cols = [];
		if (tField == ' 70a') {
			header.name = ar[0];
			document.title = header.name + " - CORD-19 citation explorer";
			//		} else if (ar.length > 1) {
		} else if (tField == ' 73a') {
			//I-73a   descriptorui    descriptorname/string   treenumber
			/* More than one of these */
			console.log("I-173a");
			cols = line.split('\t');
			header.descriptorUi = cols[1];
			header.descriptorName = cols[2];
			ar = header.treeNumbers;
			if (ar) {} else {
				ar = [];
				header.treeNumbers = ar;
			}
			ar.push(cols[3]);
		} else if (tField == ' 73b') {
			//I-73b   conceptui       descriptorui    descriptorname  annotation      termui  term    scopenote
			/* Only one of these */
			cols = line.split('\t');
			if (cols[2] != header.descriptorUi) {
				parseError.push('E-191 mismatch of descriptorui in 73a and 73b.');
			}
			header.preferredConceptUi = cols[1];
			header.scopeAnnotation = cols[4];
			header.preferredTerm = cols[6];
			header.scopeNote = cols[7];
		} else if (tField == ' 73c') {
			//I-73c   conceptui       descriptorui    descriptorname  termui  term
			header.termList = ar;
		} else if (tField == ' 73d') {
			//I-73d   descriptorui    descriptorname  relateddescriptorui     relateddescriptorname
			header.relatedConceptList = ar;
		} else if (tField == ' 73r') {
			//I-73r   conceptui       descriptorui    descriptorname  relation        termui  term
			header.relations = ar;
		} else if (tField == ' 194') {
			header.treePath = ar;
			cols = line.split('\t');
			if (header.hasOwnProperty('namesByTreeNumber')) {} else {
				header.namesByTreeNumber = {};
			}
			header.namesByTreeNumber[cols[1]] = cols[2];
		} else if (tField == ' 74t') {
			//console.log("I-132 " + line);
			cols = line.split('\t');
			header.tallyByName[cols[1]] = cols[2];
			header.tallyChildrenByName[cols[1]] = parseInt(cols[4])-parseInt(cols[2]);
		} else if (tField == ' 195') {
			header.treeChildren = ar;
		}
	} else {
		//		console.log("I-140 " + line);
		var tfield = line.substr(0, 4).replace(/ /g, '');
		if (tfield == 'PMID') {
			reportOne(documentList);
			obj = {
				lastField: '',
				raw: []
			};
		}
		obj.lastField = tfield;
		var ar = obj[obj.lastField];
		if (ar) {} else {
			ar = [];
			obj[obj.lastField] = ar;
		}
		ar.push(line.substr(6));
	}
	if (parseError.length) {
		ar = header.parseError;
		if (ar) {} else {
			ar = [];
			header.parseError = ar;
		}
		ar.push(parseError);
	}
	obj.raw.push(line);
}
/**************************************************************/
function getMeshFolderPathByName(name) {
	var folderPath = [];
	var characters = name.replace(/[^A-Za-z]/g, '');
	folderPath.push(characters.substr(0, 1).toUpperCase());

	if (characters.length > 1) {
		folderPath.push(characters.substr(0, 2).toUpperCase());
	}
	if (false) {
		if (characters.length > 2) {
			var part = characters.substr(0, 3);
			if ('con|aux|prn'.indexOf(part.toLowerCase()) >= 0) {
				part = part + '_';
			}
			folderPath.push(part).toUpperCase();
		}
	}
	//	folderPath.push(name);
	return folderPath;
}




function tally(obj) {
	if (!getFirstTime()) {
		obj._Qualifiers = cache_Qualifiers[obj['PMID']];
		return;
	}
	counts.pmid += 1;

	var thisQualifiers = {};
	for (var iMH = 0; iMH < obj.MH.length; iMH++) {
		var path = [];
		//console.log("I-216 " + obj.MH[iMH].replace(/\n/g,'\\n'));
		//		var name = obj.MH[iMH].replace('\n',' ').split('/')[0].replace('*','');
		var name = obj.MH[iMH].replace('\n', ' ').split('/')[0];
		var qualifiers = obj.MH[iMH].replace('\n', ' ').split('/').slice(1);
		for (var iq = 0; iq < qualifiers.length; iq++) {
			//			var q = name + '/' + qualifiers[iq].replace('*','');
			var q = name + '/' + qualifiers[iq];
			var tallyGroup = counts.primaryMH;
			if (q.indexOf('*') < 0) {
				//				console.log("I-336a " + q);
				tallyGroup = counts.secondaryMH;
			} else {
				//				console.log("I-336b " + q);
				thisQualifiers[qualifiers[iq].replace('*','')] = 1;
			}
			if (tallyGroup.hasOwnProperty(q)) {
				tallyGroup[q] += 1;
			} else {
				tallyGroup[q] = 1;
			}
		}
		if (qualifiers.length == 0) {
			var tallyGroup = counts.primaryMH;
			if (name.indexOf('*') < 0) {
				tallyGroup = counts.secondaryMH;
			}
			var q = name;
			if (tallyGroup.hasOwnProperty(q)) {
				tallyGroup[q] += 1;
			} else {
				tallyGroup[q] = 1;
			}
		}
	}
	obj._Qualifiers = Object.keys(thisQualifiers);
	cache_Qualifiers[obj['PMID']] = obj._Qualifiers;
	for(var a in thisQualifiers) {
		if (counts.primaryQualifiers.hasOwnProperty(a)) {
			counts.primaryQualifiers[a] += 1;
		} else {
			counts.primaryQualifiers[a] = 1;
		}
	}
	var a = dateFormatter(obj,'DP');
	var tally = counts.yearMonths;
	if (tally.hasOwnProperty(a)) {
		tally[a] += 1;
	} else {
		tally[a] = 1;
	}
	var tally = counts.publicationTypes;
	obj.PT.forEach(a => {
		if (tally.hasOwnProperty(a)) {
			tally[a] += 1;
		} else {
			tally[a] = 1;
		}
	});
}

if (false) {/* This is an example. */
	var words = splitWords(header.scopeAnnotation ? header.scopeAnnotation : '' + ' ' + header.name);
	if (getFirstTime()) {
		for(var iWords = 1;iWords < words.length;iWords += 2) {
			idxWords[words[iWords]] = iWords; // Debug: may overwrite
		}
	}
}
function reportOne(documentList) {
	if (obj.lastField || obj.PMID) {
		if (true) {//Test indexing
			var words = splitWords(obj.AB ? obj.AB.join(' ') : '' + ' ' + (obj.TI ? obj.TI.join(' '):''));
			if (getFirstTime()) {
				for(var iWords = 1;iWords < words.length;iWords += 2) {
					idxWords[words[iWords]] = iWords; /* Debug: may overwrite */
				}
			}
		}
		if (selected(selector, obj)) {
			tally(obj);
			documentList.data.push(obj);
		}
	}
}




function reportIdxWords()
{
	var keys = Object.keys(idxWords);
	console.log("I-617 " + keys.length);
	var first = {};
	keys.forEach(a => { a = a.substr(0,1) + a.substr(2,3); first[a] = 1}); //Also tried .substr(0,4)
	var keys = Object.keys(first).sort();
	console.log("I-617b " + keys.length);
	var iReport = 0;
	while(iReport < keys.length) {
		//console.log("I-617c " + keys.slice(iReport,iReport+30).join(','));
		iReport += 30;
	}

}

export {processOneLine,getMeshFolderPathByName,tally,reportOne,reportIdxWords}
export * from "./parserState.js"
export { default as selected } from "./selected.js"
export { default as dateFormatter } from "./dateFormatter.js"
