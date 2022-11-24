import * as actionTypes from "./actionTypes";

export const addWalletTopUp = data => {
	return {
		type: actionTypes.ADD_WALLET_TOP_UP,
		data
	};
};

export const createWalletOfflinePayment = topupFormData => {
	return {
		type: actionTypes.CREATE_WALLET_OFFLINE_PAYMENT,
		topupFormData
	};
};

export const createWalletOfflinePaymentSuccess = response => {
	return {
		type: actionTypes.CREATE_WALLET_OFFLINE_PAYMENT_SUCCESS,
		response
	};
};

export const addWalletTopUpSuccess = response => {
	return {
		type: actionTypes.ADD_WALLET_TOP_UP_SUCCESS,
		response
	};
};

export const getWalletDetails = (currencyId) => {
	return {
		type: actionTypes.GET_WALLET_DETAILS,
		currencyId
	};
};

export const getWalletDetailsSuccess = response => {
	return {
		type: actionTypes.GET_WALLET_DETAILS_SUCCESS,
		response
	};
};

export const getWalletPreapprovalDetails = walletPreapprovalId => {
	return {
		type: actionTypes.GET_WALLET_PREAPPROVAL_DETAILS,
		walletPreapprovalId
	};
};

export const getWalletPreapprovalDetailsSuccess = response => {
	return {
		type: actionTypes.GET_WALLET_PREAPPROVAL_DETAILS_SUCCESS,
		response
	};
};

export const getWalletTransactions = (pageLimit, currencyId) => {
	return {
		type: actionTypes.GET_WALLET_TRANSACTIONS,
		pageLimit,
		currencyId
	};
};

export const getWalletTransactionsSuccess = response => {
	return {
		type: actionTypes.GET_WALLET_TRANSACTIONS_SUCCESS,
		response
	};
};

export const postWalletACHPayment = topupFormData => {
	return {
		type: actionTypes.POST_WALLET_ACH_PAYMENT,
		topupFormData
	};
};

export const postWalletACHPaymentSuccess = response => {
	return {
		type: actionTypes.POST_WALLET_ACH_PAYMENT_SUCCESS,
		response
	};
};

export const updateWalletTopup = (topupData, paymentType) => {
	return {
		type: actionTypes.UPDATE_WALLET_TOPUP,
		topupData,
		paymentType
	};
};

export const resetTopupPaymentData = response => {
	return {
		type: actionTypes.RESET_TOPUP_PAYMENT_DATA,
		response
	};
};


export const updateWalletTopupSuccess = response => {
	return {
		type: actionTypes.UPDATE_WALLET_TOPUP_SUCCESS,
		response
	};
};

export const walletStripePaymentInitiate = (stripeData) => {
	return {
		type: actionTypes.WALLET_STRIPE_PAYMENT_INITIATE,
		stripeData
	};
};

export const walletStripePaymentInitiateSuccess = response => {
	return {
		type: actionTypes.WALLET_STRIPE_PAYMENT_INITIATE_SUCCESS,
		response
	};
};


export const walletFail = response => {
	return {
		type: actionTypes.WALLET_FAIL,
		response
	};
};

export const walletPaymentStart = () => {
	return {
		type: actionTypes.WALLET_PAYMENT_START,
	};
};

export const walletStart = pageLimit => {
	return {
		type: actionTypes.WALLET_START,
		pageLimit
	};
};

export const withdrawFromWallet = (withdrawFormData) => {
	return {
		type: actionTypes.WITHDRAW_FROM_WALLET,
		withdrawFormData
	};
};

export const setWalletSelectedCurrency = currency => {
	return {
		type: actionTypes.SET_WALLET_SELECTED_CURRENCY,
		currency
	};
};