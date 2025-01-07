import { Context } from "koa";
import type { Events } from "./types.js";

export function emit_event<T extends keyof Events>(
	name: T,
	ctx: Context,
	details: Events[T]
) {
	ctx.app.emit(name, ctx, details);
}
