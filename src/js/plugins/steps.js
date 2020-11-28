import el from '../modules/element.js';
import plugins from '../modules/plugins.js';
import data from '../modules/data.js';
import observers from '../modules/observers.js';
import settings from '../modules/settings';

/**
 * {HTMLElement}
 */
let plugin;

/**
 * Display name
 * @type {string}
 */
const title = 'Steps to success';

/**
 * Internal identifier
 * @type {string}
 */
const key = 'steps';

/**
 * Can be removed by the user
 * @type {boolean}
 */
const optional = true;

/**
 * Watches for changes in the result list
 * @type {{args: {childList: boolean}, observer: MutationObserver, target: HTMLElement}}
 */
let observer;

/**
 * The different rankings of the game
 * @type {{}}
 */
const steps = {};

/**
 * maximal number of points in the game
 * @type {number}
 */
const allPoints = data.getPoints('answers');

/**
 * Watch the result list for changes
 * Partially initializes the observer, the rest is done in `observers.js` via `plugins.js`
 * @param {HTMLElement} target
 * @param {HTMLElement} frame
 * @returns {{args: {childList: boolean}, observer: MutationObserver, target: HTMLElement}}
 */
const initObserver = (target, frame) => {
    const _observer = new MutationObserver(mutationsList => {
        const node = mutationsList.pop().target;
        const title = el.$('.sb-modal-title', node);
        if (title && title.textContent.trim() === 'Rankings') {
            retrieveRankings(target, frame);
        }
    });
    return {
        observer: _observer, target: target, args: {
            childList: true
        }
    }
}

/**
 * Collect the points from the 'Rankings' overlay
 * @param {HTMLElement} modal
 * @param {HTMLElement} frame
 */
const retrieveRankings = (modal, frame) => {
    el.$$('.sb-modal-list li', modal).forEach(element => {
        const values = element.textContent.match(/([^\(]+) \((\d+)\)/);
        steps[values[1]] = parseInt(values[2], 10);
    });
    steps['Queen Bee'] = allPoints;
    el.$('.sb-modal-close', modal).click();
    observers.remove(observer.observer);
    update(frame);
}

/**
 * Populate/update pane
 * @param {HTMLElement} frame
 */
const update = (frame) => {
    frame.innerHTML = '';
    const tier = Object.values(steps).filter(entry => entry <= data.getPoints('foundTerms')).pop();
    for (const [key, value] of Object.entries(steps)) {
        frame.append(el.create({
            tag: 'tr',
            classNames: value === tier ? ['current'] : [],
            cellTag: 'td',
            cellData: [key, value]
        }));
    }
}


export default {
    /**
     * Create and attach plugin
     * @param app
     * @param game
     * @returns {HTMLElement|boolean}
     */
    add: (app, game) => {
        // if opted out
        if (settings.get(key) === false) {
            return false;
        }
        plugin = el.create({
            tag: 'details',
            text: [title, 'summary']
        });

        // add and populate content pane
        const pane = el.create({
            tag: 'table',
            classNames: ['pane']

        });
        const frame = el.create({
            tag: 'tbody'
        });
        pane.append(frame);

        // populate this when first opened
        // otherwise it could be that the modal overlay is still populated by the welcome screen
        // which as consequence would disappear
        plugin.addEventListener('toggle', () => {
            if (plugin.open && !frame.hasChildNodes()) {
                observer = initObserver(el.$('.sb-modal-wrapper'), frame);
                observers.add(observer.observer, observer.target, observer.args);
                el.$('.sb-progress', game).click();
            }
        });

        plugin.append(pane);

        // update on demand
        app.addEventListener('sbaUpdateComplete', () => {
            update(frame);
        });

        return plugins.add(app, plugin, key, title, optional);
    },
    /**
     * Remove plugin
     * @returns null
     */
    remove: () => {
        return plugins.remove(plugin, key, title);
    }
}