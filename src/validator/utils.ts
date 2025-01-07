import { z } from "zod";
import _ from "lodash";

export const trimmed_string = z.string().trim();
export const at_least_one_character = trimmed_string.min(1);
export const url_format = z.string().url();
export const user_input_string = at_least_one_character.transform(_.escape);
export const document_id = z.string();
export const positive_int = z.number().positive().int();
export const datetime_string = z.string().datetime();
