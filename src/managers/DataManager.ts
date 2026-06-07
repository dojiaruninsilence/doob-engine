import { App, Notice, TFile, normalizePath } from "obsidian";
import { DataFile, DataRecord } from "../types/DataTypes";

export class DataManager {

	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	private getDataFolder(): string {
		return "Doob Engine/Data";
	}

	private getFilePath(type: string): string {
		return normalizePath(
			`${this.getDataFolder()}/${type}.json`
		);
	}

	async ensureFolderExists(): Promise<void> {

		const folder = this.getDataFolder();

		const exists =
			this.app.vault.getAbstractFileByPath(folder);

		if (!exists) {
			await this.app.vault.createFolder(folder);
		}
	}

	async ensureFileExists(type: string): Promise<void> {

		await this.ensureFolderExists();

		const path = this.getFilePath(type);

		const file =
			this.app.vault.getAbstractFileByPath(path);

		if (!file) {

			const initialData: DataFile = {
				version: 1,
				records: []
			};

			await this.app.vault.create(
				path,
				JSON.stringify(initialData, null, 2)
			);
		}
	}

	async load(type: string): Promise<DataFile> {

		await this.ensureFileExists(type);

		const path = this.getFilePath(type);

		const file =
			this.app.vault.getAbstractFileByPath(path) as TFile;

		const content =
			await this.app.vault.read(file);

		return JSON.parse(content);
	}

	async save(
		type: string,
		data: DataFile
	): Promise<void> {

		await this.ensureFileExists(type);

		const path = this.getFilePath(type);

		const file =
			this.app.vault.getAbstractFileByPath(path) as TFile;

		await this.app.vault.modify(
			file,
			JSON.stringify(data, null, 2)
		);
	}

	async add(
        type: string,
        recordData: Record<string, any>
    ): Promise<DataRecord> {

        const data = await this.load(type);

        const record: DataRecord = {
            id: crypto.randomUUID(),
            data: recordData
        };

        data.records.push(record);

        await this.save(type, data);

        return record;
    }

    async getAll(
        type: string
    ): Promise<DataRecord[]> {

        const data = await this.load(type);

        return data.records;
    }

    async getById(
        type: string,
        id: string
    ): Promise<DataRecord | undefined> {

        const data = await this.load(type);

        return data.records.find(
            record => record.id === id
        );
    }

    async exists(
        type: string,
        id: string
    ): Promise<boolean> {

        const record =
            await this.getById(type, id);

        return record !== undefined;
    }

    async update(
        type: string,
        id: string,
        changes: Record<string, any>
    ): Promise<boolean> {

        const data = await this.load(type);

        const record =
            data.records.find(
                record => record.id === id
            );

        if (!record) {
            return false;
        }

        Object.assign(
            record.data,
            changes
        );

        await this.save(type, data);

        return true;
    }

    async remove(
        type: string,
        id: string
    ): Promise<boolean> {

        const data = await this.load(type);

        const index =
            data.records.findIndex(
                record => record.id === id
            );

        if (index < 0) {
            return false;
        }

        data.records.splice(index, 1);

        await this.save(type, data);

        return true;
    }

    async count(
        type: string
    ): Promise<number> {

        const data = await this.load(type);

        return data.records.length;
    }
}