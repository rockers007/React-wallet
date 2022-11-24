/* eslint-disable react-hooks/exhaustive-deps */
import React, {useLayoutEffect, useEffect} from "react";

import { Badge, Col, Container, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { isEmpty } from "lodash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import i18n from "i18next";
import Heading from "../../../components/Heading/Heading";
import { formatCurrency } from "../../../../../helpers/numberFormat";
import { getWalletStatusCodes } from "../../../../../helpers/helpers";
import AppPaths from "../../../../../routes/AppPaths";
import * as actions from "../../../../../store/actions";
import { getURL } from "../../../../../helpers/url";
import {
	clearPaypalConfirmPaymentResponse,
	resetTopupPaymentData
} from "../../../../../store/actions";

import "./TopupReceipt.scss";
import { SkeletonReceipt } from "./SkeletonReceipt";

function TopupReceipt({history}) {
	const dispatch = useDispatch();
	const walletPreapprovalId = getURL();
	const {
		paymentReceipt
	}  = useSelector(state => state.wallet);
	const { siteSettings } = useSelector(state => state.siteSettings);

	useLayoutEffect(() => {
		if (siteSettings?.walletModule === "no") {
			history.push(`/`);
		}
	}, [siteSettings?.walletModule]);

	const { stripeResponse } = useSelector(
		state => state.wallet
	);
	
	useEffect(() => {
		if (stripeResponse?.payment_intent) {
			const stripeFormData = new FormData();
			stripeFormData.append("walletPreapprovalId", walletPreapprovalId);
			stripeFormData.append("gatewayId", localStorage.getItem("gatewayId"));
			stripeFormData.append("payType", "stripe");
			stripeFormData.append("createdAt", Date.now());
			stripeFormData.append(
				"paymentConfirmationId",
				stripeResponse?.payment_intent
			);
			if (paymentReceipt?.purchasedShares > 0) {
				stripeFormData.append(
					"purchasedShares",
					paymentReceipt?.purchasedShares
				);
			}
			dispatch(actions.createWalletOfflinePayment(stripeFormData));
		}
	}, [stripeResponse]);

	useEffect(() => {
		if (!isEmpty(paymentReceipt)) {
			dispatch(resetTopupPaymentData(paymentReceipt));
			dispatch(clearPaypalConfirmPaymentResponse(paymentReceipt));
		}
	}, [paymentReceipt]);

	if (isEmpty(paymentReceipt)) {
		return (
			<>
				<SkeletonReceipt />
			</>
		);
	} else {
		return (
			<div className="section">
				<Container>
					<Row className="justify-content-md-center">
						<Col md={7}>
							<div className="investment-receipt-wrapper">
								<FontAwesomeIcon
									icon={["fas", "check-circle"]}
									className="success-icon"
								/>
								<Heading
									alignCenter={true}
									title={`${i18n.t("wallet.receipt.title")}`}
									brif={`${i18n.t("wallet.receipt.brif")}`}
								/>
								<ul className="investment-receipt">
									<li className="investment-receipt-item">
										<span className="investment-receipt-item-left">
											{i18n.t("wallet.receipt.paymentMethod")}
										</span>
										<span className="investment-receipt-item-right">
											{paymentReceipt?.gatewayId.title}
										</span>
									</li>
									<li className="investment-receipt-item">
										<span className="investment-receipt-item-left">
											{i18n.t("wallet.receipt.amount")}
										</span>
										<span className="investment-receipt-item-right">
											{formatCurrency(
												paymentReceipt?.amount,
												siteSettings.currencySymbolSide,
												paymentReceipt.currencyId.symbol,
												paymentReceipt.currencyId.code,
												siteSettings.decimalPoints
											)}
										</span>
									</li>
									{paymentReceipt?.feesDetails ? 
										<>
											<li className="investment-receipt-item">
												<span className="investment-receipt-item-left">
													{i18n.t("wallet.receipt.feesPercentage")}
												</span>
												<span className="investment-receipt-item-right">
													{paymentReceipt?.feesDetails?.feesPercentage} %
												</span>
											</li>
											<li className="investment-receipt-item">
												<span className="investment-receipt-item-left">
													{i18n.t("wallet.receipt.flatFees")}
												</span>
												<span className="investment-receipt-item-right">
													{formatCurrency(
														paymentReceipt?.feesDetails?.flatFees ?? 0,
														siteSettings.currencySymbolSide,
														paymentReceipt.currencyId.symbol,
														paymentReceipt.currencyId.code,
														siteSettings.decimalPoints
													)}
												</span>
											</li>
											<li className="investment-receipt-item">
												<span className="investment-receipt-item-left">
													{i18n.t("wallet.receipt.transactionFees")}
												</span>
												<span className="investment-receipt-item-right">
													{formatCurrency(
														paymentReceipt?.feesDetails?.transactionFees ?? 0,
														siteSettings.currencySymbolSide,
														paymentReceipt.currencyId.symbol,
														paymentReceipt.currencyId.code,
														siteSettings.decimalPoints
													)}
												</span>
											</li>
										</>
									: null}
									<li className="investment-receipt-item">
										<span className="investment-receipt-item-left">
											{i18n.t("wallet.receipt.transactionId")}
										</span>
										<span className="investment-receipt-item-right">
											{paymentReceipt?.transactionNumber}
										</span>
									</li>
									<li className="investment-receipt-item">
										<span className="investment-receipt-item-left">
											{i18n.t("wallet.receipt.status")}
										</span>
										<span>
											<Badge
												variant={
													paymentReceipt?.status === 0 ? `secondary` :
													paymentReceipt?.status === 1 ? `warning` :
													paymentReceipt?.status === 2 ? `success` : `danger`
												}
												className="p-1 investment-receipt-item-right"
											>
												{getWalletStatusCodes(paymentReceipt?.status)}
											</Badge>
										</span>
									</li>
								</ul>
								<div className="mt-5 text-center receipt-action">
									<Link
										id="topupReceiptHomeLink"
										className="btn btn-primary btn-sm"
										to={AppPaths.HOME_PATH}
									>
										{i18n.t("wallet.receipt.home")}
									</Link>
									<Link
										id="topupReceiptTrackLink"
										className="btn btn-outline-secondary btn-sm second-inline-button"
										to={AppPaths.WALLET_PATH}
									>
										{i18n.t("wallet.receipt.wallet")}
									</Link>
								</div>
							</div>
						</Col>
					</Row>
				</Container>
			</div>
		);
	}
}

export default TopupReceipt;
