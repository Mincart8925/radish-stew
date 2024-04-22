import { MisskeyTools, ViewRange } from "./misskey";
import { MessageGenerator } from "./message";

const defaultmessage = `
총 노트 수: {note_total} (+{note_increase}, -{note_decrease})
총 팔로잉 수: {following_total} (+{following_increase}, -{following_decrease})
총 팔로워 수: {follower_total} (+{follower_increase}, -{follower_decrease})
`

const sendmessage = async(env) => {
	const misskey = new MisskeyTools(env.MISSKEY_INSTANCE, env.MISSKEY_KEY, env.MISSKEY_USERID);

	const alertmessage = (env.MESSAGE != null) ? env.MESSAGE : defaultmessage;
	const cwmessage = (env.CW != null) ? env.CW : null;

	const viewrange = (input) => {
		let range;

		switch(input){
			case "Public":
				range = ViewRange.Global;
				break;

			case "Home":
				range = ViewRange.Home;
				break;

			case "Follower":
				range = ViewRange.Private;
				break;
		}

		return range
	}

	const noterange = (env.VIEWRANGE != null) ? viewrange(env.VIEWRANGE) : ViewRange.Private;
	const localonly = (env.LOCALONLY != null) ? env.LOCALONLY : false;

	const message = new MessageGenerator(misskey, alertmessage);
	const result = await message.generate_message();

	const c = await misskey.createNote(result, {
		visibility: noterange,
		cw: cwmessage,
		localOnly: localonly
	})

	console.log(c)

	console.log("MK-TRIGGERED!")
}

export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.

	async fetch(request, env, ctx) {
		if(request.method == "GET" && new URL(request.url).pathname == "/test"){
			await sendmessage(env);
			return new Response("Triggered.");
		}

		return new Response("invalid.");
	},

	async scheduled(event, env, ctx) {
		await sendmessage(env);
		console.log("Triggered.");
	}
};
