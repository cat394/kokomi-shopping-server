import { BaseDocumentFields } from "../validator/schema.js";
import { get_timestamp } from "./timestamp.js";

type DeleteTopLevelUndefinedProps<T extends object> = {
	[K in keyof T]: Exclude<T[K], undefined>;
};

type MergeAdditionalField<
	T extends object,
	FieldName extends keyof BaseDocumentFields
> = T & Pick<BaseDocumentFields, FieldName>;

type MergeId<T extends object> = MergeAdditionalField<T, "id">;

type MergeCreatedAt<T extends object> = MergeAdditionalField<T, "created_at">;

type MergeUpdatedAt<T extends object> = MergeAdditionalField<T, "updated_at">;

type MergeTimestamp<T extends object> = MergeAdditionalField<
	T,
	"created_at" | "updated_at"
>;

export class DataModifier<const Original extends object> {
	protected modified: Original;

	constructor(original: Original) {
		this.modified = { ...original };
	}

	static generate_id() {
		return crypto.randomUUID();
	}

	merge_id(id?: BaseDocumentFields["id"]): DataModifier<MergeId<Original>> {
		(this.modified as MergeId<Original>)["id"] =
			id ?? DataModifier.generate_id();
		return this as DataModifier<MergeId<Original>>;
	}

	merge_created_at() {
		(this.modified as MergeCreatedAt<Original>)["created_at"] = get_timestamp();

		return this as DataModifier<MergeCreatedAt<Original>>;
	}

	merge_updated_at() {
		(this.modified as MergeUpdatedAt<Original>)["updated_at"] = get_timestamp();

		return this as DataModifier<MergeUpdatedAt<Original>>;
	}

	merge_timestamp(): DataModifier<MergeTimestamp<Original>> {
		const timestamp = get_timestamp();

		(this.modified as MergeCreatedAt<Original>)["created_at"] = timestamp;
		(this.modified as MergeUpdatedAt<Original>)["updated_at"] = timestamp;

		return this as DataModifier<MergeTimestamp<Original>>;
	}

	delete_undefined_props(): DataModifier<
		DeleteTopLevelUndefinedProps<Original>
	> {
		for (const key in this.modified) {
			if (this.modified[key] === undefined) {
				delete this.modified[key];
			}
		}
		return this as DataModifier<DeleteTopLevelUndefinedProps<Original>>;
	}

	merge_props<AnotherProps extends object>(
		additional_props: AnotherProps
	): DataModifier<Original & AnotherProps> {
		this.modified = {
			...this.modified,
			...additional_props,
		};

		return this as unknown as DataModifier<Original & AnotherProps>;
	}

	result() {
		return this.modified;
	}
}
