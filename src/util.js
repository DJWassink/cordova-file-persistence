export const GenerateUrlRegex = (storageUrl) => {
    const currentSchema = storageUrl.includes('https://') ? 'https://' : 'http://';
    const replacedStorageUrl = storageUrl.replace(currentSchema, 'https?://');
    return new RegExp(replacedStorageUrl + '[^,.^;]*\.[a-z0-9]*', 'ig');
};

const localUrlSchemas = ['file://', 'ms-appx://', 'ms-appdata://'];
export const IsLocalUrl = (url) => localUrlSchemas.some(localSchema => url.includes(localSchema));
export const ApplyPrefixIfNecessary = (prefix, url) => ((IsLocalUrl(url) || url.includes(prefix)) ? url : (prefix + url));

export const UniqueArray = (array) => array.filter((value, index, self) => self.indexOf(value) === index);

export const IsCordovaApp = () => !!window.cordova;
export const IsCordovaBrowserApp = () => (IsCordovaApp() && window.cordova.platformId === 'browser');
