export default function dateFormatter(obj, code, joinargs) {
	var v = obj[code].join('\n');
	switch(v.substr(5,3)) {
		case 'Jan': v = v.substr(0,4) + "/01";break;
		case 'Feb': v = v.substr(0,4) + "/02";break;
		case 'Mar': v = v.substr(0,4) + "/03";break;
		case 'Apr': v = v.substr(0,4) + "/04";break;
		case 'May': v = v.substr(0,4) + "/05";break;
		case 'Jun': v = v.substr(0,4) + "/06";break;
		case 'Jul': v = v.substr(0,4) + "/07";break;
		case 'Aug': v = v.substr(0,4) + "/08";break;
		case 'Sep': v = v.substr(0,4) + "/09";break;
		case 'Oct': v = v.substr(0,4) + "/10";break;
		case 'Nov': v = v.substr(0,4) + "/11";break;
		case 'Dec': v = v.substr(0,4) + "/12";break;
	}
	return v;
}
