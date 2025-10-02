import { MarkdownView, Plugin } from 'obsidian';
import { StateField, Extension, RangeSet } from '@codemirror/state';

import * as MathLinks from 'obsidian-mathlinks';
import { registerQuickPreview } from 'obsidian-quick-preview';

import { MathContextSettings, DEFAULT_SETTINGS, ExtraSettings, DEFAULT_EXTRA_SETTINGS, UNION_TYPE_MATH_CONTEXT_SETTING_KEYS, UNION_TYPE_EXTRA_SETTING_KEYS } from 'settings/settings';
import { MathSettingTab } from "settings/tab";
import { CleverefProvider } from 'cleveref';
import { createTheoremCalloutPostProcessor } from 'theorem-callouts/renderer';
import { createTheoremCalloutNumberingViewPlugin } from 'theorem-callouts/view-plugin';
import { ContextSettingModal, TheoremCalloutModal } from 'settings/modals';
import { createEquationNumberProcessor } from 'equations/reading-view';
import { createEquationNumberPlugin } from 'equations/live-preview';
import { getMarkdownPreviewViewEl, getMarkdownSourceViewEl, isPluginOlderThan } from 'utils/obsidian';
import { getProfile, staticifyEqNumber, insertDisplayMath, insertTheoremCallout, insertProof } from 'utils/plugin';
import { MathIndexManager } from 'index/manager';
import { DependencyNotificationModal, MigrationModal, PluginSplitNoticeModal, RenameNoticeModal } from 'notice';
import { LinkAutocomplete } from 'search/editor-suggest';
import { MathSearchModal } from 'search/modal';
import { TheoremCalloutInfo, createTheoremCalloutsField } from 'theorem-callouts/state-field';
import { patchLinkCompletion } from 'patches/link-completion';
import { patchPagePreview } from 'patches/page-preview';
import { createProofDecoration } from 'proof/live-preview';
import { createProofProcessor } from 'proof/reading-view';
import { MathBlock } from 'index/typings/markdown';


export const VAULT_ROOT = '/';


export default class LatexReferencer extends Plugin {
	settings: Record<string, Partial<MathContextSettings>>;
	extraSettings: ExtraSettings;
	excludedFiles: string[];
	dependencies: Record<string, { id: string, name: string, version: string }> = {
		"mathlinks": { id: "mathlinks", name: "MathLinks", version: "0.5.3" }
	};
	indexManager: MathIndexManager;
	editorExtensions: Extension[];
	theoremCalloutsField: StateField<RangeSet<TheoremCalloutInfo>>;
	/** 
	 * Stores the last linktext that triggered a hover page preview.
	 * Used by reading view renderers to display theorem/equation numbers in hover previews.
	 * Set by page-preview patch, consumed by theorem-callouts/renderer and equations/reading-view.
	 */
	lastHoverLinktext: string | null;

	async onload() {

		/** Settings */

		const data = await this.loadData();
		const first = data === null;
		const { version } = data ?? {};

		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new MathSettingTab(this.app, this));

		/** Dependencies check */

		this.app.workspace.onLayoutReady(async () => {
			const dependenciesOK = Object.keys(this.dependencies).every((id) => this.checkDependency(id));
			const v1 = !first && ((version as string | undefined)?.startsWith("1.") ?? true);

			if (v1 || version.localeCompare('2.2.0', undefined, { numeric: true }) < 0) {
				new RenameNoticeModal(this).open();
			}

			if (v1 || version.localeCompare('2.3.0', undefined, { numeric: true }) < 0) {
				new PluginSplitNoticeModal(this).open();
			}

			if (!dependenciesOK || v1) {
				new DependencyNotificationModal(this, dependenciesOK, v1).open();
			}
		});


		/** Indexing */

		this.addChild((this.indexManager = new MathIndexManager(this, this.extraSettings)));
		this.app.workspace.onLayoutReady(async () => this.indexManager.initialize());
		// @ts-ignore
		(window['mathIndex'] = this.indexManager.index) && this.register(() => delete window['mathIndex'])

		// wait until the layout is ready to ensure MathLinks has been loaded when calling addProvider()
		this.app.workspace.onLayoutReady(() => {
			this.addChild(
				MathLinks.addProvider(this.app, (mathLinks) => new CleverefProvider(mathLinks, this))
			);
		});


		this.registerEvent(
			this.indexManager.on("local-settings-updated", async (file) => {
				// Add profile's tags as CSS classes
				this.app.workspace.iterateRootLeaves((leaf) => {
					if (leaf.view instanceof MarkdownView) {
						this.setProfileTagAsCSSClass(leaf.view);
					}
				});
			})
		);

		this.registerEvent(
			this.indexManager.on("global-settings-updated", async () => {
				// Add profile's tags as CSS classes
				this.app.workspace.iterateRootLeaves((leaf) => {
					if (leaf.view instanceof MarkdownView) {
						this.setProfileTagAsCSSClass(leaf.view);
					}
				});
			})
		);


		/** Add profile's tags as CSS classes */

		this.app.workspace.onLayoutReady(() => {
			this.app.workspace.iterateRootLeaves((leaf) => {
				if (leaf.view instanceof MarkdownView) {
					this.setProfileTagAsCSSClass(leaf.view);
				}
			});
		});

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				if (leaf?.view instanceof MarkdownView) {
					this.setProfileTagAsCSSClass(leaf.view);
				}
			})
		);


		/** Commands */
		this.registerCommands();


		/** Editor Extensions */
		this.editorExtensions = []
		this.registerEditorExtension(this.editorExtensions);
		this.updateEditorExtensions();


		/** Theorem/equation link autocompletion */
		this.updateLinkAutocomplete();
		this.app.workspace.onLayoutReady(() => patchLinkCompletion(this));
		const itemNormalizer = (item: MathBlock) => {
			return {
				linktext: item.$file,
				sourcePath: '',
				line: item.$position.start,
			};
		};
		registerQuickPreview(this.app, this, LinkAutocomplete, itemNormalizer);
		registerQuickPreview(this.app, this, MathSearchModal, itemNormalizer);

		/** Markdown post processors */

		// theorem callouts
		this.registerMarkdownPostProcessor(createTheoremCalloutPostProcessor(this));

		// equation numbers
		this.registerMarkdownPostProcessor(createEquationNumberProcessor(this));

		// proof environments
		this.registerMarkdownPostProcessor(createProofProcessor(this));

		// patch hover page preview to display theorem numbers in it
		this.lastHoverLinktext = null;
		this.app.workspace.onLayoutReady(() => patchPagePreview(this));

		/** File menu */

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				menu.addSeparator()
					.addItem((item) => {
						item.setTitle(`${this.manifest.name}: Open local settings`)
							.onClick(() => {
								new ContextSettingModal(this.app, this, file).open();
							});
					})
					.addSeparator();
			})
		);
	}

	async loadSettings() {
		this.settings = { [VAULT_ROOT]: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) };
		this.extraSettings = JSON.parse(JSON.stringify(DEFAULT_EXTRA_SETTINGS));
		this.excludedFiles = [];

		const loadedData = await this.loadData();
		if (loadedData) {
			const { settings, extraSettings, excludedFiles,
				// dumpedProjects 
			} = loadedData;
			for (const path in settings) {
				if (path != VAULT_ROOT) {
					this.settings[path] = {};
				}
				for (const _key in DEFAULT_SETTINGS) {
					const key = _key as keyof MathContextSettings;
					let val = settings[path][key];
					if (val !== undefined) {
						if (key in UNION_TYPE_MATH_CONTEXT_SETTING_KEYS) {
							const allowableValues = UNION_TYPE_MATH_CONTEXT_SETTING_KEYS[key];
							if (!(allowableValues?.includes(val))) {
								// invalid value encountered, substitute the default value instead
								val = DEFAULT_SETTINGS[key];
							}
						}
						if (typeof val == typeof DEFAULT_SETTINGS[key]) {
							// @ts-ignore
							this.settings[path][key] = val;
						}
					}
				}
			}

			for (const _key in DEFAULT_EXTRA_SETTINGS) {
				const key = _key as keyof ExtraSettings;
				let val = extraSettings[key];
				if (val !== undefined) {
					if (key in UNION_TYPE_EXTRA_SETTING_KEYS) {
						const allowableValues = UNION_TYPE_EXTRA_SETTING_KEYS[key];
						if (!(allowableValues?.includes(val))) {
							val = DEFAULT_EXTRA_SETTINGS[key];
						}
					}
					if (typeof val == typeof DEFAULT_EXTRA_SETTINGS[key]) {
						(this.extraSettings[key] as ExtraSettings[keyof ExtraSettings]) = val;
					}
				}
			}

			this.excludedFiles = excludedFiles;
		}
	}

	async saveSettings() {
		await this.saveData({
			version: this.manifest.version,
			settings: this.settings,
			extraSettings: this.extraSettings,
			excludedFiles: this.excludedFiles,
		});
	}

	updateLinkAutocomplete() {
		// reset editor suggest(s) registered by this plugin
		const suggestManager = (this.app.workspace as any).editorSuggest;
		for (const suggest of suggestManager.suggests) {
			if (suggest instanceof LinkAutocomplete) suggestManager.removeSuggest(suggest);
		}

		this.registerEditorSuggest(new LinkAutocomplete(this));
	}

	/**
	 * Return true if the required plugin with the specified id is enabled and its version matches the requriement.
	 * @param id 
	 * @returns 
	 */
	checkDependency(id: string): boolean {
		if (!this.app.plugins.enabledPlugins.has(id)) {
			return false;
		}
		const depPlugin = this.app.plugins.getPlugin(id);
		if (depPlugin) {
			return !isPluginOlderThan(depPlugin, this.dependencies[id].version)
		}
		return false;
	}

	setProfileTagAsCSSClass(view: MarkdownView) {
		if (!view.file) return;
		const profile = getProfile(this, view.file);
		// Generate both old (math-booster-*) and new (latex-referencer-*) class names for backward compatibility
		const classes = [
			...profile.meta.tags.map((tag) => `math-booster-${tag}`), // deprecated - maintained for custom CSS compatibility
			...profile.meta.tags.map((tag) => `latex-referencer-${tag}`),
		];
		for (const el of [getMarkdownSourceViewEl(view), getMarkdownPreviewViewEl(view)]) {
			if (el) {
				el.classList.forEach((cls) => {
					if (cls.startsWith("math-booster-") || cls.startsWith("latex-referencer-")) {
						el.classList.remove(cls);
					}
				});
				el?.addClass(...classes);
			}
		}
	}

	updateEditorExtensions() {
		this.editorExtensions.length = 0;

		// theorem callouts
		this.editorExtensions.push(this.theoremCalloutsField = createTheoremCalloutsField(this));
		this.editorExtensions.push(createTheoremCalloutNumberingViewPlugin(this));

		// equation numbers
		this.editorExtensions.push(createEquationNumberPlugin(this));

		// proofs
		if (this.extraSettings.enableProof) {
			this.editorExtensions.push(createProofDecoration(this));
		}

		this.app.workspace.updateOptions();
	}

	registerCommands() {
		this.addCommand({
			id: 'insert-display-math',
			name: 'Insert display math',
			editorCallback: insertDisplayMath,
		});

		this.addCommand({
			id: 'insert-theorem-callout',
			name: 'Insert theorem callout',
			editorCheckCallback: (checking, editor, context) => {
				if (!context.file) return false;

				if (!checking) {
					new TheoremCalloutModal(
						this.app, this, context.file,
						(config) => {
							insertTheoremCallout(editor, config);
						},
						"Insert", "Insert theorem callout",
					).open();
				}

				return true;
			}
		});

		this.addCommand({
			id: 'search',
			name: 'Search',
			callback: () => {
				new MathSearchModal(this).open();
			}
		})

		this.addCommand({
			id: 'open-local-settings-for-current-note',
			name: 'Open local settings for the current note',
			callback: () => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view?.file) {
					new ContextSettingModal(this.app, this, view.file).open();
				}
			}
		});

		this.addCommand({
			id: 'insert-proof',
			name: 'Insert proof',
			editorCallback: (editor, context) => insertProof(this, editor, context)
		});

		this.addCommand({
			id: 'convert-equation-number-to-tag',
			name: 'Convert equation numbers in the current note to static \\tag{}',
			callback: () => {
				const file = this.app.workspace.getActiveFile();
				if (file) staticifyEqNumber(this, file);
			}
		});

		this.addCommand({
			id: 'migrate-from-v1',
			name: 'Migrate from version 1',
			callback: () => {
				new MigrationModal(this).open();
			}
		});
	}
}
