export default function splitWords(phrase, bSearching)
{
	var words = [];
	var p = 0;
	var lastp =0;
	var wordchars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-";
	while(p < phrase.length) {
		lastp = p;
		while (p < phrase.length) {
			var code = phrase.charCodeAt(p);
			if (code >= 0x41) {
				if (code <= 0x5a) {
				} else if (code >= 0x61 && code <= 0x7a) {
				} else {
					break;
				}
			} else if (code <= 0x39) {
				if (code >= 0x30 || code == 0x2d) {
				} else {
					break;
				}
			}
			p++;
		}

		if (lastp == 0) {
			words.push("");
		}
		if (p > lastp) {
			/* Got a string of alphanumerics */
			if (words.length > 1 && (words[words.length-1]=="'" || words[words.length-1]=="’")) {
				/* Contraction */
				var prev = words[words.length-2];
				if (phrase.substr(lastp,p-lastp).toLowerCase() == 't') {
					if (prev.substr(prev.length-1).toLowerCase() == 'n') {
						words[words.length-2] = prev.substr(0,prev.length-1);
						lastp -= 2;
					}
					words.push(phrase.substr(lastp,p-lastp).toLowerCase());
					words.push("");
				} else {
					words.push(phrase.substr(lastp,p-lastp).toLowerCase());
					words.push("");
				}
			} else {
				let word = phrase.substr(lastp,p-lastp).toLowerCase();
				if (bSearching && (word == 'or' || word == 'and')) {/* DEBUG: if not in double-quotes */
					words.push(word.toUpperCase());
				} else {
					words.push(word.toLowerCase());
				}
				words.push("");
			}
		}
		if (p < phrase.length) {
			/* Punctuation */
			words[words.length-1] += phrase.substr(p,1);
		}
		p++;
	}
	//WScript.Echo("I-90 " + words.join(';'));
	return words;
}
