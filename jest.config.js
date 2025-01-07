export default {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	extensionsToTreatAsEsm: [".ts"],
	transform: {
		"^.+\\.ts$": ["ts-jest", { useESM: true }],
		"^.+\\.js$": "babel-jest",
	},
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.[jt]sx?$": "$1",
	},
	cache: false,
	maxConcurrency: 1,
};
