import { firestore } from "../../../src/firebase.js";
import { clear_mock_reviews, set_mock_reviews } from "../helpers.js";

export function setup_reviews() {
	beforeEach(async () => await set_mock_reviews());

	afterEach(async () => await clear_mock_reviews());
}

export async function clear_reviews() {
	const snapshot = await firestore.collectionGroup("reviews").get();

	if (snapshot.empty) {
		return false;
	}

	const batch = firestore.batch();

	snapshot.docs.forEach((doc) => {
		batch.delete(doc.ref);
	});

	await batch.commit();
}
