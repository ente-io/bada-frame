import React, { useEffect, useState } from 'react';

import { slide as Menu } from 'react-burger-menu';
import billingService, { Subscription } from 'services/billingService';
import constants from 'utils/strings/constants';
import { getData, LS_KEYS, setData } from 'utils/storage/localStorage';
import { getToken } from 'utils/common/key';
import { getEndpoint } from 'utils/common/apiUtil';
import { Button } from 'react-bootstrap';
import {
    isSubscriptionActive,
    convertBytesToGBs,
    getUserSubscription,
    isOnFreePlan,
    isSubscriptionCancelled,
    isSubscribed,
} from 'utils/billingUtil';

import exportService from 'services/exportService';
import { File } from 'services/fileService';
import isElectron from 'is-electron';
import { Collection } from 'services/collectionService';
import { useRouter } from 'next/router';
import RecoveryKeyModal from './RecoveryKeyModal';
import EnteSpinner from './EnteSpinner';
import LinkButton from 'pages/gallery/components/LinkButton';
import { downloadApp } from 'utils/common';
import { logoutUser } from 'services/userService';
import { SetDialogMessage } from './MessageDialog';
import AccountDeleteModal from './AccountDeleteModal';

interface Props {
    files: File[];
    collections: Collection[];
    setDialogMessage: SetDialogMessage;
    showPlanSelectorModal: () => void;
}
export default function Sidebar(props: Props) {
    const [usage, SetUsage] = useState<string>(null);
    const [user, setUser] = useState(null);
    const [subscription, setSubscription] = useState<Subscription>(null);
    useEffect(() => {
        setUser(getData(LS_KEYS.USER));
        setSubscription(getUserSubscription());
    }, []);
    const [isOpen, setIsOpen] = useState(false);
    const [recoverModalView, setRecoveryModalView] = useState(false);
    const [accountDeleteModalView, setAccountDeleteModalView] = useState(false);
    useEffect(() => {
        const main = async () => {
            if (!isOpen) {
                return;
            }
            const usage = await billingService.getUsage();

            SetUsage(usage);
            setSubscription(getUserSubscription());
        };
        main();
    }, [isOpen]);

    function openFeedbackURL() {
        const feedbackURL: string =
            getEndpoint() + '/users/feedback?token=' + getToken();
        var win = window.open(feedbackURL, '_blank');
        win.focus();
    }
    function openSupportMail() {
        var a = document.createElement('a');
        a.href = 'mailto:contact@ente.io';
        a.target = '_blank';
        a.rel = 'noreferrer noopener';
        a.click();
    }
    function exportFiles() {
        if (isElectron()) {
            exportService.exportFiles(props.files, props.collections);
        } else {
            props.setDialogMessage({
                title: constants.DOWNLOAD_APP,
                content: constants.DOWNLOAD_APP_MESSAGE(),
                staticBackdrop: true,
                proceed: {
                    text: constants.DOWNLOAD,
                    action: downloadApp,
                    variant: 'success',
                },
                close: {
                    text: constants.CLOSE,
                },
            });
        }
    }

    const router = useRouter();
    function onManageClick() {
        setIsOpen(false);
        props.showPlanSelectorModal();
    }
    return (
        <Menu
            isOpen={isOpen}
            onStateChange={(state) => setIsOpen(state.isOpen)}
            itemListElement="div"
        >
            <div
                style={{
                    marginBottom: '28px',
                    outline: 'none',
                    color: 'rgb(45, 194, 98)',
                    fontSize: '16px',
                }}
            >
                {user?.email}
            </div>
            <div style={{ outline: 'none' }}>
                <div style={{ display: 'flex' }}>
                    <h5 style={{ margin: '4px 0 12px 2px' }}>
                        {constants.SUBSCRIPTION_PLAN}
                    </h5>
                    <div style={{ marginLeft: '10px' }}>
                        {
                            <Button
                                variant={
                                    isSubscribed(subscription)
                                        ? 'outline-secondary'
                                        : 'outline-success'
                                }
                                size="sm"
                                onClick={onManageClick}
                            >
                                {isSubscribed(subscription)
                                    ? constants.MANAGE
                                    : constants.SUBSCRIBE}
                            </Button>
                        }
                    </div>
                </div>
                <div style={{ color: '#959595' }}>
                    {isSubscriptionActive(subscription) ? (
                        isOnFreePlan(subscription) ? (
                            constants.FREE_SUBSCRIPTION_INFO(
                                subscription?.expiryTime
                            )
                        ) : isSubscriptionCancelled(subscription) ? (
                            constants.RENEWAL_CANCELLED_SUBSCRIPTION_INFO(
                                subscription?.expiryTime
                            )
                        ) : (
                            constants.RENEWAL_ACTIVE_SUBSCRIPTION_INFO(
                                subscription?.expiryTime
                            )
                        )
                    ) : (
                        <p>{constants.SUBSCRIPTION_EXPIRED}</p>
                    )}
                </div>
            </div>
            <div style={{ outline: 'none', marginTop: '30px' }}></div>
            <div>
                <h5 style={{ marginBottom: '12px' }}>
                    {constants.USAGE_DETAILS}
                </h5>
                <div style={{ color: '#959595' }}>
                    {usage ? (
                        constants.USAGE_INFO(
                            usage,
                            Math.ceil(
                                Number(convertBytesToGBs(subscription?.storage))
                            )
                        )
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <EnteSpinner
                                style={{
                                    borderWidth: '2px',
                                    width: '20px',
                                    height: '20px',
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
            <div
                style={{
                    height: '1px',
                    marginTop: '40px',
                    background: '#242424',
                    width: '100%',
                }}
            ></div>
            <LinkButton style={{ marginTop: '30px' }} onClick={openFeedbackURL}>
                {constants.REQUEST_FEATURE}
            </LinkButton>
            <LinkButton style={{ marginTop: '30px' }} onClick={openSupportMail}>
                {constants.SUPPORT}
            </LinkButton>
            <>
                <RecoveryKeyModal
                    show={recoverModalView}
                    onHide={() => setRecoveryModalView(false)}
                    somethingWentWrong={() =>
                        props.setDialogMessage({
                            title: constants.RECOVER_KEY_GENERATION_FAILED,
                            close: { variant: 'danger' },
                        })
                    }
                />
                <LinkButton
                    style={{ marginTop: '30px' }}
                    onClick={() => setRecoveryModalView(true)}
                >
                    {constants.DOWNLOAD_RECOVERY_KEY}
                </LinkButton>
            </>
            <LinkButton
                style={{ marginTop: '30px' }}
                onClick={() => {
                    setData(LS_KEYS.SHOW_BACK_BUTTON, { value: true });
                    router.push('changePassword');
                }}
            >
                {constants.CHANGE_PASSWORD}
            </LinkButton>
            <LinkButton style={{ marginTop: '30px' }} onClick={exportFiles}>
                {constants.EXPORT}
            </LinkButton>
            <div
                style={{
                    height: '1px',
                    marginTop: '40px',
                    background: '#242424',
                    width: '100%',
                }}
            ></div>
            <LinkButton
                variant="danger"
                style={{ marginTop: '30px' }}
                onClick={() =>
                    props.setDialogMessage({
                        title: `${constants.CONFIRM} ${constants.LOGOUT}`,
                        content: constants.LOGOUT_MESSAGE,
                        staticBackdrop: true,
                        proceed: {
                            text: constants.LOGOUT,
                            action: logoutUser,
                            variant: 'danger',
                        },
                        close: { text: constants.CANCEL },
                    })
                }
            >
                logout
            </LinkButton>
            <>
                <AccountDeleteModal
                    show={accountDeleteModalView}
                    onHide={() => setAccountDeleteModalView(false)}
                    setDialogMessage={props.setDialogMessage}
                />
                <LinkButton
                    variant="danger"
                    style={{ marginTop: '30px' }}
                    onClick={() => setAccountDeleteModalView(true)}
                >
                    delete account
                </LinkButton>
            </>
            <div style={{ marginBottom: '50px' }} />
        </Menu>
    );
}
