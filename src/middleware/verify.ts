import { Receiver } from "@upstash/qstash";
import { type MiddlewareHandler } from "hono";

declare global {
	interface Response {
		locals: {
			query: string;
		};
	}
}

export const verify: MiddlewareHandler = async (ctx, next) => {
	const receiver = new Receiver({
		currentSigningKey: ctx.env.QSTASH_CURRENT_SIGNING_KEY,
		nextSigningKey: ctx.env.QSTASH_NEXT_SIGNING_KEY,
	});

	const body = await ctx.req.text();
	ctx.res.locals = {
		query: JSON.parse(body).query,
	};

	const isValid = await receiver
		.verify({
			signature: ctx.req.headers.get("Upstash-Signature")!,
			body,
		})
		.catch((err) => {
			console.error(err);
			return false;
		});

	if (!isValid) {
		return new Response("Invalid signature", { status: 401 });
	}

	await next();
};
