/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/error'], function (record, error) {

    function post(request) {
        try {
            if (!request.salesorder_id) {
                throw error.create({
                    name: 'MISSING_SO_ID',
                    message: 'Sales Order ID is required'
                });
            }
            try {

                // Transform Sales Order → Invoice
                var invoiceRecord = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: request.salesorder_id,
                    toType: record.Type.INVOICE,
                    isDynamic: true
                });

            } catch (error) {

                log.error('Error transforming Sales Order to Invoice', error.message);
                throw error;

            }


            var invoiceId = invoiceRecord.save();
            log.debug('Invoice Created', 'Invoice ID: ' + invoiceId);

            return {
                success: true,
                message: 'Invoice created successfully',
                invoice_id: invoiceId
            };

        } catch (e) {
            return {
                success: false,
                error: e.message
            };
        }
    }

    return { post: post };
});
