/* eslint-disable react-hooks/exhaustive-deps */
import { ErrorMessage } from "@hookform/error-message";
import classNames from "classnames";
import i18n from "i18next";
import React, { useContext, useLayoutEffect, useEffect, useState } from "react";
import {
	Badge,
	Button,
	Col,
	Container,
	Form,
	FormGroup,
	FormLabel,
	Modal,
	ModalFooter,
	OverlayTrigger,
	Row,
	Table,
	Tooltip
} from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Redirect } from "react-router-dom/cjs/react-router-dom.min";
import Select from "react-select";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { AuthContext } from "../AuthContext/Context";
import Heading from "../../components/Heading/Heading";
import Loading from "../../components/Loading/Loading";
import Spinner from "../../components/Spinner/Spinner";

import { isRTL } from "../../../../constants"
import { getWalletStatusCodes } from "../../../../helpers/helpers";
import { getCookie } from "../../../../helpers/cookieHelper";
import { formatCurrency } from "../../../../helpers/numberFormat";
import {
	addWalletTopUp,
	getWalletTransactions,
	setWalletSelectedCurrency,
	withdrawFromWallet
} from "../../../../store/actions/wallet/walletActions";
import {
	getCurrency
} from "../../../../store/actions/siteSettings";

import "./Wallet.scss";

function Wallet({history}) {
	const auth = useContext(AuthContext);
	const dispatch = useDispatch();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset
	} = useForm({ mode: "onChange"});

	const {
		control: withdrawControl,
		register: withdrawRegister,
		handleSubmit: withdrawHandleSubmit,
		formState: { errors: withdrawErrors },
		reset: withdrawReset
	} = useForm({ mode: "onChange"});

	const [showMore, setShowMore] = useState(2);
	const [showTopUpModal, setShowTopUpModal] = useState(false);
	const [showWithdrawModal, setShowWithdrawModal] = useState(false);
	const [currency, setCurrency] = useState([]);
	const [walletCurrencyId, setWalletCurrencyId] = useState("602364e4b1fa9f2cc81e2c98");
	const [walletCurrencyCode, setWalletCurrencyCode] = useState("USD");
	const [walletCurrencySymbol, setWalletCurrencySymbol] = useState("$");

	const accountTypeOptions = [
		{ value: "Current Account", label: i18n.t("funding.currentAccount") },
		{ value: "Saving Account", label: i18n.t("funding.savingAccount") }
	];

	useEffect(() => {
		dispatch(getCurrency());
		dispatch(getWalletTransactions(1, walletSelectedCurrency?.id));
	}, [dispatch]);

	const { currentUser } = useSelector(state => state.getCurrentUser);
	const { investors } = useSelector(state => state.investorProfile);
	const { siteSettings, currencies } = useSelector(state => state.siteSettings);
	const { 
		displayLoadMore,
		isLoading,
		isSpinning,
		topupLoader,
		userWalletBalance,
		walletSelectedCurrency,
		walletTransactions,
		walletTransactionsLoader,
		walletDetailsLoader
	 } = useSelector(state => state.wallet);

	useEffect(() => {
		const currencyList = currencies?.map(({ code: label, code: value }) => ({
			label,
			value
		}));
		setCurrency(currencyList);
	}, [currencies]);

	useEffect(() => {
		if (walletSelectedCurrency) {
			setWalletCurrencyCode(walletSelectedCurrency?.code);
			setWalletCurrencySymbol(walletSelectedCurrency?.symbol);
			setWalletCurrencyId(walletSelectedCurrency?.id);
		}
	}, [walletSelectedCurrency]);

	 useLayoutEffect(() => {
		if (siteSettings?.walletModule === "no") {
			history.push(`/`);
		}
	}, [siteSettings?.walletModule]);

	const handleTopUpClose = () => {
		setShowTopUpModal(false);
		reset();
	};

	const handleWithdrawClose = () => {
		setShowWithdrawModal(false);
		withdrawReset();
	};

	const handleWithdrawOpen = () => {
		setShowWithdrawModal(true);
		withdrawReset({
			accountType: investors !== null ? investors?.accountType  === "CHECKING" ? "Current Account" : "Saving Account" : "",
			bankName: investors !== null ? investors?.bankName : "",
			accountNumber: investors !== null ? investors?.accountNumber : "",
			routingNumber: investors !== null ? investors?.routingNumber : ""
		});
	};

	const loadMore = () => {
		setShowMore(showMore + 1);
		dispatch(getWalletTransactions(showMore));
	};

	const onSubmitTopUp = (data) => {
		data.currencyId = walletCurrencyId;
		data.createdAt= Date.now();
		dispatch(addWalletTopUp(data));
		setShowTopUpModal(false);
	};

	useEffect(() => {
		if (getCookie("walletPreapprovalId")) {
			history.push(`/topup-payment/${getCookie("walletPreapprovalId")}`);
		}
	}, [getCookie("walletPreapprovalId")]);

	const onSubmitWithdraw = (data) => {
		data.currencyId = walletCurrencyId;
		data.createdAt = Date.now();
		dispatch(withdrawFromWallet(data));
		handleWithdrawClose()
	};

	const walletList = walletTransactions && walletTransactions?.length > 0 ? 
		walletTransactions?.map((transaction, key) => (
			<tr key={key}>
				<td>{moment(transaction?.createdAt).format(siteSettings.dateFormat)}</td>
				<td>{transaction?.description}</td>
				<td>{transaction?.transactionNumber}</td>
				<td>
					{transaction?.campaignId?.companyId
					? "Wallet"
					: transaction?.gatewayId?.title ?? "-"
					}
				</td>
				<td>
				{transaction?.campaignId?.companyId?.companyName ?
				<Link
						to={`/campaign-detail-page/${transaction?.campaignId?.companyId?.companySlug}`}
						target="_blank"
					>
						{transaction?.campaignId?.companyId?.companyName}
					</Link> 
				: "-"}
				</td>
				<td>{transaction?.walletType}</td>
				<td className="wallet-data-amount">
					{formatCurrency(
						transaction?.amount ?? "0",
						siteSettings.currencySymbolSide,
						transaction?.currencyId?.symbol,
						transaction?.currencyId?.code,
						siteSettings?.decimalPoints
					)} {" "}
					<OverlayTrigger
						placement={isRTL ? "right" : "left"}
						overlay={transaction?.feesDetails ?
							<Tooltip className="wallet-data-popover">
								<Row className="d-flex">
									{i18n.t("wallet.receipt.feesPercentage")}: 
									<span className={isRTL ? "mr-auto" : "ml-auto"}>
										{transaction?.feesDetails?.feesPercentage} %
									</span>
								</Row>
								<Row className="d-flex">
									{i18n.t("wallet.receipt.flatFees")}: 
									<span className={isRTL ? "mr-auto" : "ml-auto"}>
										{formatCurrency(
											transaction?.feesDetails?.feesPercentage ?? "0",
											siteSettings.currencySymbolSide,
											transaction?.currencyId?.symbol,
											transaction?.currencyId?.code,
											siteSettings?.decimalPoints
										)}
									</span>
								</Row>
								<Row className="d-flex">
									{i18n.t("wallet.receipt.transactionFees")}: 
									<span className={isRTL ? "mr-auto" : "ml-auto"}>
										{formatCurrency(
											transaction?.feesDetails?.transactionFees ?? "0",
											siteSettings.currencySymbolSide,
											transaction?.currencyId?.symbol,
											transaction?.currencyId?.code,
											siteSettings?.decimalPoints
										)}
									</span>
								</Row>
							</Tooltip>
						: null}
					>
						<FontAwesomeIcon
							icon={["fas", "info-circle"]}
						/>
					</OverlayTrigger>
				</td>
				<td>
				<Badge
					variant={
						transaction?.status === 0 ? `secondary` :
						transaction?.status === 1 ? `warning` :
						transaction?.status === 2 ? `success` : `danger`
					}
					className="p-1"
				>
					{getWalletStatusCodes(transaction?.status)}
				</Badge>
					
				</td>
			</tr>
		)
	) : walletTransactionsLoader ? (
		<tr>
			<td colSpan="7">
				<Spinner position={"center"} width={"2rem"} height={"2rem"} opacity={"0.5"}/>
			</td>
		</tr>
	) : (
		<tr  className="in-dashboard-content">
			<td colSpan="7">
				<div className="no-data no-data-img-equity">
					<p>{i18n.t("wallet.noTransaction")}</p>
				</div>
			</td>
		</tr>
	)

	if (auth === null) {
		return (
			<Redirect
				to={{
					pathname: "/login",
					state: i18n.t("authentication.redirectSignIn")
				}}
			/>
		);
	}
	if (isLoading || topupLoader) {
		return (
			<>
				<Loading />
			</>
		);
	}

	return (
		<div className="section">
			<Container>
				<Row>
					<Col md={10} xs={8}>
						<Heading alignCenter={false} title={i18n.t("wallet.header")} />
					</Col>
					<Col md={2} xs={4}>
						<Select
							inputId="walletCurrency"
							classNamePrefix="react-select"
							className="react-select-container curreny-select"
							options={currency}
							value={currency.find(c => c.label === walletCurrencyCode)}
							onChange={val => {
								dispatch(setWalletSelectedCurrency(currencies?.find(c => c.code === val.value)));
								dispatch(getWalletTransactions(1, currencies?.find(c => c.code === val.value).id));
							}}
						/>
					</Col>
				</Row>
				<Row>
					<Col md={6} xs={12}>
						<Row className="wallet-balance">
							<Col sm={3}>
								{i18n.t("wallet.walletBalance")}:
							</Col>
							<Col>
								{
									walletDetailsLoader 
									? <Spinner width={"1rem"} height={"1rem"} opacity={"0.5"}/>
									: <b>
										{formatCurrency(
											userWalletBalance ?? 0,
											siteSettings?.currencySymbolSide,
											walletCurrencySymbol,
											walletCurrencyCode,
											siteSettings?.decimalPoints
										)}
									</b>
								}
							</Col>
						</Row>
						<Row className="wallet-id mt-2">
							<Col sm={3}>
								{i18n.t("wallet.walletID")}:
							</Col>
							<Col>
								<b>{currentUser?.walletId}</b>
							</Col>
						</Row>
					</Col>
					<Col md={6} xs={12}>
						<Row className="wallet-btn-group">
							<Col md={9} xs={6}>
							<button 
								className="btn btn-sm btn-primary"
								id="walletTopupBtn"
								type="button"
								onClick={() => setShowTopUpModal(true)}
							>
								{i18n.t("wallet.topUp.title")}
							</button>
							</Col>
							<Col md={1} xs={4}>
							<button
								className="btn btn-sm btn-primary"
								id="walletWithdrawBtn"
								onClick={() => handleWithdrawOpen()}
								type="button"
							>
								{i18n.t("wallet.withdraw.title")}
							</button>
							</Col>
						</Row>
					</Col>
				</Row>
				<Row>
				<Table responsive className="text-center">
					<thead>
						<tr>
							<th>{i18n.t("wallet.tableHeader.date")}</th>
							<th>{i18n.t("wallet.tableHeader.details")}</th>
							<th>{i18n.t("wallet.tableHeader.transactionId")}</th>
							<th>{i18n.t("wallet.tableHeader.paymentGateway")}</th>
							<th>{i18n.t("wallet.tableHeader.campaign")}</th>
							<th>{i18n.t("wallet.tableHeader.type")}</th>
							<th>{i18n.t("wallet.tableHeader.amount")}</th>
							<th>{i18n.t("wallet.tableHeader.status")}</th>
						</tr>
					</thead>
					<tbody>{walletList}</tbody>
				</Table>
				{displayLoadMore ? (
					<div className="mt-5 load-more-btn">
						<Button type="button" variant="primary" onClick={() => loadMore()}>
							{isSpinning ? 
								<div className="spinner-border spinner-border-sm" role="status">
									<span className="sr-only">{i18n.t("common.loading")}</span>
								</div>
								:
								i18n.t("global.loadMore")
							}
						</Button>
					</div>
				) : null}
				</Row>
				<Modal
					show={showTopUpModal}
					onHide={handleTopUpClose}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered
				>
					<Modal.Header>
						<Modal.Title as="h5">
						{i18n.t("wallet.topUp.title")}
						</Modal.Title>
					</Modal.Header>
					<Form name="topUpForm" onSubmit={handleSubmit(onSubmitTopUp)}>
						<Modal.Body>
							<FormGroup className="mb-0 wallet-currency-symbol">
								<FormLabel>
									{i18n.t("wallet.topUp.amount")} <span className="text-important">*</span>
								</FormLabel>
								<span className="custom-input-group-text">{walletCurrencySymbol}</span>
								<input
									id="topUpAmount"
									name="amount"
									className={classNames("form-control", {
										"is-invalid": errors.amount
									})}
									{...register("amount", {
										required:  i18n.t("errors.required"),
										pattern: {
											value: /^[0-9]*$/,
											message: i18n.t("yup.validNumber")
										},
										min: {
											value: 1,
											message: i18n.t("wallet.topUp.minAmount")
										},
										max: {
											value: 999999,
											message: `${i18n.t("wallet.topUp.maxAmount")} ${
												formatCurrency(
													1000000,
													siteSettings?.currencySymbolSide,
													walletCurrencySymbol,
													walletCurrencyCode,
													siteSettings?.decimalPoints
												)
											}`
										}
									})}
								/>
								<span
									className={classNames("custom-input-group-text currency-code", {
										"currency-code-error": errors.amount
									})}
								>{walletCurrencyCode}</span>
								<ErrorMessage
									errors={errors}
									name="amount"
									render={({ message }) => (
										<div className="invalid-feedback d-block" id="topUpAmountErr">
											{message}
										</div>
									)}
								/>
							</FormGroup>
						</Modal.Body>
						<ModalFooter>
							<button 
								className="btn btn-sm btn-primary m-1"
								id="walletTopupSubmit"
								type="submit"
							>
								{i18n.t("wallet.topUp.proceed")}
							</button>
							<button 
								className="btn btn-sm btn-secondary m-1"
								id="walletTopupSubmit"
								type="button"
								onClick={handleTopUpClose}
							>
								{i18n.t("global.cancel")}
							</button>
						</ModalFooter>
					</Form>
				</Modal>
				<Modal
					show={showWithdrawModal}
					onHide={handleWithdrawClose}
					size="lg"
					aria-labelledby="contained-modal-title-vcenter"
					centered
				>
					<Modal.Header className="p-3">
						<Modal.Title as="h3">
						{i18n.t("wallet.withdraw.title")}
						<span className="withdraw-balance">
						{i18n.t("wallet.walletBalance")}: <b>
								{formatCurrency(
									userWalletBalance,
									siteSettings?.currencySymbolSide,
									walletCurrencySymbol,
									walletCurrencyCode,
									siteSettings?.decimalPoints
								)}
							</b>
						</span>
						</Modal.Title>
					</Modal.Header>
					<Form name="withdrawForm" onSubmit={withdrawHandleSubmit(onSubmitWithdraw)}>
						<Modal.Body className="p-4">
							<FormGroup>
								<FormLabel>
									{i18n.t("wallet.withdraw.amount")} <span className="text-important">*</span>
								</FormLabel>
								<input
									id="withdrawAmount"
									name="amount"
									className={classNames("form-control", {
										"is-invalid": withdrawErrors.amount
									})}
									{...withdrawRegister("amount", {
										required:  i18n.t("errors.required"),
										pattern: {
											value: /^[0-9]*$/,
											message: i18n.t("yup.validNumber")
										},
										min: {
											value: 1,
											message: i18n.t("wallet.withdraw.minAmount")
										},
										max: {
											value: userWalletBalance,
											message: `${i18n.t("wallet.withdraw.maxAmount")} ${
												formatCurrency(
													userWalletBalance ?? 0,
													siteSettings?.currencySymbolSide,
													walletCurrencySymbol,
													walletCurrencyCode,
													siteSettings?.decimalPoints
												)
											}`
										},
										validate: value => 
											value < 999999 || `${i18n.t("wallet.withdraw.maxLimit")} ${
											formatCurrency(
												1000000,
												siteSettings?.currencySymbolSide,
												walletCurrencySymbol,
												walletCurrencyCode,
												siteSettings?.decimalPoints
											)
										}`
									})}
								/>
								<ErrorMessage
									errors={withdrawErrors}
									name="amount"
									render={({ message }) => (
										<div className="invalid-feedback d-block" id="withdrawAmountErr">
											{message}
										</div>
									)}
								/>
							</FormGroup>
							<Row>
								<Col md={6}>
									<FormGroup>
										<FormLabel>
											{i18n.t("wallet.withdraw.bankName")} <span className="text-important">*</span>
										</FormLabel>
										<input
											id="withdrawBankName"
											name="bankName"
											className={classNames("form-control", {
												"is-invalid": withdrawErrors.bankName
											})}
											{...withdrawRegister("bankName", {
												required:  i18n.t("errors.required")
											})}
										/>
										<ErrorMessage
											errors={withdrawErrors}
											name="bankName"
											render={({ message }) => (
												<div className="invalid-feedback d-block" id="withdrawBankNameErr">
													{message}
												</div>
											)}
										/>
									</FormGroup>
								</Col>
								<Col md={6}>
									<FormGroup>
										<FormLabel>
											{i18n.t("wallet.withdraw.accountType")} <span className="text-important">*</span>
										</FormLabel>
										<Controller
											name={"accountType"}
											control={withdrawControl}
											rules={{ required: i18n.t("errors.required") }}
											render={({ field: { value, onChange } }) => {
												return (
													<Select
														classNamePrefix="react-select"
														inputId="withdrawAccountType"
														className={classNames("react-select-container", {
															"is-invalid": withdrawErrors.accountType
														})}
														placeholder={i18n.t("funding.selectAccountType")}
														options={accountTypeOptions}
														value={accountTypeOptions.find(c => c.value === value)}
														onChange={val => onChange(val.value)}
													/>
												);
											}}
										/>
										<ErrorMessage
											errors={withdrawErrors}
											name="accountType"
											render={({ message }) => (
												<div className="invalid-feedback d-block" id="withdrawAccountTypeErr">
													{message}
												</div>
											)}
										/>
									</FormGroup>
								</Col>
							</Row>
							<Row>
								<Col md={6}>
									<FormGroup>
										<FormLabel>
											{i18n.t("wallet.withdraw.accountNumber")} <span className="text-important">*</span>
										</FormLabel>
										<input
											id="withdrawAccountNumber"
											name="accountNumber"
											className={classNames("form-control", {
												"is-invalid": withdrawErrors.accountNumber
											})}
											{...withdrawRegister("accountNumber", {
												required:  i18n.t("errors.required"),
												pattern: {
													value: /^[0-9]*$/,
													message: i18n.t("yup.validNumber")
												}
											})}
										/>
										<ErrorMessage
											errors={withdrawErrors}
											name="accountNumber"
											render={({ message }) => (
												<div className="invalid-feedback d-block" id="withdrawAccountNumberErr">
													{message}
												</div>
											)}
										/>
									</FormGroup>
								</Col>
								<Col md={6}>
									<FormGroup>
										<FormLabel>
											{i18n.t("wallet.withdraw.routingNumber")} <span className="text-important">*</span>
										</FormLabel>
										<input
											id="withdrawRoutingNumberNumber"
											name="routingNumber"
											className={classNames("form-control", {
												"is-invalid": withdrawErrors.routingNumber
											})}
											{...withdrawRegister("routingNumber", {
												required:  i18n.t("errors.required"),
												pattern: {
													value: /^[0-9]*$/,
													message: i18n.t("yup.validNumber")
												}
											})}
										/>
										<ErrorMessage
											errors={withdrawErrors}
											name="routingNumber"
											render={({ message }) => (
												<div className="invalid-feedback d-block" id="withdrawRoutingNumberErr">
													{message}
												</div>
											)}
										/>
									</FormGroup>
								</Col>
							</Row>
						</Modal.Body>
						<ModalFooter>
							<button 
								className="btn btn-primary btn-sm"
								id="walletWithdrawSubmit"
								type="submit"
							>
								{i18n.t("global.submit")}
							</button>
							<button 
								className="btn btn-secondary btn-sm"
								id="walletWithdrawCloseBtn"
								type="button"
								onClick={handleWithdrawClose}
							>
								{i18n.t("global.cancel")}
							</button>
						</ModalFooter>
					</Form>
				</Modal>
			</Container>
		</div>
	);
}

export default Wallet;
