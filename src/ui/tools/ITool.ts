export interface ITool {

	id: string;

	title: string;

	create(
		container: HTMLElement
	): void;

	destroy?(): void;
}