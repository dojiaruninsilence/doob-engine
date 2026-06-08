export const FIELD_TYPES = [
	"string",
	"number",
	"boolean",
	"object",
	"array",
	"enum",
	"reference"
] as const;

export type FieldType =
	typeof FIELD_TYPES[number];