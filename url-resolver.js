import Filer from './filer'
import NestedPropChecker from './NestedPropChecker'
import Throttle from 'promise-parallel-throttle'

let urlRegex = null;
let filePrefix = null;

export default function (storageName, nodes, storageUrl, urlPaths, filesUrlPrefix, downloadsDoneCallback) {
    return new Promise(async(resolve, reject) => {
        try {
            //if we are not in a Cordova app or are in the browser, don't alter the nodes
            if (!window.cordova || (window.cordova && window.cordova.platformId === 'browser')) {
                console.warn('We are in a browser, don\'t save the files');
                resolve(nodes);
                return;
            }

            urlRegex = GenerateUrlRegex(storageUrl);
            filePrefix = filesUrlPrefix;

            const urls = FindUrlsInNodes(nodes, urlPaths);
            const filesystemUrls = await ResolveFilesystemUrls(storageName, urls, downloadsDoneCallback);
            const updatedNodes = ReplaceUrlsInNodes(nodes, filesystemUrls);

            resolve(updatedNodes);
        } catch (err) {
            reject(err);
        }
    });
}

const GenerateUrlRegex = (storageUrl) => {
    if (storageUrl.includes('https://')) {
        storageUrl.replace('https://', 'https?://');
    } else {
        storageUrl.replace('http://', 'https?://');
    }
    return new RegExp(storageUrl + '[^,.^;]*\.[a-z0-9]*', 'ig');
};

const localUrlPrefixes = ['file://', 'ms-appx://', 'ms-appdata://'];
export const urlPrefix = (url, urlPrefix = filePrefix) => {
    if (!url || localUrlPrefixes.some(pre => url.includes(pre))) return url;
    return (!url.includes(urlPrefix)) ? (urlPrefix + url) : url;
};

const FindUrlsInNodes = (nodes, paths) => {
    const urls = [];

    nodes.forEach(node => {
        paths.forEach(path => {
            let url = NestedPropChecker.get(node, path);
            if (url) urls.push(url);
        })
    });

    //before we return the urls, filter them unique
    return urls.filter((value, index, self) => self.indexOf(value) === index);
};

const ResolveFilesystemUrls = (storageName, urls, downloadsDoneCallback) => {
    return new Promise(async(resolve, reject) => {

        try {
            const myFiler = await Filer(storageName);
            const tasks = urls.map(url => () => DownloadTask(url, myFiler));
            const result = await Throttle.raw(tasks, 3, false, (status) => {
                downloadsDoneCallback(100 / (urls.length) * status.amountDone)
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

const RemoveFiles = (paths, filer) => {
    paths.forEach(path => filer.deleteFile(path));
};

const DownloadTask = (url, filer) => {
    return new Promise(async(resolve, reject) => {
        try {
            const splittedName = url.split('/');
            const fileName = (splittedName[splittedName.length - 1]).replace(/ /g, '_');

            const exists = await filer.fileExists(fileName);
            if (!exists) {
                const entry = await filer.reserveNewFile(fileName);
                await DownloadFile(urlPrefix(url), entry.toURL());
            }
            const filesystemUrl = await filer.getFileUrl(fileName);

            resolve({url: url, fileSystemUrl: filesystemUrl});
        } catch (error) {
            reject(error);
        }
    })
};

const ReplaceUrlsInNodes = (nodes, urls) => {
    return nodes.map(node => {

        if (node.video && node.video.length) {
            const urlObj = urls.find(url => url.url == node.video);
            if (urlObj && urlObj.fileSystemUrl) node.video = urlObj.fileSystemUrl;
        }

        return node;
    });
};

const DownloadFile = (remoteUrl, localUrl) => {
    return new Promise((resolve, reject) => {
        const myFileTransfer = new FileTransfer();

        myFileTransfer.download(
            encodeURI(remoteUrl),
            localUrl,
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