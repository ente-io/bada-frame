import React from 'react';
import UploadService from 'services/uploadService';
import { getToken } from 'utils/storage/localStorage';
import DropzoneWrapper from './DropzoneWrapper';

function CollectionDropZone({
    children,
    closeModal,
    refetchData,
    collectionAndItsLatestFile,
    setProgressView,
    progressBarProps,
    setBannerErrorCode,
    setUploadErrors,
}) {
    const upload = async (acceptedFiles) => {
        try {
            const token = getToken();
            closeModal();
            progressBarProps.setPercentComplete(0);
            setProgressView(true);

            await UploadService.uploadFiles(
                acceptedFiles,
                collectionAndItsLatestFile,
                token,
                progressBarProps,
                setUploadErrors
            );
            refetchData();
        } catch (err) {
            setBannerErrorCode(err.message);
            setProgressView(false);
        }
    };
    return (
        <DropzoneWrapper
            children={children}
            onDropAccepted={upload}
            onDropRejected={closeModal}
        />
    );
}

export default CollectionDropZone;
