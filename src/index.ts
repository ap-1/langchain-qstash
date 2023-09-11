import { Hono } from "hono";
import { logger } from "hono/logger";

import { Redis } from "@upstash/redis/cloudflare";
import { UpstashRedisCache } from "langchain/cache/upstash_redis";
import { OpenAI } from "langchain/llms/openai";

import { verify } from "./middleware/verify";
import { ratelimit } from "./middleware/ratelimit";

type Bindings = {
	QSTASH_CURRENT_SIGNING_KEY: string;
	QSTASH_NEXT_SIGNING_KEY: string;
	UPSTASH_REDIS_REST_URL: string;
	UPSTASH_REDIS_REST_TOKEN: string;
	OPENAI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use("*", logger());

app.post("/api/announce", ratelimit, verify, async (ctx) => {
	const redis = new Redis({
		url: ctx.env.UPSTASH_REDIS_REST_URL,
		token: ctx.env.UPSTASH_REDIS_REST_TOKEN,
	});

	const cache = new UpstashRedisCache({ client: redis });
	const model = new OpenAI({
		cache,
		openAIApiKey: ctx.env.OPENAI_API_KEY,
	});

	const query = ctx.res.locals.query;
	const result = await model
		.call(query)
		.then((result) => {
			console.log(result);
			return result;
		})
		.catch((err) => console.error(err));

	return new Response(result ?? "", { status: 200 });
});

app.get("/", async (ctx) => ctx.text("Hello world"));

export default app;
