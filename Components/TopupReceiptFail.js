import React, { useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import AppPaths from "../../../../../routes/AppPaths";
import "./TopupReceipt.scss";
import i18n from "i18next";
import * as actions from "../../../../../store/actions";


function TopupReceiptFail({ history }) {
	const dispatch = useDispatch();

	useEffect(() => {
		dispatch(actions.resetTopupPaymentData());
	}, [dispatch]);

	return (
		<div className="section">
			<Container>
				<Row className="justify-content-md-center">
					<Col md={7}>
						<div className="investment-receipt-wrapper">
							<FontAwesomeIcon
								icon={["fas", "times-circle"]}
								className="failure-icon"
							/>

							<h3 className="heading-title text-center text-danger">
								{i18n.t("wallet.receipt.receiptFailed")}
							</h3>

							<div className="mt-5 text-center receipt-action">
								<Link
									id="investmentReceiptFailDashboardLink"
									className="btn btn-primary btn-sm"
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

export default TopupReceiptFail;
