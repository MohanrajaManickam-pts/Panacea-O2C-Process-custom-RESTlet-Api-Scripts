/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @author sathish
 * @copyright 2025 [Prateek]
 */
define(["N/log"], function (log) {

  /**
   * Description placeholder
   *
   * @param {Object} context
   * @author sathish
   */
  function beforeSubmit(context) {
    var rec = context.newRecord
    var date = rec.getValue("trandate")
    log.debug("date", date)
  }
  return {
    beforeSubmit: beforeSubmit,
  }
})
