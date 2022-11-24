import { put, call } from "redux-saga/effects";
import axios from "../../../config/AxiosConfig";
import { setCookie } from "../../../helpers/cookieHelper";

import {
	ADD_WALLET_TOP_UP_API,
	GET_WALLET_DETAILS_API,
	GET_WALLET_PREAPPROVAL_DETAILS_API,
	GET_WALLET_TRANSACTIONS_LIST_API,
	WALLET_ACH_PAYMENT_API,
	WALLET_OFFLINE_PAYMENT_API,
	WALLET_STRIPE_PAYMENT_API,
	WITHDRAW_FROM_WALLET_API
} from "../../actions/apiCollections";
import {
	addWalletTopUpSuccess,
	createWalletOfflinePaymentSuccess,
	getWalletDetailsSuccess,
	getWalletPreapprovalDetailsSuccess,
	getWalletTransactionsSuccess,
	postWalletACHPaymentSuccess,
	updateWalletTopupSuccess,
	walletFail,
	walletPaymentStart,
	walletStripePaymentInitiateSuccess,
	walletStart
} from "../../actions/wallet/walletActions";
import { getLanguageId } from "../../../helpers/helpers";

export function* addWalletTopUpSaga(action) {
	yield put(walletStart());
	try {
		const response = yield axios.post(ADD_WALLET_TOP_UP_API, action.data);
		yield put(addWalletTopUpSuccess(response.data.data.data));
		yield setCookie("walletPreapprovalId", response.data.data.data._id, 1);
		yield call(getWalletTransactionsSaga, {pageLimit: 1})
	} catch (error) {
		yield put(walletFail(error));
	}
}

export function* createWalletOfflinePaymentSaga(action) {
	const payType =  action.topupFormData.get("payType")
	yield put(walletPaymentStart());
	const walletPreapprovalId = action.topupFormData.get("walletPreapprovalId");
	try {
		const response = yield axios.post(
			`${WALLET_OFFLINE_PAYMENT_API}/${walletPreapprovalId}`,
			action.topupFormData
		);
		const obj = {paymentReceipt: response.data.data.data, payType}
		yield put(createWalletOfflinePaymentSuccess(obj));
		yield localStorage.removeItem("gatewayId");
	} catch (error) {
		yield put(walletFail(error));
	}
}

export function* getWalletDetailsSaga(action) {
	yield put(walletStart());
	try {
		const response = yield axios.get(
			GET_WALLET_DETAILS_API, {
				params: { 
					currencyId: action.currencyId
				}
			}
		);
		yield put(getWalletDetailsSuccess(response.data.data.data));
	} catch (error) {
		yield put(walletFail(error));
	}
}

export function* getWalletTransactionsSaga(action) {
	yield put(walletStart(action.pageLimit));
	try {
		const response = yield axios.get(GET_WALLET_TRANSACTIONS_LIST_API, {
			params: { 
				limit: 10 * action.pageLimit,
				currencyId: action.currencyId,
				...(getLanguageId() !== null && {
					language: getLanguageId()
				})
			}
		});
		yield put(getWalletTransactionsSuccess(response.data.data.data));
	} catch (error) {
		yield put(walletFail(error));
	}
}

export function* getWalletPreapprovalDetailsSaga(action) {
	try {
		const response = yield axios.get(
			`${GET_WALLET_PREAPPROVAL_DETAILS_API}/${action.walletPreapprovalId}`
			);
		yield put(getWalletPreapprovalDetailsSuccess(response.data.data.data));
	} catch (error) {
		yield put(walletFail(error));
	}
}

export function* postWalletACHPaymentSaga(action) {
	yield put(walletPaymentStart());
	try {
		const response = yield axios.post(
			`${WALLET_ACH_PAYMENT_API}`,
			action.topupFormData
		);
		yield put(postWalletACHPaymentSuccess(response.data.data.data));
	} catch (error) {
		yield put(walletFail(error.response.data.message));
	}
}

export function* updateWalletTopupSaga(action) {
	yield put(walletPaymentStart());
	const walletPreapprovalId = action.topupFormData.get("walletPreapprovalId");
	try {
		// eslint-disable-next-line no-unused-vars
		const response = yield axios.patch(
			`${WALLET_OFFLINE_PAYMENT_API}/${walletPreapprovalId}`,
			action.topupFormData
		);
		const paymentType = action.paymentType ? action.paymentType : "";
		yield put(updateWalletTopupSuccess(paymentType));
	} catch (error) {
		yield put(walletFail(error));
	}
}

export function* walletStripePaymentInitiateSaga(action) {
	yield put(walletPaymentStart());
		yield localStorage.setItem("gatewayId", action.stripeData.gatewayId);
	try {
		const response = yield axios.post(
			WALLET_STRIPE_PAYMENT_API,
			action.stripeData
		);
		yield put(walletStripePaymentInitiateSuccess(response.data.data.data));
	} catch (error) {
		yield put(walletFail(error));
	}
}

export function* withdrawFromWalletSaga(action) {
	try {
		yield axios.post(
			WITHDRAW_FROM_WALLET_API,
			action.withdrawFormData
		);
		yield call(getWalletTransactionsSaga, {pageLimit: 1})
	} catch (error) {
		yield put(walletFail(error));
	}
}