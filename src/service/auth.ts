import type { UserDocument, AccessRights } from "../validator/schema.js";
import { auth } from "../firebase.js";
import { AuthError } from "../errors//index.js";
import { is_production } from "../utils/index.js";
import { TEST_FIRST_USER_EMAIL } from "../../tests/const.js";

enum TestUserIds {
	ADMIN = "admin-uid",
	MODERATOR = "moderator-uid",
	BUYER = "buyer-uid",
	SELLER = "seller-uid",
	UNREGISTERED = "unregistered-uid",
}

type AuthUserInfo = {
	uid: string;
	access_rights?: AccessRights;
	role?: UserDocument["role"];
	email?: string;
};

interface AuthAdapter {
	get_user_info(token: string): Promise<AuthUserInfo>;
	create_custom_token(
		uid: string,
		custom_claims: Pick<AuthUserInfo, "role" | "access_rights">
	): Promise<void>;
}

class FirebaseAuthAdapter implements AuthAdapter {
	async get_user_info(token: string): Promise<AuthUserInfo> {
		const { uid, access_rights, role, email } = await auth.verifyIdToken(token);

		const user_info: AuthUserInfo = { uid, access_rights, role, email };

		return user_info;
	}

	async create_custom_token(
		uid: string,
		custom_claims: Pick<AuthUserInfo, "role" | "access_rights">
	): Promise<void> {
		if (custom_claims.role) {
			const additional_claims: Omit<AuthUserInfo, "uid"> = {
				role: custom_claims.role,
			};

			await auth.createCustomToken(uid, additional_claims);
		}

		if (custom_claims.access_rights) {
			await auth.createCustomToken(uid, {
				access_rights: custom_claims.access_rights,
			});
		}
	}
}

class MockAuthAdapter implements AuthAdapter {
	async get_user_info(token: string): Promise<AuthUserInfo> {
		let user_info: AuthUserInfo;

		switch (token as keyof typeof TestUserIds) {
			case "ADMIN":
				user_info = {
					uid: TestUserIds.ADMIN,
					access_rights: "admin",
					email: TEST_FIRST_USER_EMAIL,
				};
				break;
			case "MODERATOR":
				user_info = {
					uid: TestUserIds.MODERATOR,
					access_rights: "moderator",
				};
				break;
			case "BUYER":
				user_info = {
					uid: TestUserIds.BUYER,
					role: "buyer",
				};
				break;
			case "SELLER":
				user_info = {
					uid: TestUserIds.SELLER,
					role: "seller",
				};
				break;
			case "UNREGISTERED":
				user_info = {
					uid: TestUserIds.UNREGISTERED,
				};
				break;
			default:
				throw new Error("Unexpected token");
		}

		return await Promise.resolve(user_info);
	}

	async create_custom_token(): Promise<void> {
		return await Promise.resolve();
	}
}

class AuthService {
	constructor(private adapter: AuthAdapter) {}

	async get_user_info(token: string): Promise<AuthUserInfo> {
		try {
			return await this.adapter.get_user_info(token);
		} catch (err) {
			throw new AuthError("INVALID_TOKEN", { bubbled_error: err });
		}
	}

	async create_custom_token(
		uid: string,
		custom_claims: Pick<AuthUserInfo, "role" | "access_rights">
	): Promise<void> {
		try {
			await this.adapter.create_custom_token(uid, custom_claims);
		} catch (err) {
			throw new AuthError("INVALID_TOKEN", { bubbled_error: err });
		}
	}

	async set_access_rights(
		uid: string,
		access_rights: Required<AuthUserInfo>["access_rights"]
	) {
		await this.adapter.create_custom_token(uid, { access_rights });
	}

	async set_role(uid: string, role: Required<AuthUserInfo>["role"]) {
		await this.adapter.create_custom_token(uid, { role });
	}
}

function get_auth_service(): AuthService {
	const auth_adapter = is_production
		? new FirebaseAuthAdapter()
		: new MockAuthAdapter();

	return new AuthService(auth_adapter);
}

const auth_service = get_auth_service();

export { type AuthUserInfo, TestUserIds, auth_service };
