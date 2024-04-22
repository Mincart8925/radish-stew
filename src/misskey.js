const ViewRange = {
	Global: "public",
	Home: "home",
	Private: "followers"
}

class MisskeyTools {
	static token;
	static instance;
	static userid;

	constructor(mkinstance, mktoken, mkuserid) {
		this.token = mktoken;
		this.instance = new URL(mkinstance);
		this.userid = mkuserid;
	}

	async createNote(notetext, options) {
		const configuration = {
			cw: null,
			localOnly : false,
			visibility: ViewRange.home
		}

		const noteoptions = Object.assign(configuration, options);
		let noteobject = {
			i: this.token,
			text: notetext
		}
		noteobject = Object.assign(noteobject, noteoptions);

		const result = await this.#_APIFETCH("notes/create", noteobject);
		return result.json();
	}

	async getFollowingChart() {
		const param = {
			span: "day",
			limit: 2,
			userId: this.userid
		}

		const result = await this.#_APIFETCH("charts/user/following", param);
		return result.json();
	}

	async getNoteChart() {
		const param = {
			span: "day",
			limit: 2,
			userId: this.userid
		}

		const result = await this.#_APIFETCH("charts/user/notes", param);
		return result.json();
	}

	async #_APIFETCH(endpoint, content) {
		let url = new URL(`api/${endpoint}`, this.instance);

		return await fetch(url.href, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(content)
		})
	}
}

export {MisskeyTools, ViewRange};
