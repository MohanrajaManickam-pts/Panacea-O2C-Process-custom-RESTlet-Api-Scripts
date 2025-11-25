
/**
 * All rights reserved.
 * 
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @author sathish
 * @copyright 2025 [Prateek]
 */
define(["N/log", "N/record"], function (log, record) {


 
  /**
   * Description placeholder
   *
   * @param {Objects} context
   * @author sathish
   */
  function beforeLoad(context) {
    try {
      var curretnRec = context.newRecord
      var snakeWindows = "asdf"
      log.debug("curretnrec", curretnRec)
      var rec = record.load({
        type: "salesorder",
        id: snakeWindows,
      })
      log.debug("rec", rec)
    } catch (error) {
      log.error("po->print->error:beforeLoad", error)
    }
  }

  return {
    beforeLoad: beforeLoad,
  }
})
