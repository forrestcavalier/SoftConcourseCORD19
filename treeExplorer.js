const {
	pre,
	div,
	span,
	p,
	br,
	h1,
	tr,
	th,
	td,
	input
} = L3.elements

import {
	processOneLine,getMeshFolderPathByName,tally,reportOne,reportIdxWords

	,getParserState
	,reset_selector
	,reset_counts
	,reset_idxWords
	,reset_cache_Qualifiers
	,reset_obj
	,reset_header

	,selected

	,dateFormatter
} from "./parser/index.js"

import highlightQueryInAbstract from "./highlightQueryInAbstract.js"

let {selector,counts,idxWords,obj,header,setFirstTime,getFirstTime,cache_Qualifiers} = getParserState()

import {table,button,dropdown,bootstrapPageWrapper,newElementID,checkbox} from "./bootstrapInjector.js"

import {getRouter,lnk} from "./router.js"
let router = getRouter()


const querystringKeyToSearchStateKey = {
	"startDate":"dropdownDPstart"
	,"endDate":"dropdownDPend"
	,"filterText":"searchTerms"
}
const app = L3(class {
	setup() {
		this.rawData = null
		this.rawDataFromPath = ""
		this.loading = false
		this.updateSearchStateFromQuerystring()
		this.loadData()
		this.myCheckbox = false;
		this.chkCol = { 'PT':true,'DP':true,'MH*':true};
		this.chkPT = {};
		this.chkDP = {};
		this.chkQualifiers = {};

		this.$watch(L3.bindBase(router)._href,()=>{ //TODO: this SHOULD be in render(), but the ThirdLaw for replacing bindings on rerender is broken
			this.updateSearchStateFromQuerystring()
		})
	}

	get currentPmedPath() {
		let pmedPathStart = router.href.lastIndexOf("#")
		let pmedPath = "C/Co/Coronavirus Infections"
		if (pmedPathStart !== -1) {
			pmedPath = router.href.substring(pmedPathStart+1)
		}
		return pmedPath
	}

	get isDataUpToDate() {
		return this.currentPmedPath === this.rawDataFromPath
	}

	async loadData() {
		if (this.loading || this.isDataUpToDate) {
			return
		}
		this.loading = true
		//const url = "/dadLinguistics/apc20200411/Virus%20Diseases.pmidx"
		//const url = "/dadLinguistics/apc20200411b/Coronavirus Infections.pmidx"

		let pmedPath = this.currentPmedPath
		this.rawData = await (await fetch(import.meta.url+`/../pubmed.out/${pmedPath}.pmidx`)).text()
		this.rawDataFromPath = pmedPath
		setFirstTime(true)
		reset_cache_Qualifiers()
		this.loading = false
	}

	updateSearchStateFromQuerystring() {
		console.log("update: querystring -> search state")
		let url = router.url

		for (let querystringKey in querystringKeyToSearchStateKey) {
			let searchStateKey = querystringKeyToSearchStateKey[querystringKey]

			let querystringVal = url.searchParams.get(querystringKey)
			if (querystringVal) {
				console.log("set this."+searchStateKey+" = "+querystringVal)
				this[searchStateKey] = querystringVal
				if (searchStateKey === "searchTerms") {
					this.inputSearchTerms = querystringVal
				}
			}
		}
	}

	updateQuerystringFromSearchState() {
		console.log("update: search state -> querystring")
		let url = new URL(router.href)
		for (let querystringKey in querystringKeyToSearchStateKey) {
			let searchStateKey = querystringKeyToSearchStateKey[querystringKey]
			if (this[searchStateKey]) {
				url.searchParams.set(querystringKey,this[searchStateKey])
			} else {
				url.searchParams.delete(querystringKey)
			}
		}
		router.replaceHistory(url.href)
	}

	doFilter() {
		this.searchTerms = this.inputSearchTerms;
	}
	bulkPT() {
		var v;
		for(var a in this.chkPT) {
			if (typeof(v)==="undefined") {
				v = !this.chkPT[a];
			}
			this.chkPT[a] = v;
		}
	}
	bulkQ() {
		var v;
		for(var a in this.chkQualifiers) {
			if (typeof(v)==="undefined") {
				v = !this.chkQualifiers[a];
			}
			this.chkQualifiers[a] = v;
		}
	}
	bulkDP() {
		var v;
		for(var a in this.chkDP) {
			if (typeof(v)==="undefined") {
				v = !this.chkDP[a];
			}
			this.chkDP[a] = v;
		}
	}
	render() {bootstrapPageWrapper(()=>{
		console.log("rerender")
		//console.log("router = ", router)

		if (!this.isDataUpToDate) {
			this.loadData()
		}
		var documentListView = {//Computed based on other state, and not editable, so it is a variable, not a member of the class.
			headers: [
			  {
				text: 'Title',
				align: 'start',
				//sortable: false,
				value: 'TI',
			  },
			  { text: 'Type', value: 'PT' },
			  { text: 'Date', value: 'DP' },
			  { text: 'PMID', value: 'PMID' },
			]
			,
			data: []
		};
		if (this.loading) {
			p("loading...")
		} else {
			this.updateQuerystringFromSearchState()

			reset_obj()
			if (getFirstTime()) {
				console.log("reset header first time")
				reset_header()
				reset_counts()
			}
			//		console.log("got rawData: ",this.rawData.length)
			selector.boxes = this;
			delete selector.runPT;
			selector.cpmid = 0
			this.rawData.split("\n").forEach(line => processOneLine(documentListView,line))
			//selector.runDP = true
			//selector.wantDP = {}
			//console.log("running reportOne. selector = ",selector,"boxes = ",this.$actual)
			reportOne(documentListView); /* Make sure last one is reported */



			if (getFirstTime()) {
				reportIdxWords();
				Object.keys(counts.publicationTypes).sort().forEach(pt => {
					this.chkPT[pt] = true;
				});
				Object.keys(counts.primaryQualifiers).sort().forEach(a => {
					this.chkQualifiers[a] = true;
				});
				Object.keys(counts.yearMonths).sort().forEach(a => {
					this.chkDP[a] = true;
				});
				setFirstTime(false)
			}

			/* Now show totals */
	//		console.log("I-330 PMID=" + counts.pmid);
			var tallyGroup = counts.primaryMH;
			for (var a in tallyGroup) {
				var amt = "     " + tallyGroup[a];
				amt = amt.substr(amt.length - 5);
				//console.log("I-342 MH " + amt + " " + a);
			}
			var tallyGroup = counts.secondaryMH;
			for (var a in tallyGroup) {
				var amt = "     " + tallyGroup[a];
				amt = amt.substr(amt.length - 5);
				//console.log("I-342b MH " + amt + " " + a);
			}

			h1("CORD-19 PubMed citation explorer: " + header.preferredTerm)
			document.title = "CORD-19 citation explorer - "+header.preferredTerm
			/* Turn header into array. */
			var displayData = [];
			var row = [header.name, header.preferredTerm.split('\t')[6]];
			displayData.push(row);
			row = [header.preferredTerm.split('\t')[1],
				/* included concepts goes here */
			];

			//console.log(JSON.stringify(header, null, 4));

			function conceptUri(name) {
				return '#' + getMeshFolderPathByName(name).join('/') + '/' + name;
			}
			var scopeAnnotation = '';
			if (header.scopeAnnotation) {
				scopeAnnotation = '<br><small><b>Note: </b>' + header.scopeAnnotation + '</small>';
			}
			var conceptListHtml = '<b>Included concepts:</b>';
			if (header.termList) {
				header.termList.forEach(v => {
					conceptListHtml += v.split('\t')[5] + '; ';
				});
			}
			if (header.relatedConceptList) {
				/* DEBUG: sort order */
				conceptListHtml += "<p><b>See Also:</b>"
				header.relatedConceptList.forEach(v => {
					var name = v.split('\t')[3];
					conceptListHtml += ' [<a href=\x22' + conceptUri(name) + '\x22>' + name + '</a>] ';
				});
			}
			var seenChild = {};
			var childList = [];
			if (header.treeChildren) {
				header.treeChildren.forEach(v => {
					var cols = v.split('\t');
					if (seenChild[cols[1]]) {} else {
						seenChild[cols[1]] = 1;
						childList.push([conceptUri(cols[1]), cols[1]]);
					}
				});
			}

			header.meshUrl = 'https://meshb.nlm.nih.gov/record/ui?ui=' + header.descriptorUi;

			function renderRow(iPath) {
				var treeNumberSegments = header.treeNumbers[iPath].split('.');
				console.log("iPath =", iPath, "treeNumberSegments = ", treeNumberSegments)
				for (let iSegment = treeNumberSegments.length - 1; iSegment > 0; iSegment--) {
					if (iSegment == treeNumberSegments.length - 1) {
						L3.elements.small("[see] ")
					} else {
						L3.elements.small(" [under] ")
					}
					var name = header.namesByTreeNumber[treeNumberSegments.slice(0, iSegment).join('.')];

					lnk({
						href: conceptUri(name)
					}, name);
					//span("test");
					span(" (" + header.tallyByName[name] + "+" + header.tallyChildrenByName[name] + ")");
				}
			}


			table({
				border: 1
			}, () => {
				/*
				tr(() => {
					th({
						colspan: 2
					}, "MeSH Descriptor Data 2020 (Link [U.S. NLM])")
				})
				*/
				tr(() => {
					th({style: "align:left"},"MeSH Descriptor Name:");
					td(() => L3.elements.h2(header.preferredTerm));
				})
				tr(() => {
					th({style: "align:left"}, "Scope Note:")
					td(header.scopeNote + scopeAnnotation)
				})
				tr(() => {
					td(() => {
						span("Source: ")
						L3.elements.small(() => {
							L3.elements.a({
								href: header.meshUrl
							}, "[MeSH]")
						});
					});

					td(conceptListHtml)
				})
				tr(() => {
					td({
						colspan: 2
					}, () => {
					p('This page shows PubMed citations from the <A HREF="https://pages.semanticscholar.org/coronavirus-research">CORD-19 Open Research Data Set</A> which have PubMed MeSH fields that match this MeSH Descriptor Name.');
					p('Tip: You can navigate to related MeSH descriptors (Narrower and More general) to locate articles of interest. Numbers in parenthesis (e.g.159+39) following these links are the article counts + the counts at subheadings.');
					}
				   )
				})
				tr(() => {
					th("Narrower MeSH Descriptors");
					th("More general MeSH Descriptors")
				})
				tr(() => {
					td({
						rowspan: header.treeNumbers.length,
						valign: "top"
					}, () => {
						childList.forEach((v,i) => {
						if (i != 0) {
							L3.elements.br();
						}
						lnk({href:v[0]},v[1]);
						span(" (" + header.tallyByName[v[1]] + "+" + header.tallyChildrenByName[v[1]] + ")" + ";");
					})});
					td(() => {
						renderRow(0)
					})
				})

				//console.log("header.treeNumbers = ", header.treeNumbers)
				for (let iPath = 1; iPath < header.treeNumbers.length; iPath++) {
					tr(() => {
						td(() => {
							renderRow(iPath)
						})
					})
				}
			})

			window.toggle_abstract = function(iRow) {
				var el = document.getElementById('row' + iRow);
				el = el ? el.getElementsByTagName('div')[0] : null;
				if (el) {
					el.style.display = el.style.display ? '' : 'none';
				}
			}
			var iRow = 1;
			let titleFormatter = (obj, code, joinargs) => {
				var title = obj[code] ? obj[code] : ['[No title available]'];
				var v = '<A target=_blank href="https://pubmed.ncbi.nlm.nih.gov/' + obj['PMID'] + '\x22>' + title.join(' ') + '</a>';
				if (obj['AB']) {
					v += ` <button class="btn btn-secondary btn-sm" onclick="toggle_abstract(${iRow})">abstract</button>${(this.chkCol['AB'] ? "<div style='margin-top:8px'>" : '<div style="display:none;margin-top:8px">')}`
						+ highlightQueryInAbstract(this.searchTerms,(obj['AB'] ? obj['AB'] : []).join('\n').replace(/</g,'&lt;'))
						+ '</div>';
				}
				if (this.chkCol['MH*'] && obj['MH']) {
					var v2 = '<br>';
					var v3 = '';
					var check = header.name + '/';
					obj['MH'].forEach(mh => {
						if (mh.indexOf('*')>=0) {
							var nostar = mh.replace('*','');
							if (mh != header.name && nostar.indexOf(check) < 0) {
								if (v3 == '') {
									v3 = '<br>Also under: '
								}
								v3 += '[' + '<A href=\x22' + conceptUri(nostar.split('/')[0]) + '\x22>' + mh + '</a>] '
							} else {
								/* This header */
								v2 += mh.replace(check,'').split("/").map(meshHeading => `<span class="badge badge-${meshHeading.startsWith("*") ? "info" : "secondary"} badge-pill">${meshHeading}</span>`).join(" ")
							}
						}
					});
					v += v2 + v3;
				}
				return v;
			}
			p("<b>This heading has " + selector.cpmid + " documents in CORD-19 PubMed.</b> Use the filters to exclude citations by type, MeSH qualifier and/or year.  (Citations which fail to match one or more filter columns are excluded.)<br>");
			var colList = [
						['Title','TI',titleFormatter]
						,['Pub.Type','PT',';<br>']
						,['PMID','PMID']
						,['Abstract','AB']
						,['MeSH category','MH*']
						,['Author','FAU']
						,['Journal','JT']
						,['Journ.','TA']
						,['Other Terms','OT']
						,['Date','DP', dateFormatter]
						,['Language','LA']
						,['Article ID','AID']
						];
			table({border:1}, () => {
				tr( () => {
					th('Filter by Publication Type');
					th('Filter by MeSH qualifiers');
					th('Filter by Date Published');
				});
				tr( () => {

					td({valign:'top'}, () => {
						button({onclick:this.bulkPT.bind(this)},'Toggle All');
						Object.keys(counts.publicationTypes).sort().forEach(pt => {
							checkbox(this.$bind.chkPT[pt],pt + ' (' + counts.publicationTypes[pt] + ')')
						});
					});
					td({valign:'top'}, () => {
						button({onclick:this.bulkQ.bind(this)},'Toggle All');
						Object.keys(counts.primaryQualifiers).sort().forEach(a => {
							checkbox(this.$bind.chkQualifiers[a],a + ' (' + counts.primaryQualifiers[a] + ')')
						});
					});
					td({valign:'top'}, () => {
						//L3.elements.button({onclick:this.bulkDP.bind(this)},'Toggle All');
						let options = Object.keys(counts.yearMonths).sort().reverse();
						options = options.map(v => ({
							text:v +' (' + counts.yearMonths[v] + ')'
							,value:v
						}));
						if (getFirstTime()) { //This isn't getting run for some reason...
							this.dropdownDPstart = options[0];
							this.dropdownDPend = options[options.length-1];
							console.log("I-818");
						}
						L3.elements.br();
						span('Start:');input({type:"date",value:this.$bind.dropdownDPstart})
						L3.elements.br();
						span('End:');input({type:"date",value:this.$bind.dropdownDPend})

/*						Object.keys(counts.yearMonths).sort().forEach(a => {
							L3.elements.br();
							input({type:'checkbox',checked:this.$bind.chkDP[a]});
							span(a + ' (' + counts.yearMonths[a] + ')');
						});
*/
					});
				});
			});


			L3.elements.h3("Show Fields")
			L3.elements.form({class:"form-inline"},()=>{
				colList.forEach(column => {
					var [name,code] = column;
					if (code != 'TI') {
						checkbox(this.$bind.chkCol[code],name,{style:{paddingRight:"12px"}})
					}
				});
			})

			L3.elements.h3("Filter by Text")
			div({class:"form-group"},()=>{
				input({size:40
					,type:'text'
					,value:this.$bind.inputSearchTerms
					,onkeydown:evt=>{
						if (evt.key === "Enter") {
							evt.preventDefault()
							this.doFilter()
						}
					}
				});
				button({style:"margin-left:10px",onclick:this.doFilter.bind(this)},'Filter');
			})



			//span("showPMID: " + this.myCheckbox);

			/* Show the table */
			var outputView = [];
			documentListView.headers = [];
			colList.forEach(column => {
				var [name,code,joiner,joinerargs] = column;
				if (code == 'AB') return;
				if (code == 'MH*') return; // no column header.
				if (code == 'TI' || this.chkCol[code]) {
					documentListView.headers.push({
						text: name+(code === "DP" ? " ↓" : "")
						, value: code
						, join:(joiner && joiner.bind ?joiner.bind(this) : joiner)
						,joinargs:joinerargs
						,fixedWidth:code === "PT" ? "170px" : undefined
					});
				}
			});

			var columnHTML = "<th>#</th>";

			outputView.push('<table class="table table-hover">');
			documentListView.headers.forEach( header => {
				columnHTML += `<th ${header.fixedWidth ? `style="width:${header.fixedWidth}"` : ""}>${header.text}</th>`
			});
			outputView.push('<thead class="thead-dark">')
			outputView.push('<tr>'+columnHTML);
			outputView.push('</thead>')
			function compareDates(a,b) {
				let [yearA,monthA=0] = a.split("/").map(v => parseInt(v))
				let [yearB,monthB=0] = b.split("/").map(v => parseInt(v))
				if (yearA !== yearB) {
					return yearA - yearB
				} else {
					return monthA - monthB
				}
			}

			documentListView.data.sort((a,b)=>compareDates(dateFormatter(b,"DP"),dateFormatter(a,"DP"))).forEach( obj => {
				var columns = [];
				documentListView.headers.forEach( header => {
					var v = '';
					try {
						if (typeof(header.join)=="function") {
							v = header.join(obj,header.value,header.joinargs);
						} else if (typeof(header.join)=="string") {
							v = obj[header.value].join('\n').replace(/</g,'&lt;').replace(/\n/g, header.join);
						} else {
							v = obj[header.value];
							v = v ? v.join('\n').replace(/</g,'&lt;').replace('\n', '<br>') : '';
						}
					} catch(e) {
						console.log("table render err =",e)
					}
					columns.push(v);
				});
				outputView.push('<tr id=\"row' + iRow + '"><td>'+iRow+"<td>"+ columns.join('<td>'));
				iRow++;
			});
			outputView.push('</table>');

			L3.elements.i("Found "+documentListView.data.length+" documents.")
			if (documentListView.data.length > 0) {
				div(outputView.join('\n'));
			}
			p('Copyright notice: MeSH descriptor data comes from the U.S. NLM. Click the source link to go to the MeSH website. PubMed citation data was last updated on 2020/04/14, consisting of 37713 citations. Pubmed Citation explorer version v20200424.');
		}
	})}
})

app.$mountBody()
