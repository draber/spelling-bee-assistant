import el from '../modules/element.js';
import {
    prefix
} from '../modules/string.js';
import Plugin from '../modules/plugin.js';
import settings from '../modules/settings.js';

/**
 * Dark Mode plugin
 *
 * @param {App} app
 * @returns {Plugin} DarkMode
 */
class DarkMode extends Plugin {

    toggle(state) {
        settings.set(`options.${this.key}`, state);
        el.$('body').classList.toggle(prefix('dark', 'd'), state);
        return this;
    }

    constructor(app) {

        super(app, 'Dark Mode', {
            canDeactivate: true,
            defaultActive: false
        });

        this.enableTool('darkMode', 'Dark mode on', 'Dark mode off');

        this.toggle(this.isActive());
        this.add();
    }
}

export default DarkMode;