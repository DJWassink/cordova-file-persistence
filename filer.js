/**
 * File helper for Cordova based applications
 * Doesn't support nested paths!
 */

export default function InstantiateFileSystem(name, persistent = true, size = 0) {
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

class Filer {
    constructor(directory) {
        if (!directory) throw new Error('No filesystem directory instantiated');

        this.directory = directory;
    }

    getFileUrl(path) {
        return new Promise((resolve, reject) => {
            this.directory.getFile(path, {create: false, exclusive: true}, fileEntry => {
                resolve(fileEntry.toURL());
            }, reject)
        })
    }

    readFile(path) {
        return new Promise((resolve, reject) => {

            this.directory.getFile(path, {create: false, exclusive: true}, fileEntry => {

                fileEntry.file((file) => {
                    const reader = new FileReader();

                    reader.onloadend = function () {
                        resolve(this.result);
                    };

                    reader.readAsText(file); //todo something else then text?
                })
            }, reject)
        })
    }

    readBinaryFile(path) {
        return new Promise((resolve, reject) => {
            this.directory.getFile(path, {create: false, exclusive: true}, fileEntry => {
                fileEntry.file(file => {
                    const reader = new FileReader();

                    reader.onloadend = function () {
                        resolve(this.result);
                    };

                    reader.readAsArrayBuffer(file);
                })
            }, reject)
        })
    }

    writeNewFile(path, blob) {
        if (blob.constructor.name != 'Blob') {
            console.warn('Given file is not of the type Blob, assuming text/plain');
            blob = new Blob([blob], {type: 'text/plain'});
        }

        return new Promise((resolve, reject) => {
            this.directory.getFile(path, {create: true, exclusive: true}, fileEntry => {
                fileEntry.createWriter(fileWriter => {

                    fileWriter.onwriteend = resolve;
                    fileWriter.onerror = reject;

                    fileWriter.write(blob);
                })
            }, reject)
        })
    }

    reserveNewFile(path) {
        return new Promise((resolve, reject) => {
            this.directory.getFile(path, {create: true, exclusive: true}, fileEntry => {
                resolve(fileEntry);
            }, reject);
        })
    }

    updateFile(path, blob) {
        if (blob.constructor.name != 'Blob') {
            console.warn('Given file is not of the type Blob, assuming text/plain');
            blob = new Blob([blob], {type: 'text/plain'});
        }

        return new Promise((resolve, reject) => {
            this.directory.getFile(path, {create: false, exclusive: false}, fileEntry => {
                fileEntry.createWriter(fileWriter => {
                    fileWriter.onwriteend = resolve;
                    fileWriter.onerror = reject;

                    fileWriter.write(blob);
                })
            }, reject)
        })
    }

    fileExists(path) {
        return new Promise((resolve, reject) => {
            this.directory.getFile(path, {create: false, exclusive: true}, fileEntry => {
                resolve(fileEntry.isFile);
            }, (err) => {
                if (err.name == "NotFoundError" || err.name == "NOT_FOUND_ERR" || err.code === 1) {
                    resolve(false);
                } else {
                    reject(err);
                }
            })
        })
    }

    deleteFile(path) {
        return new Promise((resolve, reject) => {
            this.directory.getFile(path, {create: false, exclusive: true}, fileEntry => {
                fileEntry.remove(resolve, reject)
            }, reject)
        })
    }
}