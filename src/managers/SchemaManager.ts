import { App, TFile, normalizePath } from "obsidian";
import { Schema } from "../types/SchemaTypes";
import { RulesetManager } from "./RulesetManager";
import { FIELD_TYPES, FieldType } from "../types/FieldTypes";
import { ValidationResult } from "../types/ValidationTypes";

export class SchemaManager {

	private app: App;
	private rulesetManager: RulesetManager;

	constructor(
		app: App,
		rulesetManager: RulesetManager
	) {
		this.app = app;
		this.rulesetManager = rulesetManager;
	}

	private bumpSchemaVersion(schema: Schema) {
		schema.version++;
	}

	// --------------------------------------------------
	// Defaults
	// --------------------------------------------------

	private getDefaultForType(
		type: FieldType
	): any {

		switch (type) {

			case "string":
				return "";

			case "number":
				return 0;

			case "boolean":
				return false;

			case "array":
				return [];

			case "object":
				return {};

			case "enum":
				return "";

			case "reference":
				return null;

			default:
				throw new Error(
					`Unhandled field type: ${type}`
				);
		}
	}

	// --------------------------------------------------
	// Validation
	// --------------------------------------------------

	private isValidFieldType(
		type: unknown
	): type is FieldType {

		return FIELD_TYPES.includes(
			type as FieldType
		);
	}

	private validateFieldValue(
		value: any,
		type: FieldType
	): boolean {

		switch (type) {

			case "string":
				return typeof value === "string";

			case "number":
				return typeof value === "number";

			case "boolean":
				return typeof value === "boolean";

			case "array":
				return Array.isArray(value);

			case "object":
				return (
					typeof value === "object" &&
					!Array.isArray(value) &&
					value !== null
				);

			case "enum":
				return typeof value === "string";

			case "reference":
				return (
					typeof value === "string" ||
					value === null
				);
		}
	}

	// --------------------------------------------------
	// PATH
	// --------------------------------------------------

	private getSchemaPath(
		ruleset: string,
		name: string
	): string {

		return normalizePath(
			`${this.rulesetManager.getSchemaFolder(
				ruleset
			)}/${name}.json`
		);
	}

	// --------------------------------------------------
	// CREATE / ENSURE
	// --------------------------------------------------

	private createEmptySchema(
		name: string
	): Schema {

		return {
			name,
			version: 1,
			fields: {}
		};
	}

	async ensureSchemaExists(
		ruleset: string,
		name: string
	) {

		await this.rulesetManager.ensureRulesetExists(
			ruleset
		);

		const path =
			this.getSchemaPath(
				ruleset,
				name
			);

		if (
			!this.app.vault.getAbstractFileByPath(
				path
			)
		) {

			await this.app.vault.create(
				path,
				JSON.stringify(
					this.createEmptySchema(name),
					null,
					2
				)
			);
		}
	}

	// --------------------------------------------------
	// Validate Schema and Records
	// --------------------------------------------------

	validateSchema(
		schema: Schema
	): ValidationResult {

		const errors: string[] = [];

		if (!schema.name.trim()) {
			errors.push(
				"Schema name is required"
			);
		}

		if (schema.version < 1) {
			errors.push(
				"Schema version must be greater than 0"
			);
		}

		for (
			const [fieldName, field]
			of Object.entries(schema.fields)
		) {

			if (!this.isValidFieldType(field.type)) {

				errors.push(
					`Invalid type on field '${fieldName}'`
				);

				continue;
			}

			if (
				!this.validateFieldValue(
					field.default,
					field.type
				)
			) {
				errors.push(
					`Invalid default value on field '${fieldName}'`
				);
			}

			if (
				field.type === "enum" &&
				(!field.enumValues ||
					field.enumValues.length === 0)
			) {
				errors.push(
					`Enum field '${fieldName}' requires enumValues`
				);
			}

			if (
				field.type === "reference" &&
				!field.referenceType
			) {
				errors.push(
					`Reference field '${fieldName}' requires referenceType`
				);
			}
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	validateRecord(
		record: Record<string, any>,
		schema: Schema
	): ValidationResult {

		const errors: string[] = [];

		for (
			const [fieldName, field]
			of Object.entries(schema.fields)
		) {

			const value =
				record[fieldName];

			if (
				field.required &&
				(
					value === undefined ||
					value === null
				)
			) {
				errors.push(
					`Missing required field '${fieldName}'`
				);

				continue;
			}

			if (
				value !== undefined &&
				!this.validateFieldValue(
					value,
					field.type
				)
			) {
				errors.push(
					`Invalid value for '${fieldName}'`
				);
			}

			if (
				field.type === "enum" &&
				value !== undefined &&
				field.enumValues &&
				!field.enumValues.includes(value)
			) {
				errors.push(
					`Invalid enum value for '${fieldName}'`
				);
			}
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	// --------------------------------------------------
	// LOAD
	// --------------------------------------------------

	async loadSchema(
		ruleset: string,
		name: string
	): Promise<Schema> {

		await this.ensureSchemaExists(ruleset, name);

		return this.getSchema(ruleset, name);
	}

	async getSchema(
		ruleset: string,
		name: string
	): Promise<Schema> {

		const path =
			this.getSchemaPath(ruleset, name);

		const file =
			this.app.vault.getAbstractFileByPath(
				path
			);

		if (!file) {
			throw new Error(
				`Schema does not exist: ${ruleset}/${name}`
			);
		}

		const content =
			await this.app.vault.read(file as TFile);

		try {
			return JSON.parse(content);
		}
		catch (error) {
			throw new Error(
				`Failed to parse schema '${name}'`
			);
		}
	}

	// --------------------------------------------------
	// SAVE
	// --------------------------------------------------

	async saveSchema(
		ruleset: string,
		schema: Schema
	) {

		await this.ensureSchemaExists(
			ruleset,
			schema.name
		);

		const path =
			this.getSchemaPath(
				ruleset,
				schema.name
			);

		const file =
			this.app.vault.getAbstractFileByPath(
				path
			) as TFile;

		const validation =
			this.validateSchema(schema);

		if (!validation.valid) {

			throw new Error(
				validation.errors.join("\n")
			);
		}

		await this.app.vault.modify(
			file,
			JSON.stringify(schema, null, 2)
		);
	}

	// --------------------------------------------------
	// FIELD OPS
	// --------------------------------------------------

	async addField(
		ruleset: string,
		schemaName: string,
		fieldName: string,
		type: FieldType,
		defaultValue?: any
	) {

		const schema =
			await this.loadSchema(
				ruleset,
				schemaName
			);

		if (!this.isValidFieldType(type)) {
			throw new Error(`Invalid field type: ${type}`);
		}

		if (schema.fields[fieldName]) {
			throw new Error(`Field already exists: ${fieldName}`);
		}

		const finalDefault =
			defaultValue ??
			this.getDefaultForType(type);

		schema.fields[fieldName] = {
			type,
			default: structuredClone(finalDefault)
		};

		if (
			!this.validateFieldValue(
				finalDefault,
				type
			)
		) {
			throw new Error(
				`Default value does not match field type`
			);
		}
		
		this.bumpSchemaVersion(schema);

		await this.saveSchema(
			ruleset,
			schema
		);
	}

	async hasField(
		ruleset: string,
		schemaName: string,
		fieldName: string
	): Promise<boolean> {

		const schema =
			await this.loadSchema(
				ruleset,
				schemaName
			);

		return fieldName in schema.fields;
	}

	async removeField(
		ruleset: string,
		schemaName: string,
		fieldName: string
	): Promise<void> {

		const schema =
			await this.loadSchema(
				ruleset,
				schemaName
			);

		if (!schema.fields[fieldName]) {
			throw new Error(
				`Field does not exist: ${fieldName}`
			);
		}

		delete schema.fields[fieldName];

		this.bumpSchemaVersion(schema);

		await this.saveSchema(
			ruleset,
			schema
		);
	}

	async renameField(
		ruleset: string,
		schemaName: string,
		oldName: string,
		newName: string
	): Promise<void> {

		const schema =
			await this.loadSchema(
				ruleset,
				schemaName
			);

		if (!schema.fields[oldName]) {
			throw new Error(
				`Field does not exist: ${oldName}`
			);
		}

		if (schema.fields[newName]) {
			throw new Error(
				`Field already exists: ${newName}`
			);
		}

		schema.fields[newName] =
			structuredClone(
				schema.fields[oldName]
			);

		delete schema.fields[oldName];

		this.bumpSchemaVersion(schema);

		await this.saveSchema(
			ruleset,
			schema
		);
	}

	async updateField(
		ruleset: string,
		schemaName: string,
		fieldName: string,
		changes: Partial<{
			type: FieldType;
			default: any;
		}>
	): Promise<void> {

		const schema =
			await this.loadSchema(
				ruleset,
				schemaName
			);

		const field =
			schema.fields[fieldName];

		if (!field) {
			throw new Error(
				`Field does not exist: ${fieldName}`
			);
		}

		const updatedField = {
			...field,
			...changes
		};

		if (
			!this.validateFieldValue(
				updatedField.default,
				updatedField.type
			)
		) {
			throw new Error(
				`Default value does not match field type`
			);
		}

		schema.fields[fieldName] =
			updatedField;

		this.bumpSchemaVersion(schema);

		await this.saveSchema(
			ruleset,
			schema
		);
	}

	// --------------------------------------------------
	// Apply Defaults
	// --------------------------------------------------

	applyDefaults(
		record: Record<string, any>,
		schema: Schema
	): Record<string, any> {

		const result = structuredClone(record);

		for (const [fieldName, field] of Object.entries(
			schema.fields
		)) {

			if (!this.validateFieldValue(field.default, field.type)) {
				console.warn(
					`Invalid default for field ${fieldName}`
				);
			}

			if (!(fieldName in result)) {

				result[fieldName] =
					structuredClone(field.default);
			}
		}

		return result;
	}

	// --------------------------------------------------
	// Migrate Record
	// --------------------------------------------------

	migrateRecord(
		record: Record<string, any>,
		schema: Schema
	): Record<string, any> {

		return this.applyDefaults(
			record,
			schema
		);
	}
}