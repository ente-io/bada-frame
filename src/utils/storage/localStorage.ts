export enum LS_KEYS {
    USER = 'user',
    SESSION = 'session',
    KEY_ATTRIBUTES = 'keyAttributes',
}

export const setData = (key: LS_KEYS, value: object) => {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    localStorage.setItem(key, JSON.stringify(value));
};

export const getData = (key: LS_KEYS) => {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    return JSON.parse(localStorage.getItem(key));
};

export const clearData = () => {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    localStorage.clear();
};

export const getToken = () => {
    return getData(LS_KEYS.USER)?.token;
};
