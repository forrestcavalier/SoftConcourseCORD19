class Router {
	constructor() {
		this._href = location.href
	}

	//need to call this AFTER using L3.watch, so that _onpopstate
	//has proxied this which will call watchers for this.url being changed
	addListeners() {
		window.addEventListener("popstate", this._onpopstate.bind(this))
	}

	get href() {
		return this._href
	}

	get url() {
		return new URL(this._href)
	}

	get searchParams() {
		return this.url.searchParams
	}

	navigate(href) {
		window.history.pushState({}, "", href)
		this._href = location.href
	}

	replaceHistory(href) {
		window.history.replaceState({}, "", href)
		this._href = location.href
	}

	forward() {
		window.history.go(1)
	}

	back() {
		window.history.go(-1)
	}

	_onpopstate() {
		this._href = location.href
	}
}

let routerRaw = new Router()
let router = L3.watch(routerRaw)
router.addListeners() //see above for why this has to be called for routerRaw

function lnk(options, inner) {
	let to = options.to || options.href
	options.href = to
	options.to = undefined
	options.onclick = (evt) => {
		evt.preventDefault()
		router.navigate(to)
	}

	L3.elements.a(options, inner)
}
function getRouter() {
	return router
}

export {getRouter,lnk}
