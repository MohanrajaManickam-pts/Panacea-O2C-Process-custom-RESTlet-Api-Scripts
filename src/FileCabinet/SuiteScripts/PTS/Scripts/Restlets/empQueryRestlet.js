

/**
 * 
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope Public
 * @author sathish
 * @copyright 2025 [Prateek]**
 */
define(["N/scriptTypes/restlet", "N/query"], function (restlet, query) {
    // Restlet entry point
    const post = function (requestBody) {
        // Define the output variable
        let returnValue = ""

        // Create the Employee Query
        const qObj = query.create({
            type: query.Type.EMPLOYEE
        })

        // Check if the requestBody and the employeeId field is defined
        if (!!requestBody && !!requestBody.employeeId) {
            // Define the query condition for employee ID field in Employee record
            qObj.condition = qObj.createCondition({
                fieldId: "id",
                operator: query.Operator.EQUAL,
                values: requestBody.employeeId
            })

            // Add the desired columns in the Query
            qObj.columns = [
                qObj.createColumn({
                    fieldId: "firstname"
                }),
                qObj.createColumn({
                    fieldId: "lastname"
                })
            ]

            // Retrieve the results
            const results = qObj.run().asMappedResults()
            for (let i = 0; i < results.length; i++) {
                const result = results[i]
                returnValue = {
                    name: result.firstname + " " + (result.lastname || "")
                }
            }
        }

        return returnValue
    }

    return { post }
})