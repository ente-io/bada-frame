import { errorCodes } from './errorUtil';

const TwoSecondInMillSeconds = 2000;
const DESKTOP_APP_DOWNLOAD_URL = 'https://github.com/ente-io/bhari-frame/releases/';

export function checkConnectivity() {
    if (navigator.onLine) {
        return true;
    }
    throw new Error(errorCodes.ERR_NO_INTERNET_CONNECTION);
}

export function runningInBrowser() {
    return typeof window !== 'undefined';
}

export async function WaitFor2Seconds() {
    await new Promise((resolve) => {
        setTimeout(() => resolve(null), TwoSecondInMillSeconds);
    });
}

export function downloadApp() {
    const win = window.open(DESKTOP_APP_DOWNLOAD_URL, '_blank');
    win.focus();
}

export function reverseString(title: string) {
    return title
        ?.split(' ')
        .reduce((reversedString, currWord) => `${currWord} ${reversedString}`);
}

export async function retryPromise(promise: Promise<any>, retryCount: number = 2) {
    try {
        const resp = await promise;
        return resp;
    } catch (e) {
        if (retryCount > 0) {
            await retryPromise(promise, retryCount - 1);
        } else {
            throw e;
        }
    }
}
