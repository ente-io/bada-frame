import { getEndpoint } from 'utils/common/apiUtil';
import HTTPService from './HTTPService';
import * as Comlink from 'comlink';
import localForage from 'localforage';
import { collection } from './collectionService';

const CryptoWorker: any =
    typeof window !== 'undefined' &&
    Comlink.wrap(new Worker('worker/crypto.worker.js', { type: 'module' }));
const ENDPOINT = getEndpoint();

localForage.config({
    driver: localForage.INDEXEDDB,
    name: 'ente-files',
    version: 1.0,
    storeName: 'files',
});

export interface fileAttribute {
    encryptedData: Uint8Array | string;
    decryptionHeader: string;
    creationTime: number;
    fileType: number;
}

export interface user {
    id: number;
    name: string;
    email: string;
}


export interface file {
    id: number;
    collectionID: number;
    file: fileAttribute;
    thumbnail: fileAttribute;
    metadata: fileAttribute;
    encryptedKey: string;
    keyDecryptionNonce: string;
    key: string;
    src: string;
    msrc: string;
    html: string;
    w: number;
    h: number;
    isDeleted: boolean;
    dataIndex: number;
    updationTime: number;
}

export async function* fetchData(token, collections): AsyncGenerator<[file[], boolean]> {

    for await (let resp of fetchFiles(token, collections)) {
        yield (
            [resp[0].map((item) => ({
                ...item,
                w: window.innerWidth,
                h: window.innerHeight,
            })), resp[1]]
        );
    }
}

export const getLocalFiles = async () => {
    let files: Array<file> = (await localForage.getItem<file[]>('files')) || [];
    return files;
}

export async function* fetchFiles(
    token: string,
    collections: collection[]
): AsyncGenerator<[file[], boolean]> {

    let files = await getLocalFiles();
    yield [files, true];
    for await (let collection of collections) {
        let updateRequired = false;
        for await (let fetchedFiles of getFiles([collection], null, "100", token)) {
            if (fetchedFiles.length !== 0)
                updateRequired = true;
            files.push(...fetchedFiles);
            var latestFiles = new Map<string, file>();
            files.forEach((file) => {
                let uid = `${file.collectionID}-${file.id}`;
                if (!latestFiles.has(uid) || latestFiles.get(uid).updationTime < file.updationTime) {
                    latestFiles.set(uid, file);
                }
            });
            files = [];
            for (const [_, file] of latestFiles.entries()) {
                if (!file.isDeleted)
                    files.push(file);
            }
            files = files.sort(
                (a, b) => b.metadata.creationTime - a.metadata.creationTime
            );
            await localForage.setItem('files', files);

        }
        yield [files, updateRequired];
    }
};

export async function* getFiles(collections: collection[], sinceTime: string, limit: string, token: string): AsyncGenerator<file[]> {
    try {
        const worker = await new CryptoWorker();
        for (const index in collections) {
            const collection = collections[index];
            if (collection.isDeleted) {
                // TODO: Remove files in this collection from localForage and cache
                continue;
            }
            let time =
                sinceTime || (await localForage.getItem<string>(`${collection.id}-time`)) || "0";
            let resp;
            do {
                resp = await HTTPService.get(`${ENDPOINT}/collections/diff`, {
                    collectionID: collection.id,
                    sinceTime: time,
                    limit,
                },
                    {
                        'X-Auth-Token': token
                    });
                var response: Promise<file[]> = Promise.all(resp.data.diff.map(
                    async (file: file): Promise<file> => {
                        if (!file.isDeleted) {

                            file.key = await worker.decryptB64(
                                file.encryptedKey,
                                file.keyDecryptionNonce,
                                collection.key
                            );
                            file.metadata = await worker.decryptMetadata(file);
                        }
                        return file;
                    }
                ));
                yield response;

                if (resp.data.diff.length) {
                    time = resp.data.diff.slice(-1)[0].updationTime.toString();
                }
            } while (resp.data.diff.length);
            await localForage.setItem(`${collection.id}-time`, time);
        }
    } catch (e) {
        console.log("Get files failed" + e);
    }
}
export const getPreview = async (token: string, file: file) => {
    try {
        const cache = await caches.open('thumbs');
        const cacheResp: Response = await cache.match(file.id.toString());
        if (cacheResp) {
            return URL.createObjectURL(await cacheResp.blob());
        }
        const resp = await HTTPService.get(
            `${ENDPOINT}/files/preview/${file.id}`,
            null,
            { 'X-Auth-Token': token },
            { responseType: 'arraybuffer' }
        );
        const worker = await new CryptoWorker();
        const decrypted: any = await worker.decryptThumbnail(
            new Uint8Array(resp.data),
            await worker.fromB64(file.thumbnail.decryptionHeader),
            file.key
        );
        try {
            await cache.put(file.id.toString(), new Response(new Blob([decrypted])));
        } catch (e) {
            // TODO: handle storage full exception.
        }
        return URL.createObjectURL(new Blob([decrypted]));
    } catch (e) {
        console.log("get preview Failed" + e);
    }
};

export const getFile = async (token: string, file: file) => {
    try {
        const resp = await HTTPService.get(
            `${ENDPOINT}/files/download/${file.id}`,
            null,
            { 'X-Auth-Token': token },
            { responseType: 'arraybuffer' }
        );
        const worker = await new CryptoWorker();
        const decrypted: any = await worker.decryptFile(
            new Uint8Array(resp.data),
            await worker.fromB64(file.file.decryptionHeader),
            file.key
        );
        return URL.createObjectURL(new Blob([decrypted]));
    }
    catch (e) {
        console.log("get file failed " + e);
    }
};

