import { MisskeyTools } from "./misskey.js";

class TemplateEngine {
	#TokenizerState = {
		FirstState: 0,

		LeftBraketState: 1,
		RightBraketState: 2,
		VariableState: 3,
		CharState: 4,
	}

	#TokenType = {
		Char: 0,
		Variable: 1,
	}

	constructor(){
	}

	#tokenize(input){
		let tokenizerstate = this.#TokenizerState.FistState;
		let offset = 0;
		let templatelen = input.length;
		let TokenizeResult = [];

		while(offset < templatelen) {
			switch(tokenizerstate){
				case this.#TokenizerState.FistState:
					if (input[offset] == "{") {
						tokenizerstate = this.#TokenizerState.LeftBraketState;
					} else {
						tokenizerstate = this.#TokenizerState.CharState;
					}
					break;

				case this.#TokenizerState.CharState:
					let charchunk = "";
					while(offset < templatelen){
						if (input[offset] == "{") {
							tokenizerstate = this.#TokenizerState.LeftBraketState;
							break;
						} else if (input[offset] == "}"){
							tokenizerstate = this.#TokenizerState.RightBraketState;
							break;
						} else {
							charchunk += input[offset];
							offset++;
						}
					}

					TokenizeResult.push({
						Type: this.#TokenType.Char,
						Ctx: charchunk
					})
					break;

				case this.#TokenizerState.LeftBraketState:
					tokenizerstate = this.#TokenizerState.VariableState;
					offset++;
					break;

				case this.#TokenizerState.RightBraketState:
					tokenizerstate = this.#TokenizerState.CharState;
					offset++;
					break;

				case this.#TokenizerState.VariableState:
					let varchunk = "";
					while(input[offset] != "}"){
						varchunk += input[offset];
						offset++;
					}

					tokenizerstate = this.#TokenizerState.RightBraketState;
					TokenizeResult.push({
						Type: this.#TokenType.Variable,
						Ctx: varchunk
					});

					break;
			}
		}

		return TokenizeResult;
	}

	#tearup(object) {
		if(object == null){
			return {};
		}

		let mappingvaraibles = new Map();

		for(let [key, val] of Object.entries(object)){
			mappingvaraibles.set(key, val);
		}

		return mappingvaraibles;
	}

	render(text = "", content = {}){
		let parsed = this.#tokenize(text);
		let object = this.#tearup(content);
		let renderedobject = "";

		for(let block of parsed){
			switch(block.Type){
				case this.#TokenType.Char:
					renderedobject += block.Ctx;
					break;

				case this.#TokenType.Variable:
					if(object.has(block.Ctx)){
						renderedobject += String(object.get(block.Ctx));
					} else {
						renderedobject += "";
					}
					break;
			}
		}

		return renderedobject;
	}
}

class MessageGenerator {
	constructor(misskey = new MisskeyTools(), message){
		this.misskey = misskey;
		this.message = message;
	}

	async #getNotedata() {
		let notechartdata = await this.misskey.getNoteChart();
		return {
			note_total: notechartdata["total"][1],
			note_increase: notechartdata["inc"][1],
			note_decrease: notechartdata["dec"][1]
		}
	}

	async #getFollowData() {
		let followingchartdata = await this.misskey.getFollowingChart();
		return {
			following_total: (followingchartdata["local"]["followings"]["total"])[1] + (followingchartdata["remote"]["followings"]["total"])[1],
			following_increase: (followingchartdata["local"]["followings"]["inc"])[1] + (followingchartdata["remote"]["followings"]["inc"])[1],
			following_decrease: (followingchartdata["local"]["followings"]["dec"])[1] + (followingchartdata["remote"]["followings"]["inc"])[1],

			follower_total: (followingchartdata["local"]["followers"]["total"])[1] + (followingchartdata["remote"]["followers"]["total"])[1],
			follower_increase: (followingchartdata["local"]["followers"]["inc"])[1] + (followingchartdata["remote"]["followers"]["inc"])[1],
			follower_decrease: (followingchartdata["local"]["followers"]["dec"])[1] + (followingchartdata["remote"]["followers"]["inc"])[1],
		}
	}

	async generate_message(){
		const notedata = await this.#getNotedata();
		const followingdata = await this.#getFollowData();

		const activitydata = Object.assign(notedata, followingdata);
		const t = new TemplateEngine();

		return t.render(this.message, activitydata)
	}
}

export { MessageGenerator, TemplateEngine }
