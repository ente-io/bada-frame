import constants from 'utils/strings/constants';

export const errorCodes = {
    ERR_STORAGE_LIMIT_EXCEEDED: '426',
    ERR_NO_ACTIVE_SUBSCRIPTION: '402',
    ERR_NO_INTERNET_CONNECTION: '1',
    ERR_SESSION_EXPIRED: '401',
    ERR_KEY_MISSING: '2',
    ERR_FORBIDDEN: '403',
};

const AXIOS_NETWORK_ERROR = 'Network Error';

export const SUBSCRIPTION_VERIFICATION_ERROR = 'Subscription verification failed';

export const THUMBNAIL_GENERATION_FAILED = 'thumbnail generation failed';
export const VIDEO_PLAYBACK_FAILED = 'video playback failed';

export const FFMPEG_LOAD_FAILED = 'browser doesn\'t support ffmpeg';

export function ErrorHandler(error) {
    let errorMessage = null;
    if (error?.status) {
        const errorCode = error.status.toString();
        switch (errorCode) {
            case errorCodes.ERR_NO_ACTIVE_SUBSCRIPTION:
                errorMessage = constants.SUBSCRIPTION_EXPIRED;
                break;
            case errorCodes.ERR_STORAGE_LIMIT_EXCEEDED:
                errorMessage = constants.STORAGE_QUOTA_EXCEEDED;
                break;
            case errorCodes.ERR_NO_INTERNET_CONNECTION:
                errorMessage = constants.NO_INTERNET_CONNECTION;
                break;
            case errorCodes.ERR_SESSION_EXPIRED:
                errorMessage = constants.SESSION_EXPIRED_MESSAGE;
                break;
        }
    } else if (error.message === AXIOS_NETWORK_ERROR) {
        errorMessage = constants.SYNC_FAILED;
    }
    if (errorMessage) {
        throw new Error(errorMessage);
    }
}
