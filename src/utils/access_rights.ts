import type { AuthUserInfo } from "../service/index.js";

export function has_priviledged_rights(user: AuthUserInfo) {
	return user.access_rights === "admin" || user.access_rights === "moderator";
}

export function has_top_access_rights(user: AuthUserInfo) {
	return user.access_rights === "admin";
}
