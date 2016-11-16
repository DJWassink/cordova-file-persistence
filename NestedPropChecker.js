/**
 * Created by Dirk-Jan on 5-12-2015.
 */

export default class NestedPropChecker {

    static get(obj, path) {
        const props = path.trim().split('.');

        let currentObject = obj;
        for (let i = 0; i < props.length; i++) {
            if (!currentObject || !currentObject.hasOwnProperty(props[i])) {
                return undefined;
            }
            currentObject = currentObject[props[i]];
        }

        return currentObject;
    }

    static set(obj, path, value) {
        const props = path.trim().split('.');

        let currentObject = obj;
        for (let i = 0; i < props.length - 1; i++) {
            if (!currentObject || !currentObject.hasOwnProperty(props[i])) {
                return;
            }

            currentObject = currentObject[props[i]];
        }

        if (currentObject[props[props.length - 1]]) {
            currentObject[props[props.length - 1]] = value;
        }
    }

    static has(obj, path) {
        return this.get(obj, path) !== undefined;
    }

    static getMultiple(obj, array) {
        return array.map(x => this.get(obj, x));
    }

    static setMultiple(obj, keyValueArray) {
        keyValueArray.map(kv => this.set(obj, kv.key, kv.value));
    }
}