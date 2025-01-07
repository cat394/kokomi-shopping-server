import type FirebaseFirestore from "firebase-admin/firestore";
import { BaseDocumentFields } from "../validator/schema.js";

export type DocumentResponse<T extends BaseDocumentFields> = {
	[K in keyof T]: K extends "created_at" | "updated_at" ? string : T[K];
};

export async function clear_collection_data(
	collection_ref: FirebaseFirestore.CollectionReference
): Promise<void> {
	const snap = await collection_ref.get();

	const batch = collection_ref.firestore.batch();

	for (const doc_snap of snap.docs) {
		batch.delete(doc_snap.ref);
	}

	await batch.commit();
}

export function convert_timestamp_to_isostring<T extends BaseDocumentFields>(data: T) {
	return {
		...data,
		created_at: data.created_at.toDate().toISOString(),
		updated_at: data.updated_at.toDate().toISOString()
	} as DocumentResponse<T>
}