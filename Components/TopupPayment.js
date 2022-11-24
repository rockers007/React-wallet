/* eslint-disable react-hooks/exhaustive-deps */
import React, {
	useState,
	useContext,
	useLayoutEffect,
	useEffect,
	useRef
} from "react";
import {
	Container,
	Row,
	Col,
	Nav,
	Tab,
	Form,
	FormGroup,
	FormLabel,
	Alert
} from "react-bootstrap";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";
import ReactHtmlParser from "react-html-parser";
import { useDispatch, useSelector } from "react-redux";
import { Redirect } from "react-router-dom/cjs/react-router-dom.min";
import { usePlaidLink } from "react-plaid-link";
import { loadStripe } from "@stripe/stripe-js";

import classNames from "classnames";
import DropIn from "braintree-web-drop-in-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import i18n from "i18next";

import { AuthContext } from "../AuthContext/Context";
import Heading from "../../components/Heading/Heading";

import { isRTL } from "../../../../constants";
import { eraseCookie } from "../../../../helpers/cookieHelper";
import { formatCurrency } from "../../../../helpers/numberFormat";
import { getURL, getBaseURL } from "../../../../helpers/url";
import {
	createWalletOfflinePayment,
	getWalletPreapprovalDetails,
	getOfflineBank,
	getACHSetting,
	getPayPalConfirmPayment,
	getPayPalGenerateToken,
	getPayPalSetting,
	getStripe,
	getStripeACHPaymentToken,
	postWalletACHPayment,
	walletStripePaymentInitiate,
} from "../../../../store/actions";
import BankImg from "./../../../../themes/default/assets/images/bank-img.png";
import PaymentMethodImg from "./../../../../themes/default/assets/images/payment-method.png";
import stripeImg from "./../../../../themes/default/assets/images/stripe-img.png";

import "./TopupPayment.scss";

function TopupPayment({ history }) {

	const auth = useContext(AuthContext);
	const siteBaseUrl = useRef(getBaseURL());
	const dispatch = useDispatch();
	const walletPreapprovalId = getURL();
	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue
	} = useForm();

	const { siteSettings } = useSelector(
		state => state.siteSettings
	);
	
	useLayoutEffect(() => {
		if (siteSettings?.walletModule === "no") {
			history.push(`/`);
		}
	}, [siteSettings?.walletModule]);

	useLayoutEffect(() => {
		dispatch(getWalletPreapprovalDetails(walletPreapprovalId));
		dispatch(getOfflineBank("offline"));
		dispatch(getStripe("stripe"));
		dispatch(getPayPalSetting("paypal"));
		dispatch(getACHSetting("ach"));
		eraseCookie("walletPreapprovalId")
	}, [dispatch]);

	const [achSetting, setAchSetting] = useState();
	const [documentName, setDocumentName] = useState();
	const [payType, setPayType] = useState("offline");
	const [offlinePay, setOfflinePay] = useState();
	const [investmentAmount, setInvestmentAmount] = useState(0);
	const [defaultActiveKey, setDefaultActiveKey] = useState("0");
	const [instance, setInstance] = useState();
	const [stripe, setStripe] = useState(null);

	const {
		achSettings,
		achPaymentConfirmToken,
		offlineBank,
		paypalConfirmPaymentResponse,
		paypalSettingResponse,
		paypalUniqueToken,
		striperes
	} = useSelector(state => state.campaign);

	const {
		achPaymentSpinner,
		error,
		isSpinning,
		paymentSuccessMsg,
		preapprovalDetails,
		topupAmount,
		stripeResponse,
		walletAchPaymentConfirmationId
	}  = useSelector(state => state.wallet);

	const success_url = `${siteBaseUrl.current}topup-receipt/${walletPreapprovalId}`;
	const cancel_url = `${siteBaseUrl.current}topup-fail`;

	useEffect(() => {
		const stripeKey =
			striperes?.paymentMode === "sandbox"
				? striperes?.applicationTestKey
				: striperes?.applicationLiveKey;
		async function setStripeState() {
			if (!stripe) {
				const stripeTmp = await loadStripe(stripeKey);
				setStripe(stripeTmp);
			}
		}
		setStripeState();
	}, [striperes]);

	useLayoutEffect(() => {
		if (stripeResponse !== null)
			stripe.redirectToCheckout({
				sessionId: stripeResponse.id
			});
	}, [stripeResponse]);

	// Investment Payment Amount Set
	useLayoutEffect(() => {
		if (topupAmount) {
			setInvestmentAmount(topupAmount ?? 0);
			setValue("amount", topupAmount ?? 0);
		}
	}, [topupAmount]);

	// Admin Side Payment Gatway Set
	useLayoutEffect(() => {
		if (offlineBank) {
			setOfflinePay(offlineBank);
			setValue("gatewayId", offlinePay?.id);
			checkPaymentGateway("offline");
		}
	}, [offlineBank]);

	useLayoutEffect(() => {
		if (achSettings) {
			setAchSetting(achSettings);
			setValue("gatewayId", achSetting?.id);
			checkPaymentGateway("ach");
		}
	}, [achSettings]);

	// Check Payment Gateway Id
	const checkPaymentGateway = type => {
		if (type === "offline") {
			setDefaultActiveKey("1");
			setValue("gatewayId", offlinePay?.id);
			setValue("amount", investmentAmount);
			setPayType(type);
		}

		if (type === "stripe") {
			setDefaultActiveKey("2");
			setValue("gatewayId", striperes?.id);
			setValue("amount", investmentAmount);
			setPayType(type);
		}

		if (type === "paypal") {
			setDefaultActiveKey("3");
			setValue("gatewayId", paypalSettingResponse?.id);
			setValue("amount", investmentAmount);
			setPayType(type);
			dispatch(getPayPalGenerateToken());
		}

		if (type === "ach") {
			setDefaultActiveKey("4");
			setValue("gatewayId", achSettings?.id);
			setValue("amount", investmentAmount);
			setPayType(type);
			dispatch(getStripeACHPaymentToken());
		}
	};

	const onSubmitPayment = data => {
		const topupFormData = new FormData();
		topupFormData.append("walletPreapprovalId", walletPreapprovalId);
		topupFormData.append("amount", data.amount);
		topupFormData.append("currencyId", preapprovalDetails.currencyId?._id);
		topupFormData.append("description", data.acknowledgeNote);
		
		topupFormData.append(
			"acknowledgeDocument",
			data.acknowledgeDocument[0]
		);
		topupFormData.append("gatewayId", data.gatewayId);
		topupFormData.append("createdAt", Date.now());
		dispatch(createWalletOfflinePayment(topupFormData)); 
	};

	const onPayPalProceedToPay = async () => {
		if (investmentAmount) {
			const { nonce } = await instance.requestPaymentMethod();

			if (nonce) {
				const paymentData = {
					amount: investmentAmount,
					paymentMethodNonce: nonce
				};
				dispatch(getPayPalConfirmPayment(paymentData));
			}
		}
	};

	const onSubmitStripe = data => {
		const stripeGatewayId = data.gatewayId;
		if (investmentAmount > 0) {
			dispatch(
				walletStripePaymentInitiate({
					preapprovalId: walletPreapprovalId,
					success_url,
					cancel_url,
					gatewayId: stripeGatewayId
				})
			);
		}
	};

	useEffect(() => {
		if (paypalConfirmPaymentResponse !== null) {
			if (paypalConfirmPaymentResponse?.success) {
				const paypalFormData = new FormData();
				paypalFormData.append("walletPreapprovalId", walletPreapprovalId);
				paypalFormData.append("currencyId", preapprovalDetails.currencyId?._id);
				paypalFormData.append("gatewayId", paypalSettingResponse?.id);
				paypalFormData.append("createdAt", Date.now());
				paypalFormData.append(
					"paymentConfirmationId",
					paypalConfirmPaymentResponse?.paymentReceipt?.id
				);
				dispatch(createWalletOfflinePayment(paypalFormData)); 
			} else {
				history.push(`/receipt-fail`);
			}
		}
	}, [paypalConfirmPaymentResponse]);

	const { open, ready } = usePlaidLink({
		token: achPaymentConfirmToken,
		onSuccess: (public_token, metadata) => {
			if (public_token) {
				dispatch(
					postWalletACHPayment({
						public_token: public_token,
						accountId: metadata.account_id,
						amount: investmentAmount,
						currencyCode: preapprovalDetails.currencyId?.code,
						currencySymbol: preapprovalDetails.currencyId?.symbol
					})
				);
			}
		}
	});
	
	useEffect(() => {
		if (walletAchPaymentConfirmationId !== null) {
			const achFormData = new FormData();
			achFormData.append("walletPreapprovalId", walletPreapprovalId);
			achFormData.append("amount", investmentAmount);
			achFormData.append("currencyId", preapprovalDetails.currencyId?._id);
			achFormData.append("createdAt", Date.now());
			achFormData.append("gatewayId", achSetting?.id);
			achFormData.append("paymentConfirmationId", walletAchPaymentConfirmationId);
			dispatch(createWalletOfflinePayment(achFormData)); 
		}
	}, [walletAchPaymentConfirmationId]);

	useEffect(() => {
		if (paymentSuccessMsg) {
			history.push(`/topup-receipt/${walletPreapprovalId}`);
		}
	}, [paymentSuccessMsg])

	if (auth === null) {
		return (
			<Redirect
				to={{
					pathname: "/login",
					state: "Please sign in"
				}}
			/>
		);
	}
	
	return(
		<div className="section mt-2">
		<Container>
			<Heading
				alignCenter={true}
				title={i18n.t("wallet.payment.title")}
			/>
			{error?.length > 0 ? (
				<div
					className="alert alert-danger alert-dismissible fade show"
					role="alert"
				>
					<span>{error}</span>
					<button
						id="paymentErrClose"
						type="button"
						className="close"
						data-dismiss="alert"
						aria-label="Close"
					>
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
			) : null}
			<Tab.Container
				id="left-tabs-example"
				defaultActiveKey={defaultActiveKey}
			>
				<Row>
					<Col sm={3}>
						<Nav className="payment-sidebar-nav-wrap">
							{offlineBank?.status === "yes" ? (
								<Nav.Item
									id="paymentOffline"
									onClick={() => checkPaymentGateway(offlinePay?.paymentType)}
								>
									<Nav.Link eventKey="1" className="tab-nav-link">
										<FontAwesomeIcon
											icon={["fas", "money-check-alt"]}
											className="payment-tabs-icon"
										/>
										{i18n.t("payment.offline.title")}
										<FontAwesomeIcon
											icon={["fas", isRTL ? "arrow-left" : "arrow-right"]}
											className="payment-sidebar-icon"
										/>
									</Nav.Link>
								</Nav.Item>
							) : null}

							{striperes?.status === "yes" ? (
								<Nav.Item id="paymentCard">
									<Nav.Link
										className="tab-nav-link"
										eventKey="2"
										style={{ pointerEvents: isSpinning ? "none" : "" }}
										onClick={() =>
											checkPaymentGateway(striperes?.paymentType)
										}
									>
										<FontAwesomeIcon
											icon={["fas", "credit-card"]}
											className="payment-tabs-icon"
										/>
										{i18n.t("payment.card.title")}
										<FontAwesomeIcon
											icon={["fas", isRTL ? "arrow-left" : "arrow-right"]}
											className="payment-sidebar-icon"
										/>
									</Nav.Link>
								</Nav.Item>
							) : null}

							{paypalSettingResponse?.status === "yes" ? (
								<Nav.Item id="paymentPayPal">
									<Nav.Link
										className="tab-nav-link"
										eventKey="3"
										style={{ pointerEvents: isSpinning ? "none" : "" }}
										onClick={() =>
											checkPaymentGateway(paypalSettingResponse?.paymentType)
										}
									>
										<FontAwesomeIcon
											icon={["fab", "paypal"]}
											className="payment-tabs-icon"
										/>
										{i18n.t("payment.payPal.title")}
										<FontAwesomeIcon
											icon={["fas", isRTL ? "arrow-left" : "arrow-right"]}
											className="payment-sidebar-icon"
										/>
									</Nav.Link>
								</Nav.Item>
							) : null}
							{achSettings?.status === "yes" ? (
									<Nav.Item id="paymentAch">
										<Nav.Link
											className="tab-nav-link"
											eventKey="4"
											style={{ pointerEvents: isSpinning ? "none" : "" }}
											onClick={() =>
												checkPaymentGateway(achSettings?.paymentType)
											}
										>
											<FontAwesomeIcon
												icon={["fas", "credit-card"]}
												className="payment-tabs-icon"
											/>
											{i18n.t("payment.ach.title")}
											<FontAwesomeIcon
												icon={["fas", isRTL ? "arrow-left" : "arrow-right"]}
												className="payment-sidebar-icon"
											/>
										</Nav.Link>
									</Nav.Item>
								) : null}
						</Nav>
					</Col>
					<Col sm={9}>
						<Tab.Content className="pl-c-30">
							<Tab.Pane eventKey="0">
								<div className="text-center">
									<Form.Group className="mb-0">
										<img
											className="payment-method-img"
											src={PaymentMethodImg}
											alt="user"
											style={{
												height: "238px",
												width: "310px",
												marginBottom: "8px"
											}}
										/>
										<p className="payment-method-text">
											{i18n.t("payment.paymentMethodChoose")}
										</p>
									</Form.Group>
								</div>
							</Tab.Pane>
							<Tab.Pane eventKey="1">
								<Form name="form" onSubmit={handleSubmit(onSubmitPayment)}>
									<h1 className="mb-3">
										{formatCurrency(
											investmentAmount,
											siteSettings?.currencySymbolSide,
											preapprovalDetails?.currencyId?.symbol,
											preapprovalDetails?.currencyId?.code,
											siteSettings?.decimalPoints
										)}
									</h1>
									<Alert
										key={"dark"}
										variant={"dark"}
										className="bank-details-wrapper mb-3"
										style={{
											whiteSpace: "pre-line",
											fontWeight: "400",
											fontSize: "18px"
										}}
									>
										{ReactHtmlParser(offlinePay?.details)}
									</Alert>

									<FormGroup>
										<FormLabel>
										{i18n.t("common.note")} <span className="text-important">*</span>
										</FormLabel>
										<Form.Control
											as="textarea"
											rows="3"
											name="acknowledgeNote"
											id="paymentOfflineNote"
											className={classNames("form-control", {
												"is-invalid": errors.acknowledgeNote
											})}
											{...register("acknowledgeNote", {
												required: {
													value: payType === "offline" ? true : false,
													message: i18n.t("errors.required")
												}
											})}
										/>
										<ErrorMessage
											errors={errors}
											name="acknowledgeNote"
											render={({ message }) => (
												<div className="invalid-feedback" id="paymentOfflineNoteErr">{message}</div>
											)}
										/>
									</FormGroup>

									<FormGroup className="mb-0">
										<FormLabel>
										{i18n.t("common.attachment")} <span className="text-important">*</span>
										</FormLabel>
										<div className="custom-file">
											<input
												type="file"
												id="paymentOfflineAcknowledgeDoc"
												name="acknowledgeDocument"
												accept="application/pdf"
												className={classNames("custom-file-input", {
													"is-invalid": errors.acknowledgeDocument
												})}
												{...register("acknowledgeDocument", {
													required: {
														value: payType === "offline" ? true : false,
														message: i18n.t("errors.required")
													},
													onChange: e => {
														let coverReader = new FileReader();
														const file = e.currentTarget.files[0];
														if (file) coverReader.readAsDataURL(file);
														if (e.currentTarget.files.length > 0) {
															setDocumentName(e.currentTarget.files[0].name);
														}
														coverReader.onload = e => {};
													},
													validate: async value => {
														if (
															value.length > 0 &&
															typeof value == "object"
														) {
															const fileTypes = ["pdf"];
															const fileType = value[0].name.split(".")[1];
															if (!fileTypes.includes(fileType))
																return `${i18n.t(
																	"common.fileFormateValid"
																)} (${fileTypes})`;
															const fileSize = Math.round(
																value[0].size / 1024
															);
															if (fileSize > 2000)
																return `${i18n.t("common.fileSize")}`;
														}
													}
												})}
											/>
											<label
												className="custom-file-label"
												htmlFor="attachment"
											>
												{documentName ?? i18n.t("common.chooseFile")}
											</label>
										</div>
										<ErrorMessage
											errors={errors}
											name="acknowledgeDocument"
											render={({ message }) => (
												<div className="invalid-feedback d-block" id="paymentOfflineAcknowledgeDocErr">
													{message}
												</div>
											)}
										/>
									</FormGroup>

									{payType === "offline" ? (
										<div className="mt-5 text-center">
											<button
												id="paymentOfflineSubmit"
												type="submit"
												className={`btn btn-primary custom-btn mt-5 text-center ${
													isSpinning ? `spinner spinner-center` : ""
												}`}
												disabled={isSpinning}
											>
												{isSpinning ? "" : i18n.t("payment.proceedToPay")}
											</button>
										</div>
									) : null}
								</Form>
							</Tab.Pane>
							<Tab.Pane eventKey="2">
								<h1 className="mb-3">
									{formatCurrency(
										investmentAmount,
										siteSettings?.currencySymbolSide,
										preapprovalDetails?.currencyId?.symbol,
										preapprovalDetails?.currencyId?.code,
										siteSettings?.decimalPoints
									)}
								</h1>
								{striperes?.paymentMode === "sandbox" ? (
									<Alert
										key={"dark"}
										variant={"dark"}
										className="bank-details-wrapper mb-3"
										style={{
											whiteSpace: "pre-line",
											fontWeight: "400",
											fontSize: "18px"
										}}
									>
										{ReactHtmlParser(striperes?.sandboxDetail)}
									</Alert>
								) : null}

								<img src={stripeImg} alt="stripeImg" className="d-block ml-auto mr-auto" />
								<Form
									name="stripePayment"
									onSubmit={handleSubmit(onSubmitStripe)}
								>
									<div>
										<Form.Group className="mb-0 text-center">
										{i18n.t("payment.click")} <strong>{i18n.t("payment.proceedToPay")} </strong>{i18n.t("payment.buttonToProceed")}
										</Form.Group>
									</div>
									<div className="mt-5 text-center">
										<button
											id="paymentStripeSubmit"
											type="submit"
											className={`btn btn-primary custom-btn ${
												isSpinning ? `spinner spinner-center` : ""
											}`}
											disabled={isSpinning}
										>
											{isSpinning ? "" : i18n.t("payment.proceedToPay")}
										</button>
									</div>
								</Form>
							</Tab.Pane>
							<Tab.Pane eventKey="3">
									<h1 className="mb-3">
										{formatCurrency(
											investmentAmount,
											siteSettings?.currencySymbolSide,
											preapprovalDetails?.currencyId?.symbol,
											preapprovalDetails?.currencyId?.code,
											siteSettings?.decimalPoints
										)}
									</h1>
									{paypalSettingResponse?.paymentMode === "sandbox" ? (
										<Alert
											key={"dark"}
											variant={"dark"}
											className="bank-details-wrapper mb-3"
											style={{
												whiteSpace: "pre-line",
												fontWeight: "400",
												fontSize: "18px"
											}}
										>
											{ReactHtmlParser(paypalSettingResponse?.sandboxDetail)}
										</Alert>
									) : null}

									{paypalUniqueToken ? (
										<DropIn
											options={{ authorization: paypalUniqueToken }}
											onInstance={instance => {
												setInstance(instance);
											}}
										/>
									) : (
										<div className="mt-5 text-center">{i18n.t("common.loading")}</div>
									)}

									{instance ? (
										<div className="mt-5 text-center">
											<button
												id="paymentPayPalSubmit"
												className={`btn btn-primary custom-btn ${
													isSpinning ? `spinner spinner-center` : ""
												}`}
												onClick={() => onPayPalProceedToPay()}
											>
												{isSpinning ? "" : i18n.t("payment.proceedToPay")}
											</button>
										</div>
									) : null}
								</Tab.Pane>
							<Tab.Pane eventKey="4">
								<h1 className="mb-3">
									{formatCurrency(
										investmentAmount,
										siteSettings?.currencySymbolSide,
										preapprovalDetails?.currencyId?.symbol,
										preapprovalDetails?.currencyId?.code,
										siteSettings?.decimalPoints
									)}
								</h1>
								{achSetting?.paymentMode === "sandbox" ? (
									<Alert
										key={"dark"}
										variant={"dark"}
										className="bank-details-wrapper mb-3"
										style={{
											whiteSpace: "pre-line",
											fontWeight: "400",
											fontSize: "18px"
										}}
									>
										{ReactHtmlParser(achSetting?.sandboxDetail)}
									</Alert>
								) : null}
								<div className="text-center">
									<img src={BankImg} alt="BankImg" className="d-block ml-auto mr-auto" />
									{achPaymentConfirmToken ? (
										<button
											onClick={() => open()}
											disabled={!ready}
											id="paymentAchConnectAccount"
											className={`btn btn-primary custom-btn ${
												achPaymentSpinner ? `spinner spinner-center` : ""
											}`}
										>
											{achPaymentSpinner ? "" : i18n.t("payment.ach.connectAccount")}
										</button>
									) : (
										<div className="mt-5 text-center">{i18n.t("common.loading")}</div>
									)}
								</div>
							</Tab.Pane>
						</Tab.Content>
					</Col>
				</Row>
			</Tab.Container>
		</Container>
	</div>
	)
}

export default TopupPayment;
