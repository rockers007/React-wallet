import * as actionTypes from "../../actions/wallet/actionTypes";
import { updateObject } from "../../utility/utility";

const initialState = {
  displayLoadMore: false,
  error: [],
  isLoading: false,
  isSpinning: false,
  paymentReceipt: "",
  paymentSuccessMsg: false,
  preapprovalDetails: null,
  walletSelectedCurrency: null,
  stripeResponse: null,
  topupAmount: 0,
  userWalletBalance: null,
  walletAchPaymentConfirmationId: null,
  achPaymentSpinner: false,
  walletDetails: null,
  walletDetailsLoader: false,
  walletPreapprovalId: null,
  walletTransactions: [],
  walletTransactionsLoader: false,
  withdrawSuccessMsg: false,
};

const addWalletTopUpSuccess = (state, action) => {
  return updateObject(state, {
    isLoading: true,
    topupAmount: action.response.amount,
    walletPreapprovalId: action.response._id
  });
};

const createWalletOfflinePaymentSuccess = (state, action) => {
  return updateObject(state, {
    paymentSuccessMsg: action.response?.payType === "stripe" ? false : true,
    paymentReceipt: action.response?.paymentReceipt,
    isLoading: false,
    isSpinning: action.response?.payType === "stripe" ? true : false,
    preapprovalDetails: null,
    achPaymentSpinner: false,
    error: []
  });
};

const getWalletDetailsSuccess = (state, action) => {
  return updateObject(state, {
    walletDetails: action.response,
    walletDetailsLoader: false,
  });
};

const getWalletTransactionsSuccess = (state, action) => {
  return updateObject(state, {
    displayLoadMore: action.response?.displayLoadMore,
    userWalletBalance: action.response?.userWalletBalance,
    walletDetailsLoader: false,
    walletTransactions: action.response?.docs,
    paymentSuccessMsg: false,
    walletTransactionsLoader: false,
    isSpinning: false,
    paymentReceipt: "",
  });
};

const getWalletPreapprovalDetailsSuccess = (state, action) => {
  return updateObject(state, {
    preapprovalDetails: action.response,
    paymentReceipt: "",
  });
};

const resetTopupPaymentData = (state, action) => {
  return updateObject(state, {
    paymentSuccessMsg: false,
    isSpinning: false,
    preapprovalDetails: false,
    stripeResponse: null,
    stripeResponse: null,
    topupAmount: 0,
    walletAchPaymentConfirmationId: null,
  });
};

const setWalletSelectedCurrency = (state, action) => {
  return updateObject(state, {
    walletSelectedCurrency: action.currency
  });
};

const postWalletACHPaymentSuccess = (state, action) => {
  return updateObject(state, {
		walletAchPaymentConfirmationId: action.response,
  });
};

const updateWalletTopupSuccess = (state, action) => {
  return updateObject(state, {
		paymentSuccessMsg: action.response === "stripe" ? false : true
  });
};

const walletFail = (state, action) => {
  return updateObject(state, {
    error: action.response,
    isSpinning: false,
    stripeResponse: null,
    paymentSuccessMsg: false,
    walletDetailsLoader: false,
    walletAchPaymentConfirmationId: null,
    achPaymentSpinner: false,
  });
};

const walletPaymentStart = (state, action) => {
  return updateObject(state, {
    paymentReceipt: "",
    paymentSuccessMsg: false,
    isSpinning: true,
    withdrawSuccessMsg: false,
    isLoading: false,
    stripeResponse: null,
    walletAchPaymentConfirmationId: null,
    achPaymentSpinner: true,
  });
};

const walletStripePaymentInitiateSuccess = (state, action) => {
  return updateObject(state, {
    stripeResponse: action.response
  });
};

const walletStart = (state, action) => {
  return updateObject(state, {
    error: null,
    isLoading: false,
    walletPreapprovalId: null,
    walletDetailsLoader: true,
    walletTransactionsLoader: action.pageLimit === 1 ? true : false,
    isSpinning: action.pageLimit > 1 ? true : false,
    ...(action.pageLimit <= 1  && {
			walletTransactions: [],
		}),
    stripeResponse: null,
  });
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.ADD_WALLET_TOP_UP_SUCCESS:
      return addWalletTopUpSuccess(state, action);
    case actionTypes.CREATE_WALLET_OFFLINE_PAYMENT_SUCCESS:
      return createWalletOfflinePaymentSuccess(state, action);
    case actionTypes.GET_WALLET_DETAILS_SUCCESS:
      return getWalletDetailsSuccess(state, action);
    case actionTypes.GET_WALLET_PREAPPROVAL_DETAILS_SUCCESS:
      return getWalletPreapprovalDetailsSuccess(state, action);
    case actionTypes.GET_WALLET_TRANSACTIONS_SUCCESS:
      return getWalletTransactionsSuccess(state, action);
    case actionTypes.RESET_TOPUP_PAYMENT_DATA:
      return resetTopupPaymentData(state, action);
    case actionTypes.SET_WALLET_SELECTED_CURRENCY:
      return setWalletSelectedCurrency(state, action);
    case actionTypes.POST_WALLET_ACH_PAYMENT_SUCCESS:
      return postWalletACHPaymentSuccess(state, action);
    case actionTypes.UPDATE_WALLET_TOPUP_SUCCESS:
      return updateWalletTopupSuccess(state, action);
    case actionTypes.WALLET_FAIL:
      return walletFail(state, action);
    case actionTypes.WALLET_PAYMENT_START:
      return walletPaymentStart(state, action);
    case actionTypes.WALLET_STRIPE_PAYMENT_INITIATE_SUCCESS:
      return walletStripePaymentInitiateSuccess(state, action);
    case actionTypes.WALLET_START:
      return walletStart(state, action);
    default:
      return state;
  }
};
export default reducer;