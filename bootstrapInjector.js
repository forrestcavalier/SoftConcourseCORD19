const {table:_table,button:_button,div,input} = L3.elements

function bootstrapPageWrapper(inner) {
	div({class:"container-fluid"},()=>{
		div({class:"row"},()=>{
			div({class:"col"},()=>{
				inner()
			})
		})
	})
}



function table(...args) {
	_table(...mergeOpts({class:"table table-bordered"},args))
}

function button(...args) {
	_button(...mergeOpts({class:"btn btn-primary"},args))
}

const dropdown = L3(class{
	constructor() {
		this.value
	}

	setup() {
		this.$bindOption("value")
	}

	render({options,value}) {
		console.log("dropdown")
		L3.elements.div({class:"form-group"},()=>{
			L3.elements.select({class:"form-control",value:this.$bind.value},()=>{
				L3.elements.option({value:""},"")
				for (let option of options) {
					if (typeof option === "string" || typeof option === "number") {
						L3.elements.option({value:option},option)
					} else if (typeof option === "function") {
						option()
					} else {
						L3.elements.option({value:option.value},option.text)
					}
				}
			})
		})

		//IDEA: save select to this.element, then use use postrender to set this.$actual.element.value
		if (this.$firstRender) { //FIXME: this is a hack to get value to appear properly and won't work right if options changes
			this.$rerender()
		}
	}
})

function checkbox(value,name,wrapperAttrs={}) {
	div({class:"form-check",...wrapperAttrs},()=>{
		let checkboxID = newElementID()
		input({type:'checkbox',id:checkboxID,class:"form-check-input",checked:value});
		L3.elements.label({for:checkboxID,class:"form-check-label"},name)
	})
}


function mergeOpts(optsToAdd,[a,b]) {
	if (typeof a === "object") { //not function
		return [{...a,...optsToAdd},b]
	} else {
		return [optsToAdd,a]
	}
}

function loadCSS(url) {
	return new Promise((resolve,reject) =>{
		let el = document.createElement("link")
		el.rel = "stylesheet"
		el.href = url

		el.addEventListener("load",()=>{
			resolve()
		})

		document.head.appendChild(el)
	})
}

function loadJS(url) {
	return new Promise((resolve,reject) =>{
		let el = document.createElement("script")
		el.src = url

		el.addEventListener("load",()=>{
			resolve()
		})

		document.head.appendChild(el)
	})
}

function insertBootstrap() {
	loadCSS("./css/bootstrap.min.css") //TODO: do we need this?
	loadCSS("./css/litera.min.css")
}
insertBootstrap()

let idIterator = 0
function newElementID() {
	idIterator++
	return "__el"+idIterator
}

export {table,button,dropdown,bootstrapPageWrapper,newElementID,checkbox}
