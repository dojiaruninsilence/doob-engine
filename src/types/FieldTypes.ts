export const FIELD_TYPES = [
	"string",
	"number",
	"boolean",
	"object",
	"array",
	"enum",
	"reference",
	"referenceCollection"
] as const;

export type FieldType =
	typeof FIELD_TYPES[number];