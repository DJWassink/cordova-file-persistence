/**
 * File helper for Cordova based applications
 * Doesn't support nested paths!
 */
declare const LocalFileSystem: any;

export default function InstantiateFileSystem(name: string, persistent = true, size = 0): Promise<Filer> {
    return new Promise((resolve, reject) => {
        document.addEventListener('deviceready', () => {

            window.requestFileSystem(persistent ? LocalFileSystem.PERSISTENT : window.TEMPORARY, size, fs => {

                fs.root.getDirectory(name, {create: true}, (dirEntry) => {
                    resolve(new Filer(dirEntry));
                }, reject);

            }, reject);

        }, false);
    });
}

export class Filer {
    private directory: DirectoryEntry;

    constructor(directory: DirectoryEntry) {
        if (!directory) throw new Error('No filesystem directory instantiated');

        this.directory = directory;
    }

    public getFileUrl(path: string): Promise<String> {
        return new Promise((resolve, reject) => {
            this.directory.getFile(path, {create: false, exclusive: true}, fileEntry => {
                resolve(fileEntry.toURL());
            }, reject)
        })
    }

    public reserveNewFile(path: string): Promise<FileEntry> {
        return new Promise((resolve, reject) => {
            this.directory.getFile(path, {create: true, exclusive: true}, fileEntry => {
                resolve(fileEntry);
            }, reject);
        })
    }

    public fileExists(path: string): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            this.directory.getFile(path, {create: false, exclusive: true}, fileEntry => {
                resolve(fileEntry.isFile);
            }, (err) => {
                if (err.name === 'NotFoundError' || err.name === 'NOT_FOUND_ERR' || (err as any).code === 1) {
                    resolve(false);
                } else {
                    reject(err);
                }
            })
        })
    }

    public deleteFile(path: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.directory.getFile(path, {create: false, exclusive: true}, fileEntry => {
                fileEntry.remove(resolve, reject)
            }, reject)
        })
    }
}
