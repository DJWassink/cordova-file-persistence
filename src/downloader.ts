import InitFiler, {Filer} from './filer'
import Throttle from 'promise-parallel-throttle'
import {IsLocalUrl, IsCordovaBrowserApp, StripUrl} from './util'

export interface UrlPair {
    url: string,
    fileSystemUrl: string
}

declare class FileTransfer {
    download(remoteUrl:string, localUrl:string, success:Function, failure:Function, trustAllSource:boolean, options:Object);
}

/**
 * Takes a list of urls and returns a list of key value pairs with the urls and their local copy.
 * @param storageName root folder where the files should be saved to
 * @param urls array of remote urls to process
 * @param statusUpdateCallback callback with a percentage how much is done
 * @returns {Promise}
 */
export default function (storageName:string, urls:Array<string>, statusUpdateCallback:Function):Promise<Array<UrlPair>> {
    return new Promise(async (resolve, reject) => {
        if (IsCordovaBrowserApp()) reject(new Error('Invalid environment, either a browser or not a cordova app.'));

        try {
            const filesystemUrls = await ResolveFilesystemUrls(storageName, urls, statusUpdateCallback);
            resolve(filesystemUrls);
        } catch (error) {
            reject(error);
        }
    })
}

/**
 * Resolves a list of urls with a local counterpart, either download the files if they are not preset on the
 * local filesystem or return the already existing copy.
 * @param storageName
 * @param urls
 * @param statusUpdateCallback
 * @returns {Promise}
 */
const ResolveFilesystemUrls = (storageName:string, urls:Array<string>, statusUpdateCallback:Function):Promise<Array<UrlPair>> => {
    return new Promise(async(resolve, reject) => {
        try {
            const myFiler = await InitFiler(storageName);
            const tasks = urls.map(url => () => DownloadTask(url, myFiler));
            const result = await Throttle.raw(tasks, 3, false, (status) => {
                statusUpdateCallback(100 / (urls.length) * status.amountDone)
            });

            //remove failed files, if any
            if (result.rejectedIndexes.length) {
                RemoveFiles(result.rejectedIndexes.map(i => urls[i]), myFiler);
                reject(new Error('Some files failed'));
            } else {
                resolve(result.taskResults);
            }
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Task which handles the download of a single file.
 * @param url
 * @param filer
 * @returns {Promise}
 */
const DownloadTask = (url:string, filer:Filer):Promise<UrlPair> => {
    return new Promise(async(resolve, reject) => {
        //if already is a local url, we don't need to download it
        if (IsLocalUrl(url)) return resolve({url: url, fileSystemUrl: url});

        //else try to download it.
        try {
            const fileName = StripUrl(url);

            const exists = await filer.fileExists(fileName);
            if (!exists) {
                const entry = await filer.reserveNewFile(fileName);
                await DownloadFile(url, entry.toURL());
            }
            const filesystemUrl = await filer.getFileUrl(fileName);

            resolve({url: url, fileSystemUrl: filesystemUrl});
        } catch (error) {
            reject(error);
        }
    })
};

/**
 * Removes a list of urls from the local filesystem
 * @param urls
 * @param filer
 */
const RemoveFiles = (urls:Array<string>, filer:Filer) => {
    urls.forEach(url => filer.deleteFile(StripUrl(url)));
};

/**
 * Helper function to download a cordova file through the FileTransfer plugin.
 * @param remoteUrl
 * @param reservedLocalUrl
 * @returns {Promise}
 */
const DownloadFile = (remoteUrl:string, reservedLocalUrl:string):Promise<Entry> => {
    return new Promise((resolve, reject) => {
        const myFileTransfer = new FileTransfer();

        myFileTransfer.download(
            encodeURI(remoteUrl),
            reservedLocalUrl,
            resolve,
            reject,
            true,
            {
                chunkedMode: false,
                headers: {
                    Connection: 'close'
                }
            }
        );
    })
};


