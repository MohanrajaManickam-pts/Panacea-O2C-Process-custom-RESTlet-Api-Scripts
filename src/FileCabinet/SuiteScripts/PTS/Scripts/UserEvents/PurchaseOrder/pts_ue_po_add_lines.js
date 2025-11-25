
/**
 * 
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
   * @param {Objects} context
   * @author sathish
   */
  function beforeSubmit(context) {
    var rec = context.newRecord
    var memo = rec.getValue("memo")
    log.debug("memmo", memo)
  }

  return {
    beforeSubmit: beforeSubmit,
  }
})
