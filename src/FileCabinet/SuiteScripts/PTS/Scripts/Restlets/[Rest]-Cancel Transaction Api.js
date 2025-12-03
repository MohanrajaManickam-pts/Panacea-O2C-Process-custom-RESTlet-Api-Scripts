/**
 *@NApiVersion 2.1
 *@NModuleScope Public
 *@NScriptType Restlet
 */

define(["N/record", "N/error", "N/search"], (record, error, search) => {

    function post(request) {
        try {
            const transType = (request.transtype || "").toLowerCase();
            const internalId = request.internalid;
            const options = {
                bin: request.bin || null,
                creditType: request.creditType || ""
            };

            if (!transType || !internalId) {
                return apiResponse(false, "Missing required inputs", null, {
                    missing_fields: ["transtype", "internalid"]
                });
            }


            switch (transType) {

                case "salesorder":
                    return cancelSalesOrder(internalId);

                case "invoice":
                    return cancelInvoice(internalId, options);

                default:
                    return apiResponse(false, "Invalid transtype. Must be 'salesorder' or 'invoice'");
            }

        } catch (e) {
            return apiResponse(false, "Fatal error", null, { details: e.message });
        }
    }

    // ======================================================================
    // ⭐ COMMON API RESPONSE HANDLER
    // ======================================================================
    function apiResponse(success, message, data = null, errors = null) {
        return { success, message, data, errors };
    }

    // ======================================================================
    // ⭐ SALES ORDER CANCELLATION — CLOSE ALL LINES + CLEAR INVENTORY DETAIL
    // ======================================================================
    function cancelSalesOrder(internalId) {

        // Check active invoice
        let invoiceCheck = search.create({
            type: search.Type.INVOICE,
            filters: [
                ["createdfrom", "anyof", internalId],
                "AND", ["mainline", "is", "T"],
                "AND", ["status", "noneof", "CustInvc:V"],
                "AND", ["amountremaining", "greaterthan", "0"]
            ],
            columns: ["internalid"]
        }).run().getRange({ start: 0, end: 1 });

        if (invoiceCheck.length > 0) {
            return apiResponse(false,
                "Cannot cancel Sales Order. Invoice still open.",
                null,
                { invoice_id: invoiceCheck[0].id }
            );
        }

        // Load record
        let soRec = record.load({
            type: record.Type.SALES_ORDER,
            id: internalId,
            isDynamic: true
        });

        let lineCount = soRec.getLineCount({ sublistId: "item" });

        for (let i = 0; i < lineCount; i++) {

            soRec.selectLine({ sublistId: "item", line: i });

            // (1) Close Line
            soRec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "isclosed",
                value: true
            });

            // (2) Remove Inventory Detail if exists
            try {
                let invDetail = soRec.getCurrentSublistSubrecord({
                    sublistId: "item",
                    fieldId: "inventorydetail"
                });

                if (invDetail) {
                    let invCount = invDetail.getLineCount({ sublistId: "inventoryassignment" });

                    for (let j = invCount - 1; j >= 0; j--) {
                        invDetail.removeLine({
                            sublistId: "inventoryassignment",
                            line: j
                        });
                    }
                }

            } catch (e) {
                // No inventory detail — ignore
            }

            soRec.commitLine({ sublistId: "item" });
        }

        let savedId = soRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });

        return apiResponse(true, "Sales Order closed successfully", {
            salesorder_id: savedId,
            status: "Closed"
        });
    }

    // ======================================================================
    // ⭐ INVOICE CANCELLATION (Dynamic Logic Based on Item Types)
    // ======================================================================
    function cancelInvoice(internalId, options) {

        // Check payment exists
        let payCheck = search.create({
            type: search.Type.CUSTOMER_PAYMENT,
            filters: [["appliedtotransaction", "anyof", internalId]],
            columns: ["internalid"]
        }).run().getRange({ start: 0, end: 1 });

        if (payCheck.length > 0) {
            return apiResponse(false,
                "Cannot cancel Invoice. Payment applied.",
                null,
                { payment_id: payCheck[0].id }
            );
        }

        log.debug("Procced Invoice Cancellation", "Invoice ID: " + internalId);

        let invRec = record.load({
            type: record.Type.INVOICE,
            id: internalId,
            isDynamic: false
        });

        let lineCount = invRec.getLineCount({ sublistId: "item" });

        let onlyNonInvAndService = true;

        for (let i = 0; i < lineCount; i++) {

            let itemId = invRec.getSublistValue({
                sublistId: "item",
                fieldId: "item",
                line: i
            });

            let itemInfo = search.lookupFields({
                type: search.Type.ITEM,
                id: itemId,
                columns: ["type"]
            });

            let type = itemInfo.type[0].value;

            if (type !== "Service" && type !== "NonInvtPart") {

                onlyNonInvAndService = false;
            }
        }

        if (onlyNonInvAndService) {
            return directCreditMemo(internalId);
        }

        return fullRAFlow(internalId, options);
    }

    // ======================================================================
    // ⭐ DIRECT CREDIT MEMO FOR NON-INVENTORY / SERVICE
    // ======================================================================
    function directCreditMemo(internalId) {

        log.debug("Procced to Create DirectCredit Memo", "Invoice ID: " + internalId);

        try {
            let cmRec = record.transform({
                fromType: record.Type.INVOICE,
                fromId: internalId,
                toType: record.Type.CREDIT_MEMO,
                isDynamic: true
            });

            cmRec.setValue({
                fieldId: "taxdetailsoverride",
                value: false
            });

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

            let applyCount = cmApply.getLineCount({ sublistId: "apply" });

            for (let i = 0; i < applyCount; i++) {
                let appliedId = cmApply.getSublistValue({
                    sublistId: "apply",
                    fieldId: "internalid",
                    line: i
                });

                if (String(appliedId) === String(internalId)) {

                    cmApply.selectLine({ sublistId: "apply", line: i });

                    cmApply.setCurrentSublistValue({
                        sublistId: "apply",
                        fieldId: "apply",
                        value: true
                    });

                    cmApply.commitLine({ sublistId: "apply" });
                }
            }

            let cmFinalId = cmApply.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            return apiResponse(true,
                "Invoice cancelled using Direct Credit Memo",
                {
                    invoice_id: internalId,
                    creditmemo_id: cmFinalId
                });

        } catch (e) {
            return apiResponse(false, "Direct Credit Memo failed", null, { details: e.message });
        }
    }

    // ======================================================================
    // ⭐ FULL INVENTORY FLOW → RA → IR → CM
    // ======================================================================
    function fullRAFlow(internalId, options) {

        log.debug("Procced to FullFlow", "Invoice ID: " + internalId);
        log.debug("Procced to FullFlow", "options: " + options);

        try {
            // RA
            let raRec = record.transform({
                fromType: record.Type.INVOICE,
                fromId: internalId,
                toType: record.Type.RETURN_AUTHORIZATION,
                isDynamic: true
            });

            let raId = raRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug("Return Authorization Created", "RA ID: " + raId);
            try {

                // Item Receipt
                let irRec = record.transform({
                    fromType: record.Type.RETURN_AUTHORIZATION,
                    fromId: raId,
                    toType: record.Type.ITEM_RECEIPT,
                    isDynamic: false
                });


                if (options.creditType != "" && options.creditType == "Credit Note-Item Return") {
                    var creditTypeId = "1"; //Credit Note-Item Return
                }

                if (!creditTypeId) {
                    return apiResponse(false, "Missing required inputs", null, {
                        missing_fields: ["credit type"]
                    });
                }
                // ⭐ SET CREDIT TYPE ONLY ON ITEM RECEIPT
                try {
                    irRec.setValue({
                        fieldId: "custbody_cus_pts_cre_re",
                        value: creditTypeId  // LIST/SELECT internal ID = 1
                    });
                } catch (e) {
                    log.debug("Failed to set credit type on IR", e.message);
                }

                // ******** BIN AND INVENTORY DETAIL COPY ********
                const irLineCount = irRec.getLineCount({ sublistId: 'item' });

                // Resolve bin internal id if name was provided
                let resolvedBinId = null;
                if (options.bin) {
                    let bs = search.create({
                        type: 'bin',
                        filters: [['name', 'is', options.bin]],
                        columns: ['internalid']
                    }).run().getRange({ start: 0, end: 1 });

                    if (bs.length > 0) {
                        resolvedBinId = bs[0].getValue({ name: 'internalid' });
                    }
                }

                let raRecReload = record.load({
                    type: record.Type.RETURN_AUTHORIZATION,
                    id: raId,
                    isDynamic: false
                });

                for (let i = 0; i < irLineCount; i++) {

                    let irInvDet = null;

                    try {
                        irInvDet = irRec.getSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail',
                            line: i
                        });
                    } catch (e) { continue; }

                    let raInvDet = null;

                    try {
                        raInvDet = raRecReload.getSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail',
                            line: i
                        });
                    } catch (e) { continue; }

                    let raCount = raInvDet.getLineCount({ sublistId: 'inventoryassignment' });

                    // Clear IR first
                    for (let rm = irInvDet.getLineCount({ sublistId: 'inventoryassignment' }) - 1; rm >= 0; rm--) {
                        irInvDet.removeLine({ sublistId: 'inventoryassignment', line: rm });
                    }

                    for (let j = 0; j < raCount; j++) {

                        let lot = raInvDet.getSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'receiptinventorynumber',
                            line: j
                        });

                        let statusId = raInvDet.getSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'inventorystatus',
                            line: j
                        });

                        let qty = raInvDet.getSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            line: j
                        });

                        irInvDet.selectNewLine({ sublistId: 'inventoryassignment' });

                        irInvDet.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'receiptinventorynumber',
                            value: lot
                        });

                        // ⭐ SET BIN ONLY ON ITEM RECEIPT
                        if (resolvedBinId) {
                            irInvDet.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'binnumber',
                                value: resolvedBinId
                            });
                        }

                        if (statusId) {
                            irInvDet.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'inventorystatus',
                                value: statusId
                            });
                        }

                        irInvDet.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            value: qty
                        });

                        irInvDet.commitLine({ sublistId: 'inventoryassignment' });
                    }
                }

                let irId = irRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug("Item Receipt Created", "IR ID: " + irId);

            } catch (e) {
                log.error("RA → Item Receipt Transform ERROR", e);
                throw error.create({
                    name: "RA_TRANSFORM_FAILED",
                    message: "NetSuite failed to transform Return Authorization to Item Receipt. Reason: " + e.message
                });
            }
            // Credit Memo
            let cmRec = record.transform({
                fromType: record.Type.RETURN_AUTHORIZATION,
                fromId: raId,
                toType: record.Type.CREDIT_MEMO,
                isDynamic: true
            });

            cmRec.setValue({
                fieldId: "taxdetailsoverride",
                value: false
            });

            let cmId = cmRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            log.debug("Credit Memo Created", "CM ID: " + cmId);

            return apiResponse(true,
                "Invoice cancelled using Inventory Flow (RA → Item Receipt → Credit Memo)",
                {
                    invoice_id: internalId,
                    return_authorization_id: raId,
                    item_receipt_id: irId,
                    creditmemo_id: cmId
                });

        } catch (e) {
            return apiResponse(false, "Inventory cancellation flow failed", null, { details: e.message });
        }
    }

    return { post };
});
