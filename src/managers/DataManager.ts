import { App, Notice, TFile, normalizePath } from "obsidian";
import { DataFile } from "../types/DataTypes";

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
		record: any
	): Promise<void> {

		const data = await this.load(type);

		data.records.push(record);

		await this.save(type, data);
	}
}