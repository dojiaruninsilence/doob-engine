import { WindowManager } from "../../ui/WindowManager";
import { LayoutManager } from "golden-layout";
import { ToolRegistry } from "../../ui/ToolRegistry";

export interface UIServices {

	windowManager: WindowManager;

	layoutManager: LayoutManager;

	toolRegistry: ToolRegistry;
}