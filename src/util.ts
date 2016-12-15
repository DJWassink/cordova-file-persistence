interface MyWindow extends Window {
    cordova: any;
}
declare const window: MyWindow;

/**
 * Generates a regex which should pass the given domain
 * @param domain
 * @returns {RegExp}
 */
export const GenerateUrlRegex = (domain:string):RegExp => {
    const currentSchema = domain.includes('https://') ? 'https://' : 'http://';
    const replacedStorageUrl = domain.replace(currentSchema, 'https?://');
    return new RegExp(replacedStorageUrl + '[^,.^;]*\.[a-z0-9]*', 'ig');
};

/**
 * Strip a url (file) of its path and invalid characters.
 * @param url
 * @returns string
 */
export const StripUrl = (url:string):string => encodeURI((url.split('/').pop() as string).replace(/ /g, '_'));

const localUrlSchemas = ['file://', 'ms-appx://', 'ms-appdata://'];
export const IsLocalUrl = (url:string):boolean => localUrlSchemas.some(localSchema => url.includes(localSchema));
export const ApplyPrefixIfNecessary = (prefix:string, url:string):string => ((IsLocalUrl(url) || url.includes(prefix)) ? url : (prefix + url));

export const UniqueArray = (array:Array<any>):Array<any> => array.filter((value, index, self) => self.indexOf(value) === index);

export const IsCordovaApp = ():boolean => !!window.cordova;
export const IsCordovaBrowserApp = ():boolean => (IsCordovaApp() && window.cordova.platformId === 'browser');