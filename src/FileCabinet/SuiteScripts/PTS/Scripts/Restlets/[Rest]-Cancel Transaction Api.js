/**
 *@NApiVersion 2.1
 *@NModuleScope Public
 *@author Mohanraja Manickam
 *@NScriptType Restlet
 *@copyright 2025 [Prateek]**
 */
define(['N/record', 'N/error', "N/search"], (record, error, search) => {

    /**
     * Description placeholder
     *
     * @param {*} request
     * @author Mohanraja Manickam
     */
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

            if (transType === "salesorder") {


                let invoiceSearch = search.create({
                    type: search.Type.INVOICE,
                    filters: [["createdfrom", "anyof", internalId]],
                    columns: ["internalid"]
                }).run().getRange({ start: 0, end: 1 });

                if (invoiceSearch && invoiceSearch.length > 0) {
                    return {
                        success: false,
                        error: "Cannot cancel Sales Order. Invoice exists. Cancel the Invoice first."
                    };
                }


                let soRec = record.load({
                    type: record.Type.SALES_ORDER,
                    id: internalId,
                    isDynamic: true
                });

                let billingStatus = soRec.getValue("status");


                if (billingStatus === "Billed" || billingStatus === "Fully Billed") {
                    return {
                        success: false,
                        error: "Sales Order is fully billed. Cannot be cancelled."
                    };
                }


                let lineCount = soRec.getLineCount({ sublistId: 'item' });

                for (let i = 0; i < lineCount; i++) {
                    let billedQty = soRec.getSublistValue({
                        sublistId: 'item', fieldId: 'quantitybilled', line: i
                    });
                    let orderedQty = soRec.getSublistValue({
                        sublistId: 'item', fieldId: 'quantity', line: i
                    });

                    // Close ONLY unbilled portion
                    if (billedQty < orderedQty) {
                        soRec.selectLine({ sublistId: 'item', line: i });
                        soRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'isclosed',
                            value: true
                        });
                        soRec.commitLine({ sublistId: 'item' });
                    }
                }

                let saved = soRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                return {
                    success: true,
                    message: "Sales Order cancelled (unbilled lines closed).",
                    type: "salesorder",
                    internalid: saved
                };
            }

            else if (transType === "invoice") {

                let paymentSearch = search.create({
                    type: search.Type.CUSTOMER_PAYMENT,
                    filters: [["appliedtotransaction", "anyof", internalId]],
                    columns: ["internalid"]
                }).run().getRange({ start: 0, end: 1 });

                if (paymentSearch && paymentSearch.length > 0) {
                    return {
                        success: false,
                        error: "Cannot void Invoice. A payment is applied. Unapply the payment first."
                    };
                }

                // 🔥 Try using NetSuite's built-in VOID function (works in modern NetSuite)
                try {
                    let voidResult = record.void({
                        type: record.Type.INVOICE,
                        id: internalId
                    });

                    return {
                        success: true,
                        message: "Invoice voided successfully via system void.",
                        internalid: internalId
                    };
                } catch (e) {
                    // Fallback if record.void() not supported
                    let creditMemo = record.transform({
                        fromType: record.Type.INVOICE,
                        fromId: internalId,
                        toType: record.Type.CUSTOMER_CREDIT,
                        isDynamic: true
                    });

                    let cmId = creditMemo.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });

                    return {
                        success: true,
                        message: "Invoice cancelled by creating a Credit Memo (fallback method).",
                        internalid: internalId,
                        creditmemo: cmId
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
