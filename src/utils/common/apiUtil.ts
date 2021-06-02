export const getEndpoint = () => {
    const endPoint = process.env.NEXT_PUBLIC_ENTE_ENDPOINT ?? 'https://api.ente.io';
    return endPoint;
};

export const getFileUrl = (id: number, token: string) => {
    if (process.env.NEXT_PUBLIC_ENTE_ENDPOINT !== undefined) {
        return `${process.env.NEXT_PUBLIC_ENTE_ENDPOINT}/files/download/${id}` ?? 'https://api.ente.io';
    }
    return `https://files.ente.workers.dev/?fileID=${id}&token=${token}`;
};

export const getThumbnailUrl = (id: number, token: string) => {
    if (process.env.NEXT_PUBLIC_ENTE_ENDPOINT !== undefined) {
        return `${process.env.NEXT_PUBLIC_ENTE_ENDPOINT}/files/preview/${id}` ?? 'https://api.ente.io';
    }
    return `https://thumbnails.ente.workers.dev/?fileID=${id}&token=${token}`;
};
