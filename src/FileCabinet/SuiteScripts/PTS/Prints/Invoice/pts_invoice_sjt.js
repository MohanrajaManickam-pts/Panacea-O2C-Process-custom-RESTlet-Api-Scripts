
/**
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @author sathish
 * @copyright 2025 [Prateek]
 */

const record = require("../../../../../../__mocks__/N/record")



define([], function () {
    /**
     * Description placeholder
     *
     * @param {Array} context
     * @author sathish.a@prateektechnosoft.com
     */
    function onRequest(context) {

        if (context.type == "view") {

            var santaClause = []


            var recordRec = record.load({
                type: "purchaseorder",
                id: 123
            })

            recordRec.setValue({
                fieldId: "custbody_pts_memo",
                value: 123
            })

            santaClause.push(1)

        }

    }

    return {
        onRequest: onRequest
    }
})
