import { Timestamp } from "firebase-admin/firestore";

export function get_timestamp(): Timestamp {
	return Timestamp.now();
}
