import {
	CollectionGroup,
	CollectionReference,
	DocumentReference,
	FieldValue,
	Filter,
} from "firebase-admin/firestore";
import {
	type ProductDocument,
	type BaseDocumentFields,
	type UserDocument,
	BuyerOrderDocument,
	ReviewDocument,
	CartItemDocument,
	CartUpdated,
	CartPopulated,
	SellerOrderDocument,
	PrivilegedUserDocument,
} from "../validator/schema.js";
import { DatabaseError, ResourceNotFoundError } from "../errors/index.js";
import { firestore } from "../firebase.js";
import { ParsedUrlQuery } from "querystring";
import { Context } from "koa";
import {
	DocumentResponse,
	convert_timestamp_to_isostring,
} from "../utils/index.js";
import { MAX_NUMBER_OF_CART_ITEMS } from "../const.js";
import { DataModifier } from "../utils/data_modifier.js";

class EnhancedBatch {
	private batch: FirebaseFirestore.WriteBatch;

	constructor() {
		this.batch = firestore.batch();
	}

	set<T>(
		ref: FirebaseFirestore.DocumentReference<T>,
		data: T,
		options: FirebaseFirestore.SetOptions = {}
	) {
		this.batch.set(ref, data, options);
		return this;
	}

	update<T>(
		ref: FirebaseFirestore.DocumentReference<T>,
		data: FirebaseFirestore.UpdateData<T> & object
	) {
		this.batch.update(ref, data);
		return this;
	}

	delete<T>(ref: FirebaseFirestore.DocumentReference<T>) {
		this.batch.delete(ref);
		return this;
	}

	async commit() {
		try {
			await this.batch.commit();
		} catch (err) {
			throw new DatabaseError("TRANSACTION_FAILED", { bubbled_error: err });
		}
	}
}

type CursorValue = string | number;

type Cursor = {
	start_at?: CursorValue;
	start_after?: CursorValue;
	end_at?: CursorValue;
	end_before?: CursorValue;
};

export class QueryBuilder {
	private filters: Filter[] = [];
	filter?: Filter;
	cursor: Cursor = {};
	limit = 20;
	orders: [string, FirebaseFirestore.OrderByDirection][] = [];

	constructor(private query: ParsedUrlQuery) {
		this.build();
	}

	private build(): void {
		for (const key in this.query) {
			const value = this.query[key];

			if (value === undefined) continue;

			if (Array.isArray(value)) {
				if (key === "order") {
					value.forEach((order_value) => {
						if (order_value) {
							this.orders.push([key, order_value === "desc" ? "desc" : "asc"]);
						}
					});
				} else {
					this.filters.push(
						Filter.or(...value.map((val) => Filter.where(key, "==", val)))
					);
				}
			} else if (value.includes(",")) {
				const values = value.split(",");
				this.filters.push(
					Filter.or(
						...values.map((val) =>
							Filter.where(key, "==", decodeURIComponent(val))
						)
					)
				);
			} else if (value.includes(":")) {
				const [operator, val] = value.split(":");

				if (operator && val) {
					const firebase_operator = this.get_firebase_operator(operator);

					if (firebase_operator) {
						if (key === "created_at" || key === "updated_at") {
							const timestamp = this.parse_timestamp(val);

							if (timestamp) {
								this.filters.push(
									Filter.where(
										key,
										firebase_operator,
										this.parse_timestamp(val)
									)
								);
							}
						} else {
							this.filters.push(
								Filter.where(
									key,
									firebase_operator,
									this.parse_query_value(val)
								)
							);
						}
					}
				}
			} else if (key === "start_at") {
				this.cursor.start_at = this.parse_cursor_value(value);
			} else if (key === "start_after") {
				this.cursor.start_after = this.parse_cursor_value(value);
			} else if (key === "end_at") {
				this.cursor.end_at = this.parse_cursor_value(value);
			} else if (key === "end_before") {
				this.cursor.end_before = this.parse_cursor_value(value);
			} else if (key === "limit") {
				this.limit = parseInt(value, 10) || 20;
			} else if (key === "order") {
				const [field, direction] = value.split(":");

				if (field && direction) {
					this.orders.push([field, direction === "desc" ? "desc" : "asc"]);
				}
			} else {
				this.filters.push(Filter.where(key, "==", value));
			}
		}

		this.filter = Filter.and(...this.filters);
	}

	private get_firebase_operator(
		operator: string
	): FirebaseFirestore.WhereFilterOp | null {
		switch (operator) {
			case "gt":
				return ">";
			case "gte":
				return ">=";
			case "lt":
				return "<";
			case "lte":
				return "<=";
			default:
				return null;
		}
	}

	private parse_cursor_value(value: string): CursorValue {
		const parsed = Number(value);

		return isNaN(parsed) ? value : parsed;
	}

	private parse_query_value(value: string): string | number | boolean {
		const parsed = Number(value);

		if (!isNaN(parsed)) {
			return parsed;
		}

		if (value === "true" || value === "false") {
			return Boolean(value);
		}

		return value;
	}

	private parse_timestamp(value: string): FirebaseFirestore.Timestamp | false {
		const date = new Date(value);

		const is_date = isNaN(date.getTime());

		return is_date ? FirebaseFirestore.Timestamp.fromDate(date) : false;
	}

	apply(
		collection: FirebaseFirestore.CollectionReference
	): FirebaseFirestore.Query {
		let query: FirebaseFirestore.Query = collection;

		if (this.filter) {
			query = query.where(this.filter);
		}

		this.orders.forEach(([field, direction]) => {
			query = query.orderBy(field, direction);
		});

		if (this.cursor.start_at !== undefined) {
			query = query.startAt(this.cursor.start_at);
		} else if (this.cursor.start_after !== undefined) {
			query = query.startAfter(this.cursor.start_after);
		}

		if (this.cursor.end_at !== undefined) {
			query = query.endAt(this.cursor.end_at);
		} else if (this.cursor.end_before !== undefined) {
			query = query.endBefore(this.cursor.end_before);
		}

		query = query.limit(this.limit);

		return query;
	}
}

type WithTransaction = {
	transaction?: FirebaseFirestore.Transaction;
};

type WithBatch = {
	batch?: EnhancedBatch;
};

class Model<Data extends BaseDocumentFields> {
	constructor(readonly collection: CollectionReference) {}

	doc(id: Data["id"]): DocumentReference<Data> {
		return this.collection.doc(id) as DocumentReference<Data>;
	}

	async get(
		id: Data["id"],
		options: WithTransaction = {}
	): Promise<DocumentResponse<Data> | null> {
		try {
			const doc_ref = this.doc(id);

			const snapshot = options.transaction
				? await options.transaction.get(doc_ref)
				: await doc_ref.get();

			const data = snapshot.data();

			return data ? convert_timestamp_to_isostring(data) : null;
		} catch {
			throw new DatabaseError("RETRIEVE_FAILED", {
				additional_message: `No data found for id ${id}.`,
			});
		}
	}

	async get_list(
		query_params?: Context["query"],
		options: WithTransaction = {}
	): Promise<DocumentResponse<Data>[]> {
		try {
			let query: FirebaseFirestore.Query | CollectionReference;

			if (query_params) {
				const query_builder = new QueryBuilder(query_params);

				query = query_builder.apply(this.collection);
			} else {
				query = this.collection;
			}

			const snapshot = options.transaction
				? await options.transaction.get(query)
				: await query.get();

			return snapshot.docs.map((doc_snap) =>
				convert_timestamp_to_isostring(doc_snap.data() as Data)
			);
		} catch (err) {
			throw new DatabaseError("RETRIEVE_FAILED", { bubbled_error: err });
		}
	}

	async get_count(): Promise<number> {
		const snapshot = await this.collection.count().get();

		return snapshot.data().count;
	}

	async create(
		data: Data,
		{ batch, transaction }: WithBatch & WithTransaction = {}
	): Promise<void> {
		try {
			const doc_ref = this.doc(data.id);

			if (transaction) {
				transaction.set(doc_ref, data);
			} else if (batch) {
				batch.set(doc_ref, data);
			} else {
				await doc_ref.set(data);
			}
		} catch (err) {
			throw new DatabaseError("CREATE_FAILED", { bubbled_error: err });
		}
	}

	async merge(
		id: Data["id"],
		data: Partial<Data>,
		options: WithBatch & WithTransaction = {}
	): Promise<void> {
		try {
			const docRef = this.doc(id);

			if (options.transaction) {
				options.transaction.set(docRef, data, { merge: true });
			} else if (options.batch) {
				options.batch.set(docRef, data, { merge: true });
			} else {
				await docRef.set(data, { merge: true });
			}
		} catch (err) {
			throw new DatabaseError("CREATE_FAILED", { bubbled_error: err });
		}
	}

	async update(
		id: Data["id"],
		data: FirebaseFirestore.UpdateData<Data>,
		options: WithBatch & WithTransaction = {}
	): Promise<void> {
		try {
			const docRef = this.doc(id);

			if (options.transaction) {
				options.transaction.update(docRef, data);
			} else if (options.batch) {
				options.batch.update(docRef, data);
			} else {
				await docRef.update(data);
			}
		} catch (err) {
			throw new DatabaseError("UPDATE_FAILED", {
				additional_message: `ID: ${id}, Data: ${JSON.stringify(data)}`,
				bubbled_error: err,
			});
		}
	}

	async delete(
		id: Data["id"],
		{ transaction, batch }: WithBatch & WithTransaction = {}
	): Promise<void> {
		try {
			const doc_ref = this.doc(id);

			if (transaction) {
				transaction.delete(doc_ref);
			} else if (batch) {
				batch.delete(doc_ref);
			} else {
				await doc_ref.delete();
			}
		} catch (err) {
			throw new DatabaseError("DELETE_FAILED", { bubbled_error: err });
		}
	}

	async delete_list(
		query_params?: Context["query"],
		{ transaction, batch }: WithBatch & WithTransaction = {}
	): Promise<void> {
		try {
			let query: FirebaseFirestore.Query | CollectionReference;

			if (query_params) {
				const query_builder = new QueryBuilder(query_params);

				query = query_builder.apply(this.collection);
			} else {
				query = this.collection;
			}

			const snapshot = transaction
				? await transaction.get(query)
				: await query.get();

			if (transaction || batch) {
				snapshot.docs.forEach((doc_snap) => {
					const doc_ref = this.collection.doc(doc_snap.id);

					if (transaction) {
						transaction.delete(doc_ref);
					} else if (batch) {
						batch.delete(doc_ref);
					}
				});
			} else {
				await Promise.all(
					snapshot.docs.map((doc_snap) => doc_snap.ref.delete())
				);
			}
		} catch (err) {
			throw new DatabaseError("DELETE_FAILED", { bubbled_error: err });
		}
	}
}

class CartModel {
	private model: Model<CartItemDocument>;

	private _collection: CollectionReference;

	constructor(user_id: string) {
		this.model = new Model(
			firestore
				.collection("users")
				.doc(user_id)
				.collection("cart") as CollectionReference<CartItemDocument>
		);
		this._collection = this.model.collection;
	}

	get collection() {
		if (!this._collection) {
			throw new Error("Cart model was not instanced.");
		}

		return this._collection;
	}

	async get(
		id: CartItemDocument["id"],
		options: WithTransaction = {}
	): Promise<DocumentResponse<CartItemDocument> | null> {
		return await this.model.get(id, options);
	}

	async get_list(
		query_params?: Context["query"],
		options: WithTransaction = {}
	): Promise<DocumentResponse<CartItemDocument>[]> {
		const transaction_result = await db.run_transaction<
			DocumentResponse<CartItemDocument>[]
		>(async (transaction) => {
			const cart_items: DocumentResponse<CartItemDocument>[] = [];

			const cart = await this.model.get_list(query_params, options);

			for (const cart_item of cart) {
				const product = await db.products.get(cart_item.id, { transaction });

				if (product) {
					cart_items.push(cart_item);
				}
			}

			return cart_items;
		});

		return transaction_result;
	}

	async get_list_populated_product(
		query_params?: Context["query"],
		options: WithTransaction = {}
	): Promise<CartPopulated[]> {
		const res = await db.run_transaction<CartPopulated[]>(
			async (transaction) => {
				const populated: CartPopulated[] = [];

				const cart = await this.model.get_list(query_params, options);

				for (const { id, quantity } of cart) {
					const product = await db.products.get(id, { transaction });

					if (product) {
						populated.push({ product, quantity });
					}
				}

				return populated;
			}
		);

		return res;
	}

	async add(
		{ product_id, quantity }: CartUpdated,
		options: WithBatch & WithTransaction = {}
	) {
		const doc_count = await this.model.get_count();

		if (doc_count >= MAX_NUMBER_OF_CART_ITEMS) {
			throw new DatabaseError("UPDATE_FAILED", {
				additional_message:
					"You have reached the limit of data that can be stored in your cart.",
			});
		}

		const cart_item = await this.model.get(product_id);

		if (!cart_item) {
			const new_item = new DataModifier({ quantity })
				.merge_id(product_id)
				.merge_timestamp()
				.result();

			await this.model.create(new_item);
		} else {
			const new_quantity = cart_item.quantity + quantity;

			const updated_cart_item: Partial<CartItemDocument> = new DataModifier({
				quantity: new_quantity,
			})
				.merge_updated_at()
				.result();

			await this.model.update(product_id, updated_cart_item, options);
		}
	}

	async reduce(
		{ product_id, quantity }: CartUpdated,
		options: WithBatch & WithTransaction = {}
	) {
		const cart_item = await this.model.get(product_id);

		if (!cart_item) {
			throw new DatabaseError("UPDATE_FAILED", {
				additional_message: "Product not found.",
			});
		}

		const new_quantity = cart_item.quantity - quantity;

		if (new_quantity > 0) {
			await this.model.update(product_id, { quantity: new_quantity }, options);
		} else {
			await this.model.delete(product_id, options);
		}
	}

	async delete_list(): Promise<void> {
		const cart_items = await this.model.get_list();

		if (cart_items.length > 0) {
			const batch = db.batch();

			for (const cart_item of cart_items) {
				batch.delete(this.model.doc(cart_item.id));
			}

			await batch.commit();
		}
	}
}

class UsersModel extends Model<UserDocument> {
	constructor() {
		super(firestore.collection("users") as CollectionReference<UserDocument>);
	}

	async get_role(user_id: UserDocument["id"]) {
		const user = await this.get(user_id);

		if (!user) {
			throw new ResourceNotFoundError("USER_DATA_NOT_FOUND");
		}

		return user.role;
	}

	reviews(user_id: UserDocument["id"]) {
		return new Model<ReviewDocument>(
			this.collection
				.doc(user_id)
				.collection("reviews") as CollectionReference<ReviewDocument>
		);
	}

	cart(user_id: UserDocument["id"]) {
		return new CartModel(user_id);
	}
}

export class OrdersModel {
	buyer(user_id: UserDocument["id"]) {
		return new Model<BuyerOrderDocument>(
			firestore
				.collection("buyer-orders")
				.doc(user_id)
				.collection("orders") as CollectionReference<BuyerOrderDocument>
		);
	}

	seller(user_id: UserDocument["id"]) {
		return new Model<SellerOrderDocument>(
			firestore
				.collection("seller-orders")
				.doc(user_id)
				.collection("orders") as CollectionReference<SellerOrderDocument>
		);
	}

	async restore_unpaid_orders() {
		try {
			const now = new Date();

			const date_of_expiry = new Date(now.getTime() - 24 * 60 * 60 * 1000);

			await db.run_transaction(async (transaction) => {
				const orders_ref = firestore.collectionGroup(
					"orders"
				) as CollectionGroup<BuyerOrderDocument>;

				const snapshot = await transaction.get(
					orders_ref
						.where("status", "==", "unpaid")
						.where("created_at", "<", date_of_expiry)
						.limit(50)
				);

				snapshot.docs.forEach((doc) => {
					const order = doc.data();

					for (const seller_ordered_products of Object.values(order.products)) {
						seller_ordered_products.forEach(async ({ product, quantity }) => {
							const is_product_exists = await db.products.get(product.id, {
								transaction,
							});

							if (is_product_exists) {
								db.products.update(
									product.id,
									{ stock: FieldValue.increment(quantity) },
									{ transaction }
								);
							}
						});
					}

					transaction.delete(doc.ref);
				});
			});
		} catch {
			throw new DatabaseError("UNPAID_ORDER_DELETE_FAILED");
		}
	}
}

const db = {
	products: new Model<ProductDocument>(firestore.collection("products")),
	users: new UsersModel(),
	privileged_users: new Model<PrivilegedUserDocument>(
		firestore.collection("privileged_users")
	),
	async run_transaction<T>(
		update_fn: (transaction: FirebaseFirestore.Transaction) => Promise<T>
	) {
		return firestore.runTransaction(async (transaction) => {
			try {
				return await update_fn(transaction);
			} catch (err) {
				throw new DatabaseError("TRANSACTION_FAILED", { bubbled_error: err });
			}
		});
	},
	orders: new OrdersModel(),
	batch() {
		return new EnhancedBatch();
	},
};

export default db;
