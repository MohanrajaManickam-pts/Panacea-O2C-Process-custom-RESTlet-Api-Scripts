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
 * limitations under the License
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @author sathish
 * @copyright 2025 [Prateek]
 */
define([
  "./pts_po_print_data_module.js",
  "../../../Libraries/pts_helper.js",
  "N/log",
], function (datamodule, util, log) {


  /**
   * Description placeholder
   *
   * @param {Object} context
   * @author sathish
   */
  function onRequest(context) {
    var allIds = []
    var id = context.id
    log.debug("id", id)
    util.setValue("test", 1)
    datamodule.setLines(allIds)
  }

  return {
    onRequest: onRequest,
  }
})
