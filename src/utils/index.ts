import { get_timestamp } from "./timestamp.js";
import { DataModifier } from "./data_modifier.js";
import {
	has_priviledged_rights,
	has_top_access_rights,
} from "./access_rights.js";
import {
	clear_collection_data,
	convert_timestamp_to_isostring,
	type DocumentResponse,
} from "./firestore.js";
import { is_production } from "./check_env.js";

export {
	type DocumentResponse,
	get_timestamp,
	DataModifier,
	has_priviledged_rights,
	has_top_access_rights,
	clear_collection_data,
	is_production,
	convert_timestamp_to_isostring,
};
