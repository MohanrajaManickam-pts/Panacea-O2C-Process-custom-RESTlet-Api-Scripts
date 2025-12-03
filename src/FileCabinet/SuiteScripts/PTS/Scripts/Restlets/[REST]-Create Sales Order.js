/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */

define(['N/record', 'N/search', 'N/runtime'],
    (record, search, runtime) => {

        function post(requestBody) {
            try {

                log.debug("Resquest", requestBody)
                const entityId = requestBody.entity.id;
                if (!entityId) {
                    return { success: false, message: "Entity (customer) is required" };
                }

                // 1. Get Customer location (custom or standard)
                let customerLocation = getCustomerLocation(entityId);

                if (!customerLocation) {
                    return {
                        success: false,
                        message: "Customer does not have a default location. Please configure."
                    };
                }

                // 2. Create Sales Order
                const so = record.create({
                    type: record.Type.SALES_ORDER,
                    isDynamic: true
                });

                so.setValue('entity', entityId);
                let dateValue = requestBody.tranDate;

                if (dateValue) {
                    // Convert "YYYY-MM-DD" into JS Date
                    let parts = dateValue.split("-");
                    let jsDate = new Date(parts[0], parts[1] - 1, parts[2]);  // Month is 0-based
                    so.setValue('trandate', jsDate);
                } else {
                    so.setValue('trandate', new Date());
                }
                so.setValue('location', customerLocation);

                // Custom fields if present
                if (requestBody.custbody_distribution_channel)
                    so.setValue('custbody_distribution_channel', requestBody.custbody_distribution_channel.id);

                if (requestBody.custbody_sales_office)
                    so.setValue('custbody_sales_office', requestBody.custbody_sales_office.id);

                // 3. Add Line Items
                for (let line of (requestBody.items || [])) {
                    so.selectNewLine({ sublistId: 'item' });

                    so.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: line.item.id
                    });

                    so.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: line.quantity
                    });

                    if (line.amount)
                        so.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            value: line.amount
                        });

                    // Set line location (important)
                    so.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: customerLocation
                    });

                    so.commitLine({ sublistId: 'item' });
                }

                const soId = so.save();

                return {
                    success: true,
                    message: "Sales Order created successfully",
                    salesOrderId: soId
                };

            } catch (e) {
                return {
                    success: false,
                    error: e.message,
                    stack: e.stack
                };
            }
        }

        function getCustomerLocation(customerId) {
            // OPTION 1: Get location from customer field e.g. custentity_pref_sup_loc
            // Change this field ID if you have a different field

            log.debug("parseInt(customerId)", parseInt(customerId))

            const lookup = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: parseInt(customerId),
                columns: ['custentity_pref_sup_loc']
            });

            if (lookup.custentity_pref_sup_loc && lookup.custentity_pref_sup_loc[0]) {
                return lookup.custentity_pref_sup_loc[0].value;
            }

            // OPTION 2: If customer does not have a custom default location,
            // you can fallback based on subsidiary or return null.
            return null;
        }

        return { post };
    });
