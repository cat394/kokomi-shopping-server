export type Events = {
	error: {
		err: Error;
	};
	"upload-completed":
		| {
				file_path: string;
		  }
		| { file_paths: string[] };
	"deleted-product": {
		product_id: string;
	};
};
