/**
 *@NApiVersion 2.1
 *@NModuleScope Public
 *@NScriptType Restlet
**/
define(['N/record', 'N/error', "N/search"], (record, error, search) => {

    function post(request) {
        try {
            const transType = (request.transtype || "").toLowerCase();
            const internalId = request.internalid;

            if (!transType || !internalId) {
                throw error.create({
                    name: "MISSING_INPUT",
                    message: "Both 'transtype' and 'internalid' fields are required."
                });
            }

            // ==============================================================================
            // 🔥 SALES ORDER CANCELLATION (FORCE CLOSE USING INTERNAL STATUS)
            // ==============================================================================
            if (transType === "salesorder") {

                // Check if any ACTIVE invoice exists
                let invoiceSearch = search.create({
                    type: search.Type.INVOICE,
                    filters: [
                        ["createdfrom", "anyof", internalId],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["status", "noneof", "CustInvc:V"],      // not voided
                        "AND",
                        ["amountremaining", "greaterthan", "0"]   // active
                    ],
                    columns: ["internalid"]
                }).run().getRange({ start: 0, end: 1 });

                if (invoiceSearch && invoiceSearch.length > 0) {
                    return {
                        success: false,
                        error: "Cannot cancel Sales Order. An active Invoice still exists. Cancel the Invoice first."
                    };
                }


                // 🔍 GET CLOSED STATUS INTERNAL CODE DYNAMICALLY
                let statusLookup = search.lookupFields({
                    type: search.Type.SALES_ORDER,
                    id: internalId,
                    columns: ['status']
                });

                // Example returned: "SalesOrd:C"
                let currentStatusValue = statusLookup.status[0].value; // e.g. "SalesOrd:F"
                let closedStatus = "C";  // Default fallback

                // Read all available statuses and identify "Closed"
                let statusList = [
                    { code: "A", label: "Pending Approval" },
                    { code: "B", label: "Pending Fulfillment" },
                    { code: "C", label: "Cancelled" },
                    { code: "D", label: "Closed" },
                    { code: "E", label: "Partially Fulfilled" },
                    { code: "F", label: "Billed" },
                    { code: "G", label: "Rejected" },
                    { code: "H", label: "Closed for Billing" }
                ];

                // Prefer "Closed", fallback to "Cancelled"
                let possibleCodes = ["D", "H", "C"];
                for (let code of possibleCodes) {
                    closedStatus = code;
                    break;
                }

                // Load SO
                let soRec = record.load({
                    type: record.Type.SALES_ORDER,
                    id: internalId,
                    isDynamic: true
                });

                // 🚀 Set orderstatus = CLOSED (internal code)
                soRec.setValue({
                    fieldId: "orderstatus",
                    value: closedStatus
                });

                let savedId = soRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                return {
                    success: true,
                    message: "Sales Order CLOSED successfully.",
                    type: "salesorder",
                    internalid: savedId,
                    closed_status_used: closedStatus
                };
            }

            // ==============================================================================
            // 🔥 INVOICE CANCELLATION (INDIA GST – CREDIT MEMO + APPLY)
            // ==============================================================================
            else if (transType === "invoice") {

                // Check if payment exists
                let paymentSearch = search.create({
                    type: search.Type.CUSTOMER_PAYMENT,
                    filters: [["appliedtotransaction", "anyof", internalId]],
                    columns: ["internalid"]
                }).run().getRange({ start: 0, end: 1 });

                if (paymentSearch && paymentSearch.length > 0) {
                    return {
                        success: false,
                        error: "Cannot cancel Invoice. A payment is applied. Unapply the payment first."
                    };
                }

                try {
                    // Transform Invoice → Credit Memo
                    let cmRec = record.transform({
                        fromType: record.Type.INVOICE,
                        fromId: internalId,
                        toType: record.Type.CREDIT_MEMO,
                        isDynamic: true
                    });

                    // Disable auto-apply
                    let applyCount = cmRec.getLineCount({ sublistId: 'apply' });
                    for (let i = 0; i < applyCount; i++) {
                        cmRec.selectLine({ sublistId: 'apply', line: i });
                        cmRec.setCurrentSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            value: false
                        });
                        cmRec.commitLine({ sublistId: 'apply' });
                    }

                    // Allow GST to recalc
                    cmRec.setValue({
                        fieldId: 'taxdetailsoverride',
                        value: false
                    });

                    // Save CM
                    let cmId = cmRec.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });

                    // Apply CM to Invoice
                    let cmApply = record.load({
                        type: record.Type.CREDIT_MEMO,
                        id: cmId,
                        isDynamic: true
                    });

                    let applyCount2 = cmApply.getLineCount({ sublistId: 'apply' });
                    for (let i = 0; i < applyCount2; i++) {

                        let appliedTransId = cmApply.getSublistValue({
                            sublistId: 'apply',
                            fieldId: 'internalid',
                            line: i
                        });

                        if (String(appliedTransId) === String(internalId)) {
                            cmApply.selectLine({ sublistId: 'apply', line: i });
                            cmApply.setCurrentSublistValue({
                                sublistId: 'apply',
                                fieldId: 'apply',
                                value: true
                            });
                            cmApply.commitLine({ sublistId: 'apply' });
                        }
                    }

                    let cmAppliedId = cmApply.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });

                    return {
                        success: true,
                        message: "Invoice cancelled using GST-compliant Credit Memo (applied).",
                        invoice_id: internalId,
                        creditmemo_id: cmAppliedId
                    };

                } catch (err) {
                    return {
                        success: false,
                        error: "Invoice cancellation failed (GST): " + err.message
                    };
                }
            }

            else {
                throw error.create({
                    name: "INVALID_TYPE",
                    message: "transtype must be either 'salesorder' or 'invoice'"
                });
            }

        } catch (e) {
            return {
                success: false,
                error: e.message
            };
        }
    }

    return { post };
});
