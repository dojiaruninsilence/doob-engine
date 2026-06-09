import { App, Notice, TFile, normalizePath } from "obsidian";
import { DataFile, DataRecord } from "../types/DataTypes";
import { SchemaManager } from "./SchemaManager";
import { Entity } from "../types/EntityTypes";
import { RulesetManager } from "./RulesetManager";

export class DataManager {

	private app: App;
	private schemaManager: SchemaManager;
	private rulesetManager: RulesetManager;

	constructor(app: App, schemaManager: SchemaManager, rulesetManager: RulesetManager) {
		this.app = app;
		this.schemaManager = schemaManager;
        this.rulesetManager = rulesetManager;
	}

	private getDataFolder(ruleset: string): string {
		return normalizePath(
            this.rulesetManager.getDataFolder(
                ruleset
            )
        );
	}

	private getFilePath(entity: Entity): string {
		return normalizePath(
			`${this.getDataFolder(entity.ruleset)}/${entity.schemaName}.json`
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

	async ensureFileExists(entity: Entity): Promise<void> {

		await this.ensureFolderExists(entity.ruleset);

		const path = this.getFilePath(entity);

		const file =
			this.app.vault.getAbstractFileByPath(path);

		if (!file) {

			const initialData: DataFile = {
				ruleset: entity.ruleset,
				schemaName: entity.schemaName,
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
        entity: Entity
    ): Promise<DataFile> {

        await this.ensureFileExists(entity);

        const path = this.getFilePath(entity);

        const file =
            this.app.vault.getAbstractFileByPath(
                path
            ) as TFile;

        const content =
            await this.app.vault.read(file);

        const data: DataFile =
            JSON.parse(content);
        
        if (!entity.schema) {
            throw new Error("Entity is missing schema (must be hydrated before DataManager usage)");
        }
        
        const schema = entity.schema;

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
            await this.save(entity, data);
        }

        return data;
    }

	async save(
		entity: Entity,
		data: DataFile
	): Promise<void> {

		await this.ensureFileExists(entity);

		const path = this.getFilePath(entity);

		const file =
			this.app.vault.getAbstractFileByPath(path) as TFile;

		await this.app.vault.modify(
			file,
			JSON.stringify(data, null, 2)
		);
	}

	async add(
        entity: Entity,
        recordData: Record<string, any>
    ): Promise<DataRecord> {

        return this.createRecord(
            entity,
            recordData
        );
    }

    async getAll(
        entity: Entity
    ): Promise<DataRecord[]> {

        const data = await this.load(entity);

        return data.records;
    }

    async getById(
        entity: Entity,
        id: string
    ): Promise<DataRecord | undefined> {

        const data = await this.load(entity);

        return data.records.find(
            record => record.id === id
        );
    }

    async exists(
        entity: Entity,
        id: string
    ): Promise<boolean> {

        const record =
            await this.getById(entity, id);

        return record !== undefined;
    }

    async update(
        entity: Entity,
        id: string,
        changes: Record<string, any>
    ): Promise<boolean> {

        const data = await this.load(entity);

        const record =
            data.records.find(r => r.id === id);

        if (!record) {
            return false;
        }

        // --------------------------------------------------
        // 1. Merge changes safely
        // --------------------------------------------------

        if (!entity.schema) {
            throw new Error("Entity is missing schema (must be hydrated before DataManager usage)");
        }

        const schema = entity.schema;

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

        await this.save(entity, data);

        return true;
    }

    async remove(
        entity: Entity,
        id: string
    ): Promise<boolean> {

        const data = await this.load(entity);

        const index =
            data.records.findIndex(
                record => record.id === id
            );

        if (index < 0) {
            return false;
        }

        data.records.splice(index, 1);

        await this.save(entity, data);

        return true;
    }

    async count(
        entity: Entity
    ): Promise<number> {

        const data = await this.load(entity);

        return data.records.length;
    }

    // --------------------------------------------------
    // CREATE RECORD (SCHEMA-AWARE)
    // --------------------------------------------------

    async createRecord(
        entity: Entity,
        recordData: Record<string, any>
    ): Promise<DataRecord> {

        // 1. Load schema
        if (!entity.schema) {
            throw new Error("Entity is missing schema (must be hydrated before DataManager usage)");
        }
        const schema = entity.schema;

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
            await this.load(entity);

        data.records.push(record);

        await this.save(entity, data);

        return record;
    }
}