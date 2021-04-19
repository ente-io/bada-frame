import React, { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import constants from 'utils/strings/constants';
import styled from 'styled-components';
import billingService, {
    PAYMENT_INTENT_STATUS,
    Plan,
    Subscription,
} from 'services/billingService';
import {
    convertBytesToGBs,
    getPlans,
    getUserSubscription,
    hasPaidPlan,
    isSubscribed,
    isUserRenewingPlan,
    isSubscriptionCancelled,
} from 'utils/billingUtil';
import { CONFIRM_ACTION } from 'components/ConfirmDialog';
import { SUBSCRIPTION_VERIFICATION_ERROR } from 'utils/common/errorUtil';
import { LoadingOverlay } from './CollectionSelector';
import EnteSpinner from 'components/EnteSpinner';
import { DeadCenter } from '..';
import LinkButton from './LinkButton';

export const PlanIcon = styled.div<{ selected: boolean }>`
    padding-top: 20px;
    border-radius: 10%;
    height: 192px;
    width: 250px;
    border: 1px solid #868686;
    margin: 10px;
    text-align: center;
    font-size: 20px;
    cursor: ${(props) => (props.selected ? 'not-allowed' : 'pointer')};
    border-color: ${(props) => props.selected && '#56e066'};
    border-width: 3px;
`;

interface Props {
    modalView: boolean;
    closeModal: any;
    setDialogMessage;
    setConfirmAction;
}
enum PLAN_PERIOD {
    MONTH = 'month',
    YEAR = 'year',
}
function PlanSelector(props: Props) {
    const [loading, setLoading] = useState(false);
    const subscription: Subscription = getUserSubscription();
    const plans = getPlans();
    const [planPeriod, setPlanPeriod] = useState<PLAN_PERIOD>(
        PLAN_PERIOD.MONTH
    );
    const togglePeriod = () => {
        setPlanPeriod((prevPeriod) =>
            prevPeriod == PLAN_PERIOD.MONTH
                ? PLAN_PERIOD.YEAR
                : PLAN_PERIOD.MONTH
        );
    };
    const selectPlan = async (plan: Plan) => {
        try {
            setLoading(true);
            if (hasPaidPlan(subscription)) {
                await billingService.updateSubscription(plan.stripeID);
                if (isSubscriptionCancelled(subscription)) {
                    await billingService.activateSubscription();
                }
                setLoading(false);
                await new Promise((resolve) =>
                    setTimeout(() => resolve(null), 400)
                );
            } else {
                await billingService.buySubscription(plan.stripeID);
            }
            props.setDialogMessage({
                title: constants.SUBSCRIPTION_UPDATE_SUCCESS,
                close: { variant: 'success' },
            });
        } catch (err) {
            switch (err?.message) {
                case PAYMENT_INTENT_STATUS.REQUIRE_PAYMENT_METHOD:
                    props.setConfirmAction(
                        CONFIRM_ACTION.UPDATE_PAYMENT_METHOD
                    );
                    break;
                case SUBSCRIPTION_VERIFICATION_ERROR:
                    props.setDialogMessage({
                        title: constants.SUBSCRIPTION_VERIFICATION_FAILED,
                        close: { variant: 'danger' },
                    });
                    break;
                default:
                    props.setDialogMessage({
                        title: constants.SUBSCRIPTION_PURCHASE_FAILED,
                        close: { variant: 'danger' },
                    });
            }
        } finally {
            setLoading(false);
            props.closeModal();
        }
    };

    async function onManageClick(event) {
        try {
            event.preventDefault();
            await billingService.redirectToCustomerPortal();
        } catch (error) {
            props.setDialogMessage({
                title: constants.UNKNOWN_ERROR,
                close: { variant: 'danger' },
            });
        }
    }

    const PlanIcons: JSX.Element[] = plans
        ?.filter((plan) => plan.period == planPeriod)
        ?.map((plan) => (
            <PlanIcon
                key={plan.stripeID}
                onClick={() =>
                    !isUserRenewingPlan(plan, subscription) && selectPlan(plan)
                }
                selected={isUserRenewingPlan(plan, subscription)}
            >
                <div>
                    <span
                        style={{
                            color: '#ECECEC',
                            fontWeight: 900,
                            fontSize: '72px',
                        }}
                    >
                        {convertBytesToGBs(plan.storage, 0)}
                    </span>
                    <span
                        style={{
                            color: '#858585',
                            fontSize: '24px',
                            fontWeight: 900,
                        }}
                    >
                        {' '}
                        GB
                    </span>
                </div>
                <div
                    className={`bold-text`}
                >{`${plan.price} / ${plan.period}`}</div>
                {isUserRenewingPlan(plan, subscription) && 'active'}
            </PlanIcon>
        ));
    return (
        <Modal
            show={props.modalView}
            onHide={props.closeModal}
            dialogClassName="modal-90w"
            style={{ maxWidth: '100%' }}
            backdrop={`static`}
        >
            <Modal.Header closeButton>
                <Modal.Title
                    style={{
                        marginLeft: '12px',
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    <span>
                        {isSubscribed(subscription)
                            ? constants.MANAGE_PLAN
                            : constants.CHOOSE_PLAN}
                    </span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <DeadCenter>
                    <div style={{ display: 'flex' }}>
                        <span className={`bold-text`}>{constants.MONTHLY}</span>
                        <Form.Switch
                            id={`plan-period-toggler`}
                            style={{ marginLeft: '15px', marginTop: '-4px' }}
                            className={`custom-switch-md`}
                            onChange={togglePeriod}
                        />
                        <span className={`bold-text`}>{constants.YEARLY}</span>
                    </div>
                </DeadCenter>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        flexWrap: 'wrap',
                        margin: '4% 0',
                    }}
                >
                    {!plans || loading ? (
                        <LoadingOverlay>
                            <EnteSpinner />
                        </LoadingOverlay>
                    ) : (
                        PlanIcons
                    )}
                </div>
                <DeadCenter style={{ marginBottom: '30px' }}>
                    {isSubscribed(subscription) ? (
                        <>
                            <LinkButton
                                variant="secondary"
                                onClick={onManageClick}
                            >
                                {constants.MANAGEMENT_PORTAL}
                            </LinkButton>
                            <LinkButton
                                variant="danger"
                                onClick={() => {
                                    props.setConfirmAction(
                                        CONFIRM_ACTION.CANCEL_SUBSCRIPTION
                                    );
                                }}
                            >
                                {constants.CANCEL_SUBSCRIPTION}
                            </LinkButton>
                        </>
                    ) : (
                        <LinkButton
                            variant="secondary"
                            onClick={props.closeModal}
                        >
                            skip
                        </LinkButton>
                    )}
                </DeadCenter>
            </Modal.Body>
        </Modal>
    );
}

export default PlanSelector;