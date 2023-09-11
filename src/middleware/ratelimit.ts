import { Redis } from "@upstash/redis/cloudflare";
import { Ratelimit } from "@upstash/ratelimit";
import { type MiddlewareHandler } from "hono";

export const ratelimit: MiddlewareHandler = async (ctx, next) => {
	const redis = new Redis({
		url: ctx.env.UPSTASH_REDIS_REST_URL,
		token: ctx.env.UPSTASH_REDIS_REST_TOKEN,
	});

	const ratelimit = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(10, "10 s"),
		analytics: true,
	});

	const identifier = "openai";
	const { success } = await ratelimit.limit(identifier);

	if (!success) {
		return new Response("Too many requests", { status: 429 });
	}

	await next();
};
