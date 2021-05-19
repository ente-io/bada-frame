import React, { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { deleteUser, logoutUser } from 'services/userService';
import { KeyAttributes } from 'types';
import { verifyPassphrase } from 'utils/crypto';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import constants from 'utils/strings/constants';
import MessageDialog, { SetDialogMessage } from './MessageDialog';
import SingleInputForm from './SingleInputForm';

interface Props {
    show: boolean;
    onHide: () => void;
    setDialogMessage: SetDialogMessage;
}
const AccountDeleteModal = (props: Props) => {
    const [keyAttributes, setKeyAttributes] = useState<KeyAttributes>();
    useEffect(() => {
        const keyAttributes = getData(LS_KEYS.KEY_ATTRIBUTES);
        setKeyAttributes(keyAttributes);
    }, []);
    const deleteAccount = async (passphrase) => {
        try {
            await verifyPassphrase(passphrase, keyAttributes);
            const isSubscriptionCancelled = await deleteUser();
            props.onHide();
            if (!isSubscriptionCancelled) {
                props.setDialogMessage({
                    title: constants.ACCOUNT_DELETED,
                    content: constants.SUBSCRIPTION_CANCELLED_PENDING,
                    proceed: {
                        text: constants.OK,
                        action: logoutUser,
                        variant: 'secondary',
                    },
                    nonClosable: true,
                });
            } else {
                logoutUser();
            }
        } catch (e) {
            props.setDialogMessage({
                title: constants.ERROR,
                content: constants.UNKNOWN_ERROR,
                proceed: {
                    text: constants.OK,
                    action: () => null,
                    variant: 'danger',
                },
            });
        }
    };
    return (
        <MessageDialog
            {...props}
            attributes={{
                title: constants.CONFIRM_ACCOUNT_DELETE,
                staticBackdrop: true,
            }}
        >
            <Alert
                variant={'danger'}
                style={{
                    textAlign: 'center',
                    padding: '10px 0',
                }}
            >
                <strong>{constants.DELETE_WARNING}</strong>
            </Alert>
            <h5>{constants.CONFIRM_ACCOUNT_DELETE_MESSAGE()}</h5>
            <div
                style={{
                    height: '1px',
                    marginTop: '40px',
                    marginBottom: '20px',
                    background: '#383838',
                    width: '100%',
                }}
            ></div>
            <h5 style={{ marginBottom: '20px', textAlign: 'center' }}>
                <strong>{constants.CONFIRM_PASSPHRASE}</strong>
            </h5>
            <SingleInputForm
                callback={deleteAccount}
                placeholder={constants.RETURN_PASSPHRASE_HINT}
                buttonText={constants.DELETE_ACCOUNT}
                fieldType="password"
                variant="danger"
            />
        </MessageDialog>
    );
};

export default AccountDeleteModal;
