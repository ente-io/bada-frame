import { KEK } from 'pages/generate';
import { B64EncryptionResult } from 'services/uploadService';
import { KeyAttributes } from 'types';
import * as Comlink from 'comlink';
import { runningInBrowser } from 'utils/common';
import { SESSION_KEYS, setKey } from 'utils/storage/sessionStorage';
import { getData, LS_KEYS, setData } from 'utils/storage/localStorage';
import { getActualKey, getToken } from 'utils/common/key';
import { SetRecoveryKey } from 'services/userService';
import { isFirstLogin } from 'utils/storage';
import constants from 'utils/strings/constants';

const CryptoWorker: any =
    runningInBrowser() &&
    Comlink.wrap(new Worker('worker/crypto.worker.js', { type: 'module' }));

export const getDedicatedCryptoWorker = (): any =>
    runningInBrowser() &&
    Comlink.wrap(new Worker('worker/crypto.worker.js', { type: 'module' }));

export async function generateAndSaveIntermediateKeyAttributes(
    passphrase,
    existingKeyAttributes,
    key
) {
    const cryptoWorker = await new CryptoWorker();
    const intermediateKekSalt: string =
        await cryptoWorker.generateSaltToDeriveKey();
    const intermediateKek: KEK = await cryptoWorker.deriveIntermediateKey(
        passphrase,
        intermediateKekSalt
    );
    const encryptedKeyAttributes: B64EncryptionResult =
        await cryptoWorker.encryptToB64(key, intermediateKek.key);

    const updatedKeyAttributes = Object.assign(existingKeyAttributes, {
        kekSalt: intermediateKekSalt,
        encryptedKey: encryptedKeyAttributes.encryptedData,
        keyDecryptionNonce: encryptedKeyAttributes.nonce,
        opsLimit: intermediateKek.opsLimit,
        memLimit: intermediateKek.memLimit,
    });
    setData(LS_KEYS.KEY_ATTRIBUTES, updatedKeyAttributes);
}

export const setSessionKeys = async (key: string) => {
    const cryptoWorker = await new CryptoWorker();
    const sessionKeyAttributes = await cryptoWorker.encryptToB64(key);
    setKey(SESSION_KEYS.ENCRYPTION_KEY, sessionKeyAttributes);
};

export const getRecoveryKey = async () => {
    let recoveryKey = null;
    try {
        const cryptoWorker = await new CryptoWorker();

        const keyAttributes: KeyAttributes = getData(LS_KEYS.KEY_ATTRIBUTES);
        const {
            recoveryKeyEncryptedWithMasterKey,
            recoveryKeyDecryptionNonce,
        } = keyAttributes;
        const masterKey = await getActualKey();
        if (recoveryKeyEncryptedWithMasterKey) {
            recoveryKey = await cryptoWorker.decryptB64(
                recoveryKeyEncryptedWithMasterKey,
                recoveryKeyDecryptionNonce,
                masterKey
            );
        } else {
            recoveryKey = await createNewRecoveryKey();
        }
        recoveryKey = await cryptoWorker.toHex(recoveryKey);
    } catch (e) {
        console.error('getRecoveryKey failed', e);
    } finally {
        return recoveryKey;
    }
};

async function createNewRecoveryKey() {
    const masterKey = await getActualKey();
    const existingAttributes = getData(LS_KEYS.KEY_ATTRIBUTES);

    const cryptoWorker = await new CryptoWorker();

    const recoveryKey = await cryptoWorker.generateEncryptionKey();
    const encryptedMasterKey: B64EncryptionResult =
        await cryptoWorker.encryptToB64(masterKey, recoveryKey);
    const encryptedRecoveryKey: B64EncryptionResult =
        await cryptoWorker.encryptToB64(recoveryKey, masterKey);
    const recoveryKeyAttributes = {
        masterKeyEncryptedWithRecoveryKey: encryptedMasterKey.encryptedData,
        masterKeyDecryptionNonce: encryptedMasterKey.nonce,
        recoveryKeyEncryptedWithMasterKey: encryptedRecoveryKey.encryptedData,
        recoveryKeyDecryptionNonce: encryptedRecoveryKey.nonce,
    };
    await SetRecoveryKey(getToken(), recoveryKeyAttributes);

    const updatedKeyAttributes = Object.assign(
        existingAttributes,
        recoveryKeyAttributes
    );
    setData(LS_KEYS.KEY_ATTRIBUTES, updatedKeyAttributes);

    return recoveryKey;
}

export const verifyPassphrase = async (
    passphrase: string,
    keyAttributes: KeyAttributes
) => {
    try {
        const cryptoWorker = await new CryptoWorker();
        const kek: string = await cryptoWorker.deriveKey(
            passphrase,
            keyAttributes.kekSalt,
            keyAttributes.opsLimit,
            keyAttributes.memLimit
        );

        try {
            const key: string = await cryptoWorker.decryptB64(
                keyAttributes.encryptedKey,
                keyAttributes.keyDecryptionNonce,
                kek
            );
            return key;
        } catch (e) {
            console.error(e);
            new Error(constants.INCORRECT_PASSPHRASE);
        }
    } catch (e) {
        new Error(`${constants.UNKNOWN_ERROR} ${e.message}`);
    }
};
export default CryptoWorker;
