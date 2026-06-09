import { App, Notice, TFile, normalizePath } from "obsidian";
import { DataFile, DataRecord } from "../types/DataTypes";
import { SchemaManager } from "./SchemaManager";
import { SchemaContext } from "../types/ContextTypes";
import { RulesetManager } from "./RulesetManager";
import { CacheManager } from "./CacheManager";

export class DataManager {

	private app: App;
	private schemaManager: SchemaManager;
	private rulesetManager: RulesetManager;
    private cacheManager: CacheManager;

	constructor(app: App, schemaManager: SchemaManager, rulesetManager: RulesetManager, cacheManager: CacheManager) {
		this.app = app;
		this.schemaManager = schemaManager;
        this.rulesetManager = rulesetManager;
        this.cacheManager = cacheManager;
	}

	private getDataFolder(ruleset: string): string {
		return normalizePath(
            this.rulesetManager.getDataFolder(
                ruleset
            )
        );
	}

	private getFilePath(context: SchemaContext): string {
		return normalizePath(
			`${this.getDataFolder(context.ruleset)}/${context.schemaName}.json`
		);
	}

	async ensureFolderExists(ruleset: string): Promise<void> {

		const folder = this.getDataFolder(ruleset);

		const exists =
			this.app.vault.getAbstractFileByPath(folder);

		if (!exists) {
			await this.app.vault.createFolder(folder);
		}
	}

	async ensureFileExists(context: SchemaContext): Promise<void> {

		await this.ensureFolderExists(context.ruleset);

		const path = this.getFilePath(context);

		const file =
			this.app.vault.getAbstractFileByPath(path);

		if (!file) {

			const initialData: DataFile = {
				ruleset: context.ruleset,
				schemaName: context.schemaName,
				version: 1,
				records: []
			};

			await this.app.vault.create(
				path,
				JSON.stringify(initialData, null, 2)
			);
		}
	}

	async load(
        context: SchemaContext
    ): Promise<DataFile> {

        const cached =
            this.cacheManager.getData(
                context.ruleset,
                context.schemaName
            );

        if (cached) {
            new Notice(
				`Data cache hit: ${context.ruleset}/${context.schemaName}`
			);

            return structuredClone(cached);
        }

        await this.ensureFileExists(context);

        const path = this.getFilePath(context);

        const file =
            this.app.vault.getAbstractFileByPath(
                path
            ) as TFile;

        const content =
            await this.app.vault.read(file);

        const data: DataFile =
            JSON.parse(content);
        
        if (!context.schema) {
            throw new Error("SchemaContext is missing schema (must be hydrated before DataManager usage)");
        }
        
        const schema = context.schema;

        let changed = false;

        data.records = data.records.map(record => {

            const migrated =
                this.schemaManager.migrateRecordOnLoad(
                    record,
                    schema
                );

            if (
                migrated.schemaVersion !== record.schemaVersion
            ) {
                changed = true;
            }

            return migrated;
        });

        if (changed) {
            await this.save(context, data);
            return structuredClone(data);
        }

        this.cacheManager.setData(
            context.ruleset,
            context.schemaName,
            data
        );

        return structuredClone(data);
    }

	async save(
		context: SchemaContext,
		data: DataFile
	): Promise<void> {

		await this.ensureFileExists(context);

		const path = this.getFilePath(context);

		const file =
			this.app.vault.getAbstractFileByPath(path) as TFile;

		await this.app.vault.modify(
			file,
			JSON.stringify(data, null, 2)
		);

        this.cacheManager.setData(
            context.ruleset,
            context.schemaName,
            data
        );
	}

	async add(
        context: SchemaContext,
        recordData: Record<string, any>
    ): Promise<DataRecord> {

        return this.createRecord(
            context,
            recordData
        );
    }

    async getAll(
        context: SchemaContext
    ): Promise<DataRecord[]> {

        const data = await this.load(context);

        return data.records;
    }

    async getById(
        context: SchemaContext,
        id: string
    ): Promise<DataRecord | undefined> {

        const data = await this.load(context);

        return data.records.find(
            record => record.id === id
        );
    }

    async exists(
        context: SchemaContext,
        id: string
    ): Promise<boolean> {

        const record =
            await this.getById(context, id);

        return record !== undefined;
    }

    async update(
        context: SchemaContext,
        id: string,
        changes: Record<string, any>
    ): Promise<boolean> {

        const data = await this.load(context);

        const record =
            data.records.find(r => r.id === id);

        if (!record) {
            return false;
        }

        // --------------------------------------------------
        // 1. Merge changes safely
        // --------------------------------------------------

        if (!context.schema) {
            throw new Error("SchemaContext is missing schema (must be hydrated before DataManager usage)");
        }

        const schema = context.schema;

        const merged = {
            ...record.data,
            ...changes
        };

        // --------------------------------------------------
        // 2. Apply schema normalization (IMPORTANT)
        // --------------------------------------------------

        const normalized =
            this.schemaManager.applyDefaults(
                merged,
                schema
            );

        // --------------------------------------------------
        // 3. Validate against schema
        // --------------------------------------------------

        const validation =
            this.schemaManager.validateRecord(
                normalized,
                schema
            );

        if (!validation.valid) {
            throw new Error(
                `Update failed validation:\n${validation.errors.join("\n")}`
            );
        }

        // --------------------------------------------------
        // 4. Commit
        // --------------------------------------------------

        record.data = normalized;

        await this.save(context, data);

        return true;
    }

    async remove(
        context: SchemaContext,
        id: string
    ): Promise<boolean> {

        const data = await this.load(context);

        const index =
            data.records.findIndex(
                record => record.id === id
            );

        if (index < 0) {
            return false;
        }

        data.records.splice(index, 1);

        await this.save(context, data);

        return true;
    }

    async count(
        context: SchemaContext
    ): Promise<number> {

        const data = await this.load(context);

        return data.records.length;
    }

    // --------------------------------------------------
    // CREATE RECORD (SCHEMA-AWARE)
    // --------------------------------------------------

    async createRecord(
        context: SchemaContext,
        recordData: Record<string, any>
    ): Promise<DataRecord> {

        // 1. Load schema
        if (!context.schema) {
            throw new Error("SchemaContext is missing schema (must be hydrated before DataManager usage)");
        }
        const schema = context.schema;

        // 2. Apply defaults
        let finalData =
            this.schemaManager.applyDefaults(
                recordData,
                schema
            );

        // 3. Validate record
        const validation =
            this.schemaManager.validateRecord(
                finalData,
                schema
            );

        if (!validation.valid) {
            throw new Error(
                `Invalid record:\n${validation.errors.join("\n")}`
            );
        }

        // 4. Create record
        const record: DataRecord = {
            id: crypto.randomUUID(),
            schemaVersion: schema.version,
            data: finalData
        };

        // 5. Save
        const data =
            await this.load(context);

        data.records.push(record);

        await this.save(context, data);

        return record;
    }
}