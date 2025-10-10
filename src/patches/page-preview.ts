import { around, } from 'monkey-around';
import { HoverParent, } from 'obsidian';
import LatexReferencer from '../main';

// Inspired by Hover Editor (https://github.com/nothingislost/obsidian-hover-editor/blob/c038424acb15c542f0ad5f901d74c75d4316f553/src/main.ts#L396)

// Save the last linktext that triggered hover page preview in the plugin instance to display theorem/equation numbers in it

export const patchPagePreview = (plugin: LatexReferencer,) => {
  const { app, } = plugin;

  plugin.register(
    // @ts-expect-error - internal plugin type is not exported/stable
    around(app.internalPlugins.plugins['page-preview'].instance.constructor.prototype, {
      onLinkHover(old: (...args: unknown[]) => unknown,) {
        return function(
          parent: HoverParent,
          targetEl: HTMLElement,
          linktext: string,
          ...args: unknown[]
        ) {
          old.call(this, parent, targetEl, linktext, ...args,);
          // Save the linktext in the plugin instance
          plugin.lastHoverLinktext = linktext;
        };
      },
    },),
  );
};
