import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { is_production } from "./utils/index.js";
import { ROOT_DIRECTORY } from "./const.js";
import { logger } from "./logger.js";

dotenv.config();

const service_account_path = path.resolve(
	ROOT_DIRECTORY,
	"serviceAccountKey.json"
);

const service_account = JSON.parse(
	fs.readFileSync(service_account_path, "utf-8")
) as ServiceAccount;

const app = initializeApp({
	credential: cert(service_account),
});

export const auth = getAuth(app);

function get_firestore(): Firestore {
	const firestore = getFirestore(app);

	if (!is_production) {
		logger.system.info("Start emulator...");

		firestore.settings({
			host: "localhost:8080",
			ssl: false,
		});
	}

	return firestore;
}

export const firestore = get_firestore();
