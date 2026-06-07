import { Plugin } from "obsidian";

export default class DoobEngine extends Plugin {

  async onload() {
    console.log("Doob Engine loaded");

    // TEMP API (we will replace this later)
    (window as any).doob = {
      loadJSON: async (path: string) => {
        const file = await this.app.vault.adapter.read(path);
        return JSON.parse(file);
      },

      saveJSON: async (path: string, data: any) => {
        await this.app.vault.adapter.write(
          path,
          JSON.stringify(data, null, 2)
        );
      }
    };
  }

  onunload() {
    delete (window as any).doob;
  }
}