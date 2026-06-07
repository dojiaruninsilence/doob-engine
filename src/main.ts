import { Plugin, Notice } from "obsidian";

export default class DoobEngine extends Plugin {

  async onload() {

    (window as any).doobReload = async () => {
      new Notice("Reloading Doob Engine...");

      await this.onunload();
      await this.onload();
    };

    new Notice("Doob Engine loaded");
    new Notice("Doob Engine is alive!");
  }

  onunload() {
    console.log("Doob Engine unloaded");
  }
}
